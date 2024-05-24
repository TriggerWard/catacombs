// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./fixtures/uma/CommonOptimisticOracleV3Test.sol";

import "../src/CryptManager.sol";

import "forge-std/console.sol";

contract Cryptmanager is CommonOptimisticOracleV3Test {
    CryptManager public cryptManager;

    function setUp() public {
        _commonSetup();
        cryptManager = new CryptManager(address(optimisticOracleV3));
    }

    function test_CreateCrypt() public {
        vm.startPrank(TestAddress.account1);
        defaultCurrency.allocateTo(TestAddress.account1, optimisticOracleV3.getMinimumBond(address(defaultCurrency)));
        defaultCurrency.approve(address(cryptManager), optimisticOracleV3.getMinimumBond(address(defaultCurrency)));
        bytes32 dataId = bytes32("dataId");

        uint256 cryptId = cryptManager.createCrypt("test", bytes("dataId"), "test", address(0));
        console.log("CRYPT TEST");
    }
}
