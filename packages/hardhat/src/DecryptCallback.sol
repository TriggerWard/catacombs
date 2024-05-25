//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract DecryptCallback {
    address public cryptManagerAddress;
    uint256 public cryptId;

    event CryptDecryptCallback(uint256 cryptId);

    error OnlyCryptManager(uint256 cryptId, address account);
    error CryptIdMismatch(uint256 provided, uint256 actual);

    constructor(address _cryptManagerAddress, uint256 _cryptId) {
        cryptManagerAddress = _cryptManagerAddress;
        cryptId = _cryptId;
    }

    function cryptDecryptCallback(uint256 _cryptId) public virtual {
        // require(msg.sender == cryptManagerAddress, "Only CryptManager can call this function");
        if (msg.sender != cryptManagerAddress) revert OnlyCryptManager(_cryptId, msg.sender);
        // require(_cryptId == cryptId, "CryptId does not match");
        if (_cryptId != cryptId) revert CryptIdMismatch(cryptId, _cryptId);
        // Do something
        emit CryptDecryptCallback(cryptId);
    }
}
