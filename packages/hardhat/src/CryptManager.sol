//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ExtendedOptimisticOracleV3Interface.sol";
import "./interfaces/DecryptCallbackInterface.sol";

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

/// @title CryptManager
/// @author TriggerWard
/// @notice Facilitates all crypt actions
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

    mapping(bytes32 => uint256) public assertionIdToCryptId;
    Crypt[] public crypts;

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
    event DecryptionKeySet(uint256 indexed cryptId, string decryptionKey);
    event CryptDeleted(uint256 indexed cryptId);

    error CryptIdNotFound(uint256 cryptId);
    error CryptAlreadyFinalized(uint256 cryptId);
    error CryptNotFinalized(uint256 cryptId);
    error CryptAlreadyDecrypting(uint256 cryptId);

    error MustBeOracle();
    error OnlyOwner(uint256 cryptId, address caller);
    error OnlyWarden(uint256 cryptId, address caller);

    /// @notice Deploys a crypt manager to facilitate the creation & ward casting of the crypts.
    /// @param _optimisticOracle The address of the optimistic oracle which will prophesize assertions of the wards cast on the crypts.
    /// @param _optimisticOracleLiveness The liveness of the oracle's divining powers.
    constructor(address _optimisticOracle, uint64 _optimisticOracleLiveness) {
        optimisticOracle = ExtendedOptimisticOracleV3Interface(_optimisticOracle);
        optimisticOracleLiveness = _optimisticOracleLiveness;
    }

    /// @notice Allows a user to create a crypt.
    /// @param ipfsDataHash The IPFS hash of the encrypted data being sealed in the crypt.
    /// @param decryptTrigger A bytes encoded string of the natural language statement, which, if proven, triggers the ward to open.
    /// @param nillionCrypt The identifier of the crypto in the Nillion catacombs.
    /// @param warden The address of the warden enlisted to oversee the crypt.
    /// @param decryptCallback The address of an arbitrary external contract to inform that the ward has been triggered.
    /// @return CryptId A unique identifier of the newly created crypt.
    function createCrypt(
        string memory ipfsDataHash,
        bytes memory decryptTrigger,
        string memory nillionCrypt,
        address warden,
        address decryptCallback
    ) external returns (uint256) {
        Crypt memory newCrypt = Crypt({
            ipfsDataHash: ipfsDataHash,
            decryptTrigger: decryptTrigger,
            nillionCrypt: nillionCrypt,
            decryptionKey: "",
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

    /// @notice This allows a user to stake a claim that the ward of the crypt has been triggered.
    /// @param cryptId The crypts unique identifier.
    function initiateDecrypt(uint256 cryptId) external {
        if (cryptId > crypts.length) revert CryptIdNotFound(cryptId);
        Crypt storage crypt = crypts[cryptId];
        if (crypt.isFinalized) revert CryptAlreadyFinalized(cryptId);
        if (crypt.assertionId != bytes32(0)) revert CryptAlreadyDecrypting(cryptId);

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

    /// @notice This allows the optimistic oracle to confirm if the ward has been triggered.
    /// @param assertionId The ID of the assertion the oracle is currently foreseeing the truthfullness of.
    function assertionResolvedCallback(bytes32 assertionId, bool assertedTruthfully) external {
        if (msg.sender != address(optimisticOracle)) revert MustBeOracle();

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

    /// @notice This allows the optimistic oracle to dismiss assertions that are deemed false
    /// @param assertionId The ID of the assertion the oracle was requested to prophesize.
    function assertionDisputedCallback(bytes32 assertionId) external {
        if (msg.sender != address(optimisticOracle)) revert MustBeOracle();

        crypts[assertionIdToCryptId[assertionId]].assertionId = bytes32(0);
        assertionIdToCryptId[assertionId] = 0;
    }

    /// @notice This allows the owner to unseal their crypt and remove it from the catacombs.
    /// @param cryptId The ID of the crypt being exhumed.
    function deleteCrypt(uint256 cryptId) external {
        if (cryptId > crypts.length) revert CryptIdNotFound(cryptId);

        Crypt storage crypt = crypts[cryptId];
        if (crypt.owner != msg.sender) revert OnlyOwner(cryptId, msg.sender);
        if (crypt.isFinalized) revert CryptAlreadyFinalized(cryptId);
        if (crypts[cryptId].assertionId != bytes32(0)) revert CryptAlreadyDecrypting(cryptId);

        delete crypts[cryptId];
        emit CryptDeleted(cryptId);
    }

    /// @notice This allows the warden to unseal a crypt and leave the keys in the door.
    /// @param cryptId The ID of the unsealed crypt.
    function setDecryptionKey(uint256 cryptId, string memory decryptionKey) external {
        if (cryptId > crypts.length) revert CryptIdNotFound(cryptId);

        Crypt storage crypt = crypts[cryptId];
        if (msg.sender != crypt.warden) revert OnlyWarden(cryptId, msg.sender);
        if (!crypt.isFinalized) revert CryptNotFinalized(cryptId);

        crypt.decryptionKey = decryptionKey;
        emit DecryptionKeySet(cryptId, decryptionKey);
    }

    // TODO: consider longevity & gas
    /// @notice Fetches all registered crypts
    /// @return Crypts An array containing all crypts ever registered.
    function getCrypts() external view returns (Crypt[] memory) {
        return crypts;
    }

    /// @notice Retrieves a crypt by it's registered ID.
    /// @param cryptId The ID of crypt being retrieved.
    /// @return Crypt A struct containing the state & details of the crypt.
    function getCrypt(uint256 cryptId) external view returns (Crypt memory) {
        if (crypts[cryptId].owner == address(0)) revert CryptIdNotFound(cryptId);

        return crypts[cryptId];
    }
}
