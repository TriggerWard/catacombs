//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";
import "./interfaces/DecryptCallbackInterface.sol";

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

import "forge-std/console.sol";
import "forge-std/Test.sol";

contract CryptManager is Test {
    struct Crypt {
        string ipfsDataHash;
        bytes decryptTrigger;
        string nillionCrypt;
        address decryptCallback;
        address cryptOwner;
        bytes32 assertionId;
        bool isFinalized;
    }

    Crypt[] public crypts;
    mapping(bytes32 => uint256) public assertionIdToCryptId;
    ExtendedOptimisticOracleV3Interface public optimisticOracle;

    event CryptCreated(
        uint256 indexed cryptId,
        string ipfsDataHash,
        string nillionCrypt,
        address decryptCallback,
        address indexed cryptOwner
    );

    event DecryptInitiated(uint256 indexed cryptId, bytes decryptTrigger);

    constructor(address _optimisticOracle) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
    }

    function getCrypts() public view returns (Crypt[] memory) {
        return crypts;
    }

    function getCrypt(uint256 cryptId) public view returns (Crypt memory) {
        require(cryptId < crypts.length, "Crypt ID does not exist");
        return crypts[cryptId];
    }

    function createCrypt(
        string memory ipfsDataHash,
        bytes memory decryptTrigger,
        string memory nillionCrypt,
        address decryptCallback
    ) public returns (uint256) {
        Crypt memory newCrypt = Crypt({
            ipfsDataHash: ipfsDataHash,
            decryptTrigger: decryptTrigger,
            nillionCrypt: nillionCrypt,
            decryptCallback: decryptCallback,
            cryptOwner: msg.sender,
            assertionId: bytes32(0),
            isFinalized: false
        });
        crypts.push(newCrypt);
        uint256 cryptId = crypts.length - 1;
        emit CryptCreated(cryptId, ipfsDataHash, nillionCrypt, decryptCallback, msg.sender);
        return cryptId;
    }

    function initiateDecrypt(uint256 cryptId) public {
        require(cryptId < crypts.length, "Crypt ID does not exist"); // Check crypt exists.
        Crypt storage crypt = crypts[cryptId];
        require(!crypt.isFinalized, "Crypt is already finalized");
        require(crypt.assertionId == bytes32(0), "Crypt Decrypt is currently pending");

        // Pull OO bonds. Caller must first approve minimum bond amount of default currency first.
        IERC20 bondCurrency = IERC20(optimisticOracle.defaultCurrency());
        uint256 bondAmount = optimisticOracle.getMinimumBond(address(bondCurrency));
        bondCurrency.transferFrom(msg.sender, address(this), bondAmount);

        bondCurrency.approve(address(optimisticOracle), bondAmount); // Approve OO to spend bond and make assertion.
        address asserter = msg.sender;
        bytes32 assertionId = optimisticOracle.assertTruth(
            abi.encodePacked(
                "Crypt true assertion: ",
                crypt.decryptTrigger,
                " and asserter: 0x",
                ClaimData.toUtf8BytesAddress(asserter),
                " at timestamp: ",
                ClaimData.toUtf8BytesUint(block.timestamp),
                " in the CryptManager contract at 0x",
                ClaimData.toUtf8BytesAddress(address(this)),
                " is valid."
            ),
            asserter,
            address(this), // This is callback recipient. Use this contract address as the callback target.
            address(0), // No sovereign security.
            optimisticOracle.defaultLiveness(),
            bondCurrency,
            bondAmount,
            optimisticOracle.defaultIdentifier(),
            bytes32(0) // No domain.
        );

        crypt.assertionId = assertionId;
        require(crypt.assertionId != bytes32(0), "Failed to set assertionId");
        require(crypts[cryptId].assertionId == assertionId, "Failed to set assertionId");

        assertionIdToCryptId[assertionId] = cryptId;
        emit DecryptInitiated(cryptId, crypt.decryptTrigger);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) public {
        require(msg.sender == address(optimisticOracle));
        // If the assertion was true, then the data assertion is resolved.
        uint256 cryptId = assertionIdToCryptId[assertionId];
        Crypt storage crypt = crypts[cryptId];

        if (assertedTruthfully) {
            crypt.isFinalized = true;
            if (crypt.decryptCallback != address(0)) {
                DecryptCallbackInterface(crypt.decryptCallback).cryptDecryptCallback(cryptId);
            }
        }
    }

    function assertionDisputedCallback(bytes32 assertionId) public {
        crypts[assertionIdToCryptId[assertionId]].assertionId = bytes32(0);
        assertionIdToCryptId[assertionId] = 0;
    }

    function deleteCrypt(uint256 cryptId) public {
        require(cryptId < crypts.length, "Crypt ID does not exist"); // Check crypt exists.
        delete crypts[cryptId];
    }
}
