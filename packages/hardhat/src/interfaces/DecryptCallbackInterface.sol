// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

interface DecryptCallbackInterface {
    function cryptDecryptCallback(uint256 cryptId) external;
}
