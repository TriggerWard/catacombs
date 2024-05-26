// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../fixtures/uma/CommonOptimisticOracleV3Test.sol";
import "../../src/WardenManager.sol";
import "forge-std/console.sol";

contract WardenScenariosTest is CommonOptimisticOracleV3Test {
    WardenManager public wardenManager;
    string sampleIpfsInfoHash = "testIpfsHashString";
    string sampleNillionKey = "testNillionAddress";
    uint256 minimumBond;
    address warden = TestAddress.account1;
    address asserter = TestAddress.account2;
    address disputor = TestAddress.account3;

    function setUp() public {
        _commonSetup();
        wardenManager = new WardenManager(address(optimisticOracleV3), optimisticOracleV3.defaultLiveness());
        minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    }

    // Huge number of wardens
    // Under utilized wardens
    // No competent wardens 
    // All wardens are slashed
    // Wardens have compromised stake 
}
