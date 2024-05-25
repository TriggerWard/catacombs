//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

contract WardenManager {
    struct Warden {
        string ipfsInfo;
        string nillionKey;
        bytes32 assertionId;
        bool isSlashed;
        mapping(address => mapping(IERC20 => uint256)) stakersToStakedBalances;
        mapping(IERC20 => uint256) stakedBalances;
    }

    mapping(address => Warden) public wardens;
    mapping(bytes32 => address) public assertionIdToWarden;
    ExtendedOptimisticOracleV3Interface public optimisticOracle;

    constructor(address _optimisticOracle) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
    }

    function registerWarden(string memory wardenIpfsInfo, string memory wardenNillionKey) public {
        wardens[msg.sender].ipfsInfo = wardenIpfsInfo;
        wardens[msg.sender].nillionKey = wardenNillionKey;
    }

    function stakeOnWarden(address warden, IERC20 token, uint256 amount) public {
        token.transferFrom(msg.sender, address(this), amount);
        wardens[warden].stakersToStakedBalances[msg.sender][token] += amount;
        wardens[warden].stakedBalances[token] += amount;
    }

    function withdrawStake(address warden, IERC20 token, uint256 amount) public {
        require(wardens[warden].stakersToStakedBalances[msg.sender][token] >= amount, "Not enough staked tokens");
        require(wardens[warden].assertionId == bytes32(0), "Cannot withdraw staked tokens while assertion is pending");
        wardens[warden].stakersToStakedBalances[msg.sender][token] -= amount;
        wardens[warden].stakedBalances[token] -= amount;
        token.transfer(msg.sender, amount);
    }

    function slashWarden(address warden) public {
        require(wardens[warden].assertionId == bytes32(0), "Cannot slash warden while assertion is pending");

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
            address(0),
            address(0), // No sovereign security.
            optimisticOracle.defaultLiveness(),
            bondCurrency,
            bondAmount,
            optimisticOracle.defaultIdentifier(),
            bytes32(0) // No domain.
        );

        wardens[warden].assertionId = assertionId;
        assertionIdToWarden[assertionId] = warden;
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) public {
        require(msg.sender == address(optimisticOracle));
        // If the assertion was true, then the warden is slashed.
        if (assertedTruthfully) {
            wardens[assertionIdToWarden[assertionId]].isSlashed = true;
        } else {
            wardens[assertionIdToWarden[assertionId]].assertionId = bytes32(0);
            assertionIdToWarden[assertionId] = address(0);
        }
    }

    function executeSlash(address warden, IERC20 token) public {
        require(wardens[warden].isSlashed, "Warden is not slashed");
        wardens[warden].stakersToStakedBalances[msg.sender][token] = 0;
        token.transfer(address(0), wardens[warden].stakedBalances[token]);
        wardens[warden].stakedBalances[token] = 0;
    }

    function assertionDisputedCallback(bytes32 assertionId) public {
        wardens[assertionIdToWarden[assertionId]].assertionId = bytes32(0);
        assertionIdToWarden[assertionId] = address(0);
    }
}
