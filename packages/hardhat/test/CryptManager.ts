const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("My Dapp", function () {
  let myContract;

  describe("CryptManager", function () {
    it("Should deploy CryptManager", async function () {
      const optimisticOracle = await ethers.getContractFactory("OptimisticOracleV3");


      const cryptManager = await ethers.getContractFactory("CryptManager");

      myContract = await cryptManager.deploy();


    });

    // describe("setPurpose()", function () {
    //   it("Should be able to set a new purpose", async function () {
    //     const newPurpose = "Test Purpose";

    //     await myContract.setPurpose(newPurpose);
    //     expect(await myContract.purpose()).to.equal(newPurpose);
    //   });

    //   it("Should emit a SetPurpose event ", async function () {
    //     const [owner] = await ethers.getSigners();

    //     const newPurpose = "Another Test Purpose";

    //     expect(await myContract.setPurpose(newPurpose))
    //       .to.emit(myContract, "SetPurpose")
    //       .withArgs(owner.address, newPurpose);
    //   });
    // });
  });
});
