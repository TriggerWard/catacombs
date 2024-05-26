//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @title DecryptCallback
/// @author TriggerWard
/// @notice This allows contracts to be informed when a ward has been triggered on a crypt.
contract DecryptCallback {
    address public cryptManagerAddress;
    uint256 public cryptId;

    event CryptDecryptCallback(uint256 cryptId);

    error OnlyCryptManager(uint256 cryptId, address account);
    error CryptIdMismatch(uint256 provided, uint256 actual);

    /// @notice This registers the crypt manager & crypt, which, when the ward is triggered, will contact this contract.
    /// @param _cryptManagerAddress The address of the crypt manager.
    /// @param _cryptId The id of the crypt this contract is interested in.
    constructor(address _cryptManagerAddress, uint256 _cryptId) {
        cryptManagerAddress = _cryptManagerAddress;
        cryptId = _cryptId;
    }

    // TODO: Consider if this should have a revert which could be blocking if not set up.
    /// @notice This allows the crypt manager to inform the contract that the crypt's ward has been triggered.
    /// @param _cryptId The ID of the WardTriggered Crypt.
    function cryptDecryptCallback(uint256 _cryptId) external virtual {
        if (msg.sender != cryptManagerAddress) revert OnlyCryptManager(_cryptId, msg.sender);
        if (_cryptId != cryptId) revert CryptIdMismatch(cryptId, _cryptId);
        // Do something
        emit CryptDecryptCallback(cryptId);
    }
}
