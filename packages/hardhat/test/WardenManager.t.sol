// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./fixtures/uma/CommonOptimisticOracleV3Test.sol";
import "../src/WardenManager.sol";
import "forge-std/console.sol";

contract WardenManagerTest is CommonOptimisticOracleV3Test {
    WardenManager public wardenManager;
    string sampleIpfsInfoHash = "testIpfsHashString";
    string sampleNillionKey = "testNillionAddress";
    uint256 minimumBond;

    function setUp() public {
        _commonSetup();
        wardenManager = new WardenManager(address(optimisticOracleV3));
        minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    }

    function test_RegisterWarden() public {
        vm.prank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);

        // Check info set correctly.
        (string memory ipfsInfoHash, string memory nillionKey, bytes32 assertionId, bool isSlashed) =
            wardenManager.getWardenInfo(TestAddress.account1);
        assertTrue(compareStrings(ipfsInfoHash, sampleIpfsInfoHash), "IPFS info hash should match");
        assertTrue(compareStrings(nillionKey, sampleNillionKey), "Nillion key should match");
        assertTrue(assertionId == 0, "Assertion ID should be zero");
        assertTrue(!isSlashed, "Warden should not be slashed");
    }

    function test_StakeOnWarden() public {
        vm.prank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);

        // Define staking details & stake.
        uint256 stakeAmount = 420e18;
        defaultCurrency.allocateTo(TestAddress.account2, stakeAmount);
        uint256 initialBalance = defaultCurrency.balanceOf(TestAddress.account2);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), stakeAmount);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmount);
        vm.stopPrank();

        // Check the staked amount
        uint256 stakedAmount = wardenManager.getWardenStakeInToken(TestAddress.account1, defaultCurrency);
        assertTrue(stakedAmount == stakeAmount, "Staked amount should match the amount staked");

        // Check user's stake on the warden
        uint256 userStake =
            wardenManager.getUserStakeOnWarden(TestAddress.account1, TestAddress.account2, defaultCurrency);
        assertTrue(userStake == stakeAmount, "User's staked amount should match the amount staked");

        // Check the token balance increase on the contract
        uint256 contractBalanceIncrease = defaultCurrency.balanceOf(address(wardenManager));
        assertTrue(
            contractBalanceIncrease == stakeAmount, "Contract's token balance should increase by the staked amount"
        );

        // Check the delta of the caller's balance to ensure it decreases by the staked amount
        uint256 finalBalance = defaultCurrency.balanceOf(TestAddress.account2);
        assertTrue(
            finalBalance == initialBalance - stakeAmount, "Caller's balance should decrease by the staked amount"
        );
    }

    function test_StakeOnWardenMultiToken() public {
        // Register a warden with multiple tokens
        vm.prank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);

        // Define staking details for multiple tokens
        uint256 stakeAmountDefault = 420e18;
        uint256 stakeAmountNewToken = 210e18;
        TestnetERC20 newToken = new TestnetERC20("NewToken", "NT", 18);
        newToken.allocateTo(TestAddress.account2, stakeAmountNewToken);

        // Stake with default currency
        defaultCurrency.allocateTo(TestAddress.account2, stakeAmountDefault);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), stakeAmountDefault);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmountDefault);

        // Stake with new token
        newToken.approve(address(wardenManager), stakeAmountNewToken);
        wardenManager.stakeOnWarden(TestAddress.account1, newToken, stakeAmountNewToken);
        vm.stopPrank();

        // Verify staked amounts for both tokens
        uint256 stakedAmountDefault = wardenManager.getWardenStakeInToken(TestAddress.account1, defaultCurrency);
        uint256 stakedAmountNewToken = wardenManager.getWardenStakeInToken(TestAddress.account1, newToken);
        assertTrue(stakedAmountDefault == stakeAmountDefault, "Staked amount with default currency should match");
        assertTrue(stakedAmountNewToken == stakeAmountNewToken, "Staked amount with new token should match");

        // Verify user's stake on the warden for both tokens
        uint256 userStakeDefault =
            wardenManager.getUserStakeOnWarden(TestAddress.account1, TestAddress.account2, defaultCurrency);
        uint256 userStakeNewToken =
            wardenManager.getUserStakeOnWarden(TestAddress.account1, TestAddress.account2, newToken);
        assertTrue(userStakeDefault == stakeAmountDefault, "User's staked amount with default currency should match");
        assertTrue(userStakeNewToken == stakeAmountNewToken, "User's staked amount with new token should match");
    }

    function test_WithdrawStake() public {
        // Register a warden and stake on it
        vm.startPrank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);
        uint256 stakeAmount = 420e18;
        defaultCurrency.allocateTo(TestAddress.account1, stakeAmount);
        defaultCurrency.approve(address(wardenManager), stakeAmount);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmount);

        // Define withdrawal details & withdraw
        uint256 withdrawAmount = 210e18;
        uint256 initialBalance = defaultCurrency.balanceOf(TestAddress.account1);

        wardenManager.withdrawStake(TestAddress.account1, defaultCurrency, withdrawAmount);
        vm.stopPrank();

        // Check the staked amount
        uint256 stakedAmount = wardenManager.getWardenStakeInToken(TestAddress.account1, defaultCurrency);
        assertTrue(stakedAmount == stakeAmount - withdrawAmount, "Staked amount should match the amount staked");

        // Check user's stake on the warden
        uint256 userStake =
            wardenManager.getUserStakeOnWarden(TestAddress.account1, TestAddress.account1, defaultCurrency);
        assertTrue(userStake == stakeAmount - withdrawAmount, "User's staked amount should match the amount staked");

        // Check the token balance decrease on the contract
        uint256 contractBalanceDecrease = defaultCurrency.balanceOf(address(wardenManager));
        assertTrue(
            contractBalanceDecrease == stakeAmount - withdrawAmount,
            "Contract's token balance should decrease by the withdrawn amount"
        );

        // Check the delta of the caller's balance to ensure it increases by the withdrawn amount
        uint256 finalBalance = defaultCurrency.balanceOf(TestAddress.account1);
        assertTrue(
            finalBalance == initialBalance + withdrawAmount, "Caller's balance should increase by the withdrawn amount"
        );
    }

    function test_SlashWarden() public {
        // Setup: Register a warden and stake on it
        vm.startPrank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);
        uint256 stakeAmount = 1000e18;
        defaultCurrency.allocateTo(TestAddress.account1, stakeAmount);
        defaultCurrency.approve(address(wardenManager), stakeAmount);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmount);
        vm.stopPrank();

        // Setup: Approve bond for slashing & execute slash. Check assertion ID is set and assertion is in OO.
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), minimumBond);
        wardenManager.slashWarden(TestAddress.account1);
        vm.stopPrank();

        // Check: Warden's assertionId should be set
        (,, bytes32 assertionId,) = wardenManager.getWardenInfo(TestAddress.account1);
        assertTrue(assertionId != bytes32(0), "Assertion ID should be set");

        // Verify the assertion details in the Optimistic Oracle
        OptimisticOracleV3.Assertion memory assertion = optimisticOracleV3.getAssertion(assertionId);
        assertTrue(assertion.asserter == TestAddress.account2, "Asserter should be account2");
        assertTrue(assertion.assertionTime == block.timestamp, "Assertion time should be current block timestamp");
        assertTrue(assertion.settled == false, "Settled should be false initially");
        assertTrue(assertion.currency == defaultCurrency, "Currency should match defaultCurrency");
        uint256 expectedExpirationTime = block.timestamp + optimisticOracleV3.defaultLiveness();
        assertTrue(assertion.expirationTime == expectedExpirationTime, "Expiration time should be set correctly");
        assertTrue(assertion.settlementResolution == false, "Settlement resolution should be false initially");
        assertTrue(assertion.domainId == bytes32(0), "Domain ID should be 0");
        assertTrue(assertion.identifier == optimisticOracleV3.defaultIdentifier(), "Identifier should match default");
        assertTrue(assertion.bond == minimumBond, "Bond amount should match minimumBond");
        assertTrue(assertion.callbackRecipient == address(wardenManager), "Callback recipient should be this contract");
        assertTrue(assertion.disputer == address(0), "Disputer should be address 0 initially");
    }

    function test_SlashingPreventsStakeWithdrawal() public {
        // Setup: Register a warden and stake on it
        vm.startPrank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);
        uint256 stakeAmount = 1000e18;
        defaultCurrency.allocateTo(TestAddress.account1, stakeAmount);
        defaultCurrency.approve(address(wardenManager), stakeAmount);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmount);
        vm.stopPrank();

        // Slash the warden
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), minimumBond);
        wardenManager.slashWarden(TestAddress.account1);
        vm.stopPrank();

        // Attempt to withdraw stake after slashing should fail
        vm.startPrank(TestAddress.account1);
        uint256 withdrawAmount = 500e18;
        vm.expectRevert("Cannot withdraw staked tokens while assertion is pending");
        wardenManager.withdrawStake(TestAddress.account1, defaultCurrency, withdrawAmount);
        vm.stopPrank();
    }

    function test_FinalizeWardenSlashingNoDispute() public {
        // Setup: Register a warden and stake on it
        vm.startPrank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);
        uint256 stakeAmount = 1000e18;
        defaultCurrency.allocateTo(TestAddress.account1, stakeAmount);
        defaultCurrency.approve(address(wardenManager), stakeAmount);
        wardenManager.stakeOnWarden(TestAddress.account1, defaultCurrency, stakeAmount);
        vm.stopPrank();

        // Slash the warden
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), minimumBond);
        wardenManager.slashWarden(TestAddress.account1);
        vm.stopPrank();

        (,, bytes32 assertionId, bool isSlashed) = wardenManager.getWardenInfo(TestAddress.account1);

        // Execute the slash. Should revert before OO resolves.
        vm.expectRevert("Warden is not slashed");
        wardenManager.executeSlash(TestAddress.account1, defaultCurrency);
        vm.expectRevert("Assertion not expired");
        optimisticOracleV3.settleAndGetAssertionResult(assertionId);

        // Now move foward and it should work as expected.
        timer.setCurrentTime(timer.getCurrentTime() + optimisticOracleV3.defaultLiveness() + 1);
        assertTrue(optimisticOracleV3.settleAndGetAssertionResult(assertionId), "Settlement should succeed");

        wardenManager.executeSlash(TestAddress.account1, defaultCurrency);

        // Check initial balances
        uint256 wardenBalanceBefore = defaultCurrency.balanceOf(TestAddress.account1);

        // Advance time past liveness period and finalize
        timer.setCurrentTime(timer.getCurrentTime() + optimisticOracleV3.defaultLiveness() + 1);
        assertTrue(optimisticOracleV3.settleAndGetAssertionResult(assertionId), "Settlement should succeed");

        // Check final balances
        uint256 wardenBalanceAfter = defaultCurrency.balanceOf(TestAddress.account1);
        uint256 contractBalanceAfter = defaultCurrency.balanceOf(address(wardenManager));

        // Verify balances are updated correctly
        assertTrue(wardenBalanceBefore == wardenBalanceAfter, "Warden's balance should remain unchanged");
        assertTrue(contractBalanceAfter == 0, "Contract's balance should increase due to slashing");
        uint256 stakedBalanceAfterSlash = wardenManager.getWardenStakeInToken(TestAddress.account1, defaultCurrency);
        assertTrue(stakedBalanceAfterSlash == 0, "Staked balance should be zero after slash execution");

        // Verify warden's slashed status
        (,,, isSlashed) = wardenManager.getWardenInfo(TestAddress.account1);
        assertTrue(isSlashed, "Warden should be marked as slashed");
    }

    function test_FinalizeWardenSlashingWithDispute() public {
        vm.prank(TestAddress.account1);
        wardenManager.registerWarden(sampleIpfsInfoHash, sampleNillionKey);

        // Setup currency and approve bond to initiate slash.
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(wardenManager), minimumBond);
        wardenManager.slashWarden(TestAddress.account1);
        vm.stopPrank();

        (,, bytes32 assertionId, bool isSlashed) = wardenManager.getWardenInfo(TestAddress.account1);

        // Now, dispute the assertion.
        defaultCurrency.allocateTo(TestAddress.account3, minimumBond);
        vm.startPrank(TestAddress.account3);
        defaultCurrency.approve(address(optimisticOracleV3), minimumBond);
        optimisticOracleV3.disputeAssertion(assertionId, TestAddress.account3);
        vm.stopPrank();

        // Check the associated updates were made to the warden state.
        (,, assertionId, isSlashed) = wardenManager.getWardenInfo(TestAddress.account1);
        assertTrue(assertionId == bytes32(0), "assertionId should be reset to 0");
        assertTrue(isSlashed == false, "isSlashed should be false");
    }
}
