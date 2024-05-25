//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../DecryptCallback.sol";

contract TestDecryptCallback is DecryptCallback {
    bool public wasCalled;

    constructor(address _cryptManagerAddress, uint256 _cryptId) DecryptCallback(_cryptManagerAddress, _cryptId) {}

    function cryptDecryptCallback(uint256 cryptId) public override {
        require(msg.sender == cryptManagerAddress, "Only Crypt can call this function");
        require(cryptId == cryptId, "CryptId does not match");
        wasCalled = true;
    }
}
