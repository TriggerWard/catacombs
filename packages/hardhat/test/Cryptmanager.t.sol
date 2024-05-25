// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./fixtures/uma/CommonOptimisticOracleV3Test.sol";

import "../src/CryptManager.sol";
import "../src/test/TestDecryptCallback.sol";

import "forge-std/console.sol";

contract CryptmanagerTest is CommonOptimisticOracleV3Test {
    CryptManager public cryptManager;

    // Sample data for testing.
    string ipfsDataHash = "testIpfsHashString";
    bytes decryptTrigger = bytes("testaDecryptTrigger");
    string nillionCrypt = "testNillionCryptAddress";
    address decryptCallback = address(420);
    address warden = TestAddress.random;

    uint256 minimumBond;

    function setUp() public {
        _commonSetup();
        cryptManager = new CryptManager(address(optimisticOracleV3), optimisticOracleV3.defaultLiveness());
        minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    }

    function test_CreateCrypt() public {
        vm.prank(TestAddress.account1);

        assertTrue(cryptManager.getCrypts().length == 0, "Crypts should be empty before");
        vm.prank(TestAddress.account1);
        uint256 cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, decryptCallback);
        assertTrue(cryptManager.getCrypts().length == 1, "Crypts should be 1");

        CryptManager.Crypt memory crypt = cryptManager.getCrypt(cryptId);

        // Verify crypt data stored correctly. Check hash of string instead of string directly.
        assertTrue(compareStrings(crypt.ipfsDataHash, ipfsDataHash), "ipfsDataHash should match");
        assertTrue(keccak256(crypt.decryptTrigger) == keccak256(decryptTrigger), "decryptTrigger should be equal");
        assertTrue(compareStrings(crypt.nillionCrypt, nillionCrypt), "nillionCrypt should be equal");
        assertTrue(crypt.decryptCallback == decryptCallback, "decryptCallback should be equal");
        assertTrue(crypt.owner == TestAddress.account1, "owner should be equal");
        assertTrue(crypt.isFinalized == false, "isFinalized should be false");
        assertTrue(crypt.assertionId == bytes32(0), "assertionId should be 0");
    }

    function test_InitiateDecrypt() public {
        vm.prank(TestAddress.account1);
        uint256 cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, decryptCallback);
        assertTrue(cryptManager.getCrypts().length == 1, "Crypts should be 1");

        // Should not be able to initiate decrypt if dont have enough tokens or approval.
        vm.expectRevert("ERC20: insufficient allowance");
        vm.prank(TestAddress.account2);
        cryptManager.initiateDecrypt(cryptId);

        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        uint256 balanceBefore = defaultCurrency.balanceOf(TestAddress.account2);

        vm.expectRevert("ERC20: insufficient allowance");
        vm.prank(TestAddress.account2);
        cryptManager.initiateDecrypt(cryptId);

        // Now, with correct approval and balance, initiate decrypt.
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(cryptManager), minimumBond);
        cryptManager.initiateDecrypt(cryptId);
        vm.stopPrank();

        // Check that the decrypt was initiated. Verify the OO bond was pulled, and the assertion was made in the OO.
        uint256 balanceAfter = defaultCurrency.balanceOf(TestAddress.account2);
        assertTrue(balanceAfter == balanceBefore - minimumBond, "Bond should be pulled");
        CryptManager.Crypt memory crypt = cryptManager.getCrypt(cryptId);
        assertTrue(crypt.assertionId != bytes32(0), "assertionId should not be 0");
        OptimisticOracleV3.Assertion memory assertion = optimisticOracleV3.getAssertion(crypt.assertionId);
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
        assertTrue(assertion.callbackRecipient == address(cryptManager), "Callback recipient should be this contract");
        assertTrue(assertion.disputer == address(0), "Disputer should be address 0 initially");
    }

    function test_FinalizeDecryptNoDispute() public {
        vm.prank(TestAddress.account1);
        uint256 cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(0));
        assertTrue(cryptManager.getCrypts().length == 1, "Crypts should be 1");

        // Setup currency and approve bond to initiate decrypt.
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(cryptManager), minimumBond);
        cryptManager.initiateDecrypt(cryptId);
        vm.stopPrank();

        CryptManager.Crypt memory crypt = cryptManager.getCrypt(cryptId);

        // Finalize the decrypt. Should revert before liveness period.
        vm.expectRevert("Assertion not expired");
        optimisticOracleV3.settleAndGetAssertionResult(crypt.assertionId);

        // Now, advance time past liveness period and finalize. Should succeed.
        timer.setCurrentTime(timer.getCurrentTime() + optimisticOracleV3.defaultLiveness() + 1);
        assertTrue(optimisticOracleV3.settleAndGetAssertionResult(crypt.assertionId), "Settlement should succeed");

        // Check that the decrypt was finalized. Verify the OO bond was pulled, and the assertion was made in the OO.
        crypt = cryptManager.getCrypt(cryptId); // Fetch latest crypt data.

        assertTrue(crypt.isFinalized == true, "isFinalized should be true");
        OptimisticOracleV3.Assertion memory assertion = optimisticOracleV3.getAssertion(crypt.assertionId);
        assertTrue(assertion.settled == true, "Settled should be true");
        assertTrue(assertion.settlementResolution == true, "Settlement resolution should be true");
    }

    function test_FinalizeDecryptWithDispute() public {
        vm.prank(TestAddress.account1);
        uint256 cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(0));

        // Setup currency and approve bond to initiate decrypt.
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond);
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(cryptManager), minimumBond);
        cryptManager.initiateDecrypt(cryptId);
        vm.stopPrank();

        CryptManager.Crypt memory crypt = cryptManager.getCrypt(cryptId);

        // Now, dispute the assertion.
        defaultCurrency.allocateTo(TestAddress.account3, minimumBond);
        vm.startPrank(TestAddress.account3);
        defaultCurrency.approve(address(optimisticOracleV3), minimumBond);
        optimisticOracleV3.disputeAssertion(crypt.assertionId, TestAddress.account3);
        vm.stopPrank();

        // Check the associated updates were made in the crypt.
        crypt = cryptManager.getCrypt(cryptId);
        assertTrue(crypt.assertionId == bytes32(0), "assertionId should be reset to 0");
        assertTrue(crypt.isFinalized == false, "isFinalized should be false");
    }

    function test_FinalizeDecryptCallback() public {
        // Create a crypt to have a non-zero initial cryptId for subsequent test.
        cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(0));

        // Deploy a callback recipient contract. Set the CryptManager address and the cryptId to check the callback.
        TestDecryptCallback testDecryptCallback = new TestDecryptCallback(address(cryptManager), 1);
        //DecryptCallback can only be called by CryptManager.
        vm.expectRevert("Only Crypt can call this function");
        testDecryptCallback.cryptDecryptCallback(1);

        // Use the callback recipient contract as the decrypt callback.
        vm.prank(TestAddress.account1);
        uint256 cryptId =
            cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(testDecryptCallback));
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond); // Setup currency and approve bond to initiate decrypt.
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(cryptManager), minimumBond);
        cryptManager.initiateDecrypt(cryptId);
        vm.stopPrank();

        CryptManager.Crypt memory crypt = cryptManager.getCrypt(cryptId);

        // Advance time, settle assertion. Check that the callback was called within the callback contract.
        assertTrue(testDecryptCallback.wasCalled() == false, "Callback should not be called yet");
        timer.setCurrentTime(timer.getCurrentTime() + optimisticOracleV3.defaultLiveness() + 1);
        assertTrue(optimisticOracleV3.settleAndGetAssertionResult(crypt.assertionId), "Settlement should succeed");
        assertTrue(testDecryptCallback.wasCalled() == true, "Callback should be called");
    }

    function test_DeleteCrypt() public {
        // Create a crypt to test deletion.
        vm.startPrank(TestAddress.account1);
        uint256 cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(0));
        vm.stopPrank();

        // Attempt to delete the crypt by a non-owner, should revert
        vm.prank(TestAddress.account2);
        vm.expectRevert("Only the crypt owner can delete the crypt");
        cryptManager.deleteCrypt(cryptId);

        // Can not delete crypt if there is a pending decrypt.
        defaultCurrency.allocateTo(TestAddress.account2, minimumBond); // Setup currency and approve bond to initiate decrypt.
        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(cryptManager), minimumBond);
        cryptManager.initiateDecrypt(cryptId);
        vm.stopPrank();
        vm.prank(TestAddress.account1);
        vm.expectRevert("Cannot delete a crypt with a pending assertion");
        cryptManager.deleteCrypt(cryptId);

        // Make a new crypt and then try delete it (previous one is in pending state).
        vm.startPrank(TestAddress.account1);
        cryptId = cryptManager.createCrypt(ipfsDataHash, decryptTrigger, nillionCrypt, warden, address(0));
        cryptManager.deleteCrypt(cryptId);
        vm.stopPrank();

        // Attempt to access the deleted crypt, should revert
        vm.expectRevert("Crypt ID does not exist");
        cryptManager.getCrypt(cryptId);
    }
}
