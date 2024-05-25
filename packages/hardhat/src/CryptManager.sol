//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";
import "./interfaces/DecryptCallbackInterface.sol";

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

contract CryptManager {
    struct Crypt {
        string ipfsDataHash;
        bytes decryptTrigger;
        string nillionCrypt;
        string decryptionKey;
        address warden;
        address decryptCallback;
        address owner;
        bytes32 assertionId;
        bool isFinalized;
    }

    Crypt[] public crypts;
    mapping(bytes32 => uint256) public assertionIdToCryptId;

    ExtendedOptimisticOracleV3Interface public optimisticOracle;
    uint64 public optimisticOracleLiveness;

    event CryptCreated(
        uint256 indexed cryptId,
        string ipfsDataHash,
        string nillionCrypt,
        address decryptCallback,
        address indexed warden,
        address indexed owner
    );

    event DecryptInitiated(uint256 indexed cryptId, bytes decryptTrigger);
    event DecryptFinalized(uint256 indexed cryptId, bool result);
    event CryptDeleted(uint256 indexed cryptId);

    constructor(address _optimisticOracle, uint64 _optimisticOracleLiveness) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
        optimisticOracleLiveness = _optimisticOracleLiveness;
    }

    function getCrypts() public view returns (Crypt[] memory) {
        return crypts;
    }

    function getCrypt(uint256 cryptId) public view returns (Crypt memory) {
        require(crypts[cryptId].owner != address(0), "Crypt ID does not exist");
        return crypts[cryptId];
    }

    function createCrypt(
        string memory ipfsDataHash,
        bytes memory decryptTrigger,
        string memory nillionCrypt,
        address warden,
        address decryptCallback
    ) public returns (uint256) {
        Crypt memory newCrypt = Crypt({
            ipfsDataHash: ipfsDataHash,
            decryptTrigger: decryptTrigger,
            nillionCrypt: nillionCrypt,
            decryptCallback: decryptCallback,
            warden: warden,
            owner: msg.sender,
            assertionId: bytes32(0),
            isFinalized: false
        });
        crypts.push(newCrypt);
        uint256 cryptId = crypts.length - 1;
        emit CryptCreated(cryptId, ipfsDataHash, nillionCrypt, decryptCallback, warden, msg.sender);
        return cryptId;
    }

    function initiateDecrypt(uint256 cryptId) public {
        require(cryptId < crypts.length, "Crypt ID does not exist"); // Check crypt exists.
        Crypt storage crypt = crypts[cryptId];
        require(!crypt.isFinalized, "Crypt is already finalized");
        require(crypt.assertionId == bytes32(0), "Crypt Decrypt is currently pending");

        // Pull OO bonds. Caller must first approve minimum bond amount of default currency.
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
            optimisticOracleLiveness,
            bondCurrency,
            bondAmount,
            optimisticOracle.defaultIdentifier(),
            bytes32(0) // No domain.
        );

        crypt.assertionId = assertionId;
        assertionIdToCryptId[assertionId] = cryptId;
        emit DecryptInitiated(cryptId, crypt.decryptTrigger);
    }

    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) public {
        require(msg.sender == address(optimisticOracle));
        // If the assertion was true, then the data assertion is resolved.
        uint256 cryptId = assertionIdToCryptId[assertionId];
        if (assertedTruthfully) {
            crypts[cryptId].isFinalized = true;
            if (crypts[cryptId].decryptCallback != address(0)) {
                DecryptCallbackInterface(crypts[cryptId].decryptCallback).cryptDecryptCallback(cryptId);
            }
        } else {
            crypts[cryptId].assertionId = bytes32(0);
            assertionIdToCryptId[assertionId] = 0;
        }
        emit DecryptFinalized(cryptId, assertedTruthfully);
    }

    function assertionDisputedCallback(bytes32 assertionId) public {
        crypts[assertionIdToCryptId[assertionId]].assertionId = bytes32(0);
        assertionIdToCryptId[assertionId] = 0;
    }

    function deleteCrypt(uint256 cryptId) public {
        require(cryptId < crypts.length, "Crypt ID does not exist");
        require(crypts[cryptId].owner == msg.sender, "Only the crypt owner can delete the crypt");
        require(!crypts[cryptId].isFinalized, "Cannot delete a finalized crypt");
        require(crypts[cryptId].assertionId == bytes32(0), "Cannot delete a crypt with a pending assertion");

        delete crypts[cryptId];
        emit CryptDeleted(cryptId);
    }
}
