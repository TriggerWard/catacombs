//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract DecryptCallback {
    address public cryptManagerAddress;
    uint256 public cryptId;

    event CryptDecryptCallback(uint256 cryptId);

    constructor(address _cryptManagerAddress, uint256 _cryptId) {
        cryptManagerAddress = _cryptManagerAddress;
        cryptId = _cryptId;
    }

    function cryptDecryptCallback(uint256 _cryptId) public virtual {
        require(msg.sender == cryptManagerAddress, "Only CryptManager can call this function");
        require(_cryptId == cryptId, "CryptId does not match");
        // Do something
        emit CryptDecryptCallback(cryptId);
    }
}
