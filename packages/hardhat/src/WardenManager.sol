//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";
import "@uma/core/contracts/common/implementation/MultiCaller.sol";

contract WardenManager {
    struct Warden {
        string ipfsInfoHash;
        string nillionKey;
        bytes32 assertionId;
        bool isSlashed;
        mapping(address => mapping(IERC20 => uint256)) stakersToStakedBalances;
        mapping(IERC20 => uint256) stakedBalances;
    }

    mapping(address => Warden) public wardens;
    mapping(bytes32 => address) public assertionIdToWarden;
    ExtendedOptimisticOracleV3Interface public optimisticOracle;
    uint64 public optimisticOracleLiveness;

    // Events
    event WardenRegistered(address indexed warden, string ipfsInfoHash, string nillionKey);
    event StakePlaced(address indexed warden, address indexed staker, IERC20 token, uint256 amount);
    event StakeWithdrawn(address indexed warden, address indexed staker, IERC20 token, uint256 amount);
    event WardenSlashed(address indexed warden, bytes32 assertionId, address indexed caller);
    event SlashExecuted(address indexed warden, IERC20 token, uint256 amount, address indexed caller);
    event AssertionResolved(bytes32 indexed assertionId, bool assertedTruthfully, address indexed caller);
    event AssertionDisputed(bytes32 indexed assertionId, address indexed warden, address indexed caller);

    error AssertionPending(address warden);
    error WardenSlashPending(address warden);
    error WardenAlreadySlashed(address warden);
    error WardenNotSlashed(address warden);

    error InsufficientStake();
    error MustBeOracle();

    constructor(address _optimisticOracle, uint64 _optimisticOracleLiveness) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
        optimisticOracleLiveness = _optimisticOracleLiveness;
    }

    function getWardenStakeInToken(address warden, IERC20 token) public view returns (uint256) {
        return wardens[warden].stakedBalances[token];
    }

    function getWardenInfo(address warden)
        public
        view
        returns (string memory ipfsInfoHash, string memory nillionKey, bytes32 assertionId, bool isSlashed)
    {
        return (
            wardens[warden].ipfsInfoHash,
            wardens[warden].nillionKey,
            wardens[warden].assertionId,
            wardens[warden].isSlashed
        );
    }

    function getUserStakeOnWarden(address warden, address user, IERC20 token) public view returns (uint256) {
        return wardens[warden].stakersToStakedBalances[user][token];
    }

    function registerWarden(string memory wardenIpfsInfoHash, string memory wardenNillionKey) public {
        wardens[msg.sender].ipfsInfoHash = wardenIpfsInfoHash;
        wardens[msg.sender].nillionKey = wardenNillionKey;
        emit WardenRegistered(msg.sender, wardenIpfsInfoHash, wardenNillionKey);
    }

    function stakeOnWarden(address warden, IERC20 token, uint256 amount) public {
        if (wardens[warden].assertionId != bytes32(0)) revert AssertionPending(warden);
        if (wardens[warden].isSlashed) revert WardenAlreadySlashed(warden);

        token.transferFrom(msg.sender, address(this), amount);
        wardens[warden].stakersToStakedBalances[msg.sender][token] += amount;
        wardens[warden].stakedBalances[token] += amount;
        emit StakePlaced(warden, msg.sender, token, amount);
    }

    function withdrawStake(address warden, IERC20 token, uint256 amount) public {
        if (wardens[warden].stakersToStakedBalances[msg.sender][token] <= amount) revert InsufficientStake();
        if (wardens[warden].assertionId != bytes32(0)) revert AssertionPending(warden);
        if (wardens[warden].isSlashed) revert WardenAlreadySlashed(warden);
        wardens[warden].stakersToStakedBalances[msg.sender][token] -= amount;
        wardens[warden].stakedBalances[token] -= amount;
        token.transfer(msg.sender, amount);
        emit StakeWithdrawn(warden, msg.sender, token, amount);
    }

    function slashWarden(address warden) public {
        if (wardens[warden].assertionId != bytes32(0)) revert WardenSlashPending(warden);

        // Pull OO bonds. Caller must first approve minimum bond amount of default currency.
        IERC20 bondCurrency = IERC20(optimisticOracle.defaultCurrency());
        uint256 bondAmount = optimisticOracle.getMinimumBond(address(bondCurrency));
        bondCurrency.transferFrom(msg.sender, address(this), bondAmount);

        bondCurrency.approve(address(optimisticOracle), bondAmount); // Approve OO to spend bond and make assertion.
        address asserter = msg.sender;
        bytes32 assertionId = optimisticOracle.assertTruth(
            abi.encodePacked(
                "Crypt Warden behavour disputed. Warden: ",
                ClaimData.toUtf8BytesAddress(warden),
                " and asserter: 0x",
                ClaimData.toUtf8BytesAddress(asserter),
                " at timestamp: ",
                ClaimData.toUtf8BytesUint(block.timestamp),
                " in the WardenManager contract at 0x",
                ClaimData.toUtf8BytesAddress(address(this))
            ),
            asserter,
            address(this), // This is callback recipient. Use this contract address as the callback target.
            address(0), // No sovereign security.
            optimisticOracleLiveness,
            bondCurrency,
            bondAmount,
            optimisticOracle.defaultIdentifier(),
            bytes32(0) // No domain.
        );

        wardens[warden].assertionId = assertionId;
        assertionIdToWarden[assertionId] = warden;
        emit WardenSlashed(warden, assertionId, msg.sender);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) public {
        if (msg.sender != address(optimisticOracle)) revert MustBeOracle();

        // If the assertion was true, then the warden is slashed.
        if (assertedTruthfully) {
            wardens[assertionIdToWarden[assertionId]].isSlashed = true;
        } else {
            wardens[assertionIdToWarden[assertionId]].assertionId = bytes32(0);
            assertionIdToWarden[assertionId] = address(0);
        }
        emit AssertionResolved(assertionId, assertedTruthfully, msg.sender);
    }

    function executeSlash(address warden, IERC20 token) public {
        if (!wardens[warden].isSlashed) revert WardenNotSlashed(warden);
        uint256 amount = wardens[warden].stakedBalances[token];
        wardens[warden].stakersToStakedBalances[msg.sender][token] = 0;
        token.transfer(0x000000000000000000000000000000000000dEaD, amount);
        wardens[warden].stakedBalances[token] = 0;
        emit SlashExecuted(warden, token, amount, msg.sender);
    }

    function assertionDisputedCallback(bytes32 assertionId) public {
        wardens[assertionIdToWarden[assertionId]].assertionId = bytes32(0);
        assertionIdToWarden[assertionId] = address(0);
        emit AssertionDisputed(assertionId, assertionIdToWarden[assertionId], msg.sender);
    }
}
