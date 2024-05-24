//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CryptManager {
    struct Crypt {
        string encryptedDataIpfsHash;
        bytes decryptTrigger;
        string nillionCrypt;
        address decryptCallback;
        bool isFinalized;
    }

    Crypt[] public crypts;
    ExtendedOptimisticOracleV3Interface public optimisticOracle;

    event CryptCreated(
        uint256 indexed cryptId, string encryptedDataIpfsHash, string nillionCrypt, address decryptCallback
    );

    event DecryptInitiated(uint256 indexed cryptId, bytes decryptTrigger);

    constructor(address _optimisticOracle) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
    }

    function getCrypts() public view returns (Crypt[] memory) {
        return crypts;
    }

    function createCrypt(
        string memory encryptedDataIpfsHash,
        bytes memory decryptTrigger,
        string memory nillionCrypt,
        address decryptCallback
    ) public returns (uint256) {
        Crypt memory newCrypt = Crypt({
            encryptedDataIpfsHash: encryptedDataIpfsHash,
            decryptTrigger: decryptTrigger,
            nillionCrypt: nillionCrypt,
            decryptCallback: decryptCallback,
            isFinalized: false
        });
        crypts.push(newCrypt);
        uint256 cryptId = crypts.length - 1;
        emit CryptCreated(cryptId, encryptedDataIpfsHash, nillionCrypt, decryptCallback);
        return cryptId;
    }

    function initiateDecrypt(uint256 cryptId) public {
        require(cryptId < crypts.length, "Crypt ID does not exist"); // Check crypt exists.
        Crypt storage crypt = crypts[cryptId];

        // Pull OO bonds. Caller must first approve minimum bond amount of default currency first.
        IERC20 bondCurrency = IERC20(optimisticOracle.defaultCurrency());
        uint256 bondAmount = optimisticOracle.getMinimumBond(address(bondCurrency));
        bondCurrency.transferFrom(msg.sender, address(this), bondAmount);

        // Approve OO to spend bond and make assertion.
        bondCurrency.approve(address(optimisticOracle), bondAmount);
        bytes32 assertionId = optimisticOracle.assertTruthWithDefaults(crypt.decryptTrigger, address(this));
        emit DecryptInitiated(cryptId, crypt.decryptTrigger);
    }

    function finalizeDecrypt() public {}

    function deleteCrypt() public {}
}
