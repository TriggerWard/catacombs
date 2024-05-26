# 🔓 Trigger Warding

Programmable, encrypted & triggerable data vault, an _encrypted data dead man's switch_. Upload and encrypt any file anonymously and have a natural language "trigger" initiate when to decrypt and publicly release this data.

<p align="center">
  <img alt="TriggerWard Logo" src="https://i.imgur.com/wAN1bMh.jpeg" width="300">
</p>

## Table of Contents

- [Resources](#resources)
- [Repo Structure](#repo-structure)
- [Example Use Cases](#example-use-cases)
- [How Trigger Ward Works](#how-trigger-ward-works)
  - [Ethereum Trigger Mechanism](#1--ethereum-trigger-mechanism)
  - [Nillion MPC datacrypts](#2-nillion-mpc-datacrypts)
  - [Ethereum Trigger Contract -> Nillion Nada Bridge](#3-ethereum-trigger-contract---nillion-nada-bridge)
- [Running Locally](#running-locally)

## Resources

- [Website](https://www.triggerward.com/)
- [Trailer](https://www.youtube.com/watch?v=zcGWx-eQCB0)
- [Slide deck](https://docs.google.com/presentation/d/1adw9RYKSA2tFIGB2o20b8VLcRf03WnChIUGVpMuJw5c/edit?usp=sharing)
- [Figma](https://www.figma.com/design/D0axqXznF11H0TNVgJU5cq/trigger-ward?node-id=0-1&t=zMOA3LuO4GU0Kkm9-1)
- Deployed Contracts (Sepolia):
  - `CryptManager`: [0x27639764f1e1ac3124913f366fB827de7e457EC7](https://sepolia.etherscan.io/address/0x27639764f1e1ac3124913f366fb827de7e457ec7)
  - `WardenManager`: [0x6625F9ca44ecA82C9A2b61caB58FBfACd24fF1C2](https://sepolia.etherscan.io/address/0x6625F9ca44ecA82C9A2b61caB58FBfACd24fF1C2)

## Repo Structure

| Package Name                                                                        | Description                                                     |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [contracts](https://github.com/TriggerWard/catacombs/tree/main/packages/contracts)    | Smart contracts and configurations for blockchain interactions. |
| [ui](https://github.com/TriggerWard/catacombs/tree/main/packages/ui)            | Frontend for interacting with contracts and nillion.            |
| [warden](https://github.com/TriggerWard/catacombs/tree/main/packages/warden)            | Client that can run by the warden to automatically execute their role.            |
| [nillion](https://github.com/TriggerWard/catacombs/tree/main/packages/ui/contracts) | Nillion Nada contracts and scripts for booting Nillion locally. |

## Example Use cases

Trigger Ward can be used for a wide range of applications where you want to _conditionally decrypt data based on some real world action_. Some examples are:

1. **Whistleblower and Journalistic Safeguards**: Automatically release decryption keys to unlock encrypted evidence or investigative reports if a whistleblower or journalist is silenced, harmed, or goes missing.
2. **Protest Coordination**: Encrypt and schedule the release of protest plans to prevent authorities from preempting demonstrations, ensuring activists can gather and act in safety.
3. **Misconduct Deterrence**: Enforce accountability by revealing the identity and actions of individuals if they engage in unethical or harmful behavior, acting as a deterrent against misconduct.

# How Trigger Ward Works

Trigger ward functions by storing encrypted data within [Nillion](https://nillion.com/)'s MPC network which can only be decrypted when an action is executed within an Ethereum Smart contract, the "trigger". This trigger leverages [UMA's Optimistic Oracle](https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work) (OO) to prove public truths on-chain and enable the decrypting on data from Nillion.

Conceptually, there are three main components to Trigger Ward: 1) An Ethereum Trigger that initiates an action on Nillion 2) Nillion Nada contracts that store encrypted data on the users behalf, and 3) a bridge to enable logic on Ethereum to execute functions in Nada. Each are broken down in detail below.

#### 1. **Ethereum Trigger Mechanism**

Triggers are described in natural language, which is verified using the Optimistic Oracle in conjunction with economic bonding. A trigger can any statement of truth. For example, "This DataCrypt will be decrypted on the 20th of April 2024" or "If Person X is proven to be dead, as specified in an official EU report, decrypt the DataCrypt".

All triggers are stored in the `CryptManager` contract. This is the primary entry point for most system actions. It stores key crypt information, arbitrates part of the trigger logic, and is the integration point with the Optimistic Oracle. The latest version of this contract can be found.

**Creating a crypt:** When a user creates a new DataCrypt, they call the `createCrypt` function, specifying an IPFS hash of their encrypted data, a bytes field containing the natural language trigger, the `nillionCrypt` address that contains their private data, and lastly a decryption callback that allows for arbitrary on-chain logic be called when a crypt is opened.

**Decrypting a crypt:** When the conditions to open a crypt have been met (the trigger is valid) any address/account is able to call the `initiateDecrypt` function. This action requires a bond, which is transferred from the users account, which is then held in escrow until the trigger validity is verified. At this point, the OO is called to validate the trigger fulfillment. On the resolution of the OO verification, the `assertionResolvedCallback` function is called by the OO on the `cryptManager` contract, which sets the `isFinalized` bool to true. Once set, the Nillion DataCrypt logic can be executed.

For more info on how the Optimistic Oracle works, and the risks it introduces into the protocol, see [How Trigger Ward Works](#how-the-optimistic-oracle-and-dvm-work).

#### 2. Nillion MPC DataCrypts

Data within DataCrypts is stored within a Nada contract, which is encrypted & stored within an MPC environment. When a user creates a DataCrypt in the front end, the UI encrypts the provided data, and stores resulting encrypted data on IPFS. The Decryption key is stored within the Nillion Nada contract. This is done to reduce storage load on Nillion, reducing the overall cost of execution.

The data stored in a crypt can have arbitrarily complex logic associated with it. The simplest flow is _only release this data if its triggered by an action on Ethereum_ however, it can be more complex such as _release part of this data to these addresses, and this other data to these other sets of addresses_.

#### 3. Ethereum Trigger Contract -> Nillion Nada Bridge

In order for a DataCrypt to know when to release data(or run its arbitrary data computation logic) it needs to be able to read the `isFinalized` variable from the `CryptManager` on Ethereum. However, there is currently no mechanism for Nillion to read Ethereum state. One solution to this could be to create an Ethereum light client within Nada, to enable Nillion to prove Ethereum state. However, the computation and time complexity of doing this in Nada is prohibitive.

Cryptoeconomic solutions to this problem are more tractable, so we created a _Warden_ mechanism to bridge data between the two domains. This works by enabling anyone to become a warden, by placing an economic bond on their future behavior, with the condition that they will be slashed if they misbehave. Others can also stake on a warden to overall increase the economic security of their actions (i.e delegated staking).

To accommodate this, when a user creates their DataCrypt, they specify the warden that they wish to elect, to be the bridge from Ethereum to Nillion, and decrypt the data on their behalf. The warden is then responsible for checking when a trigger has been resolved (`isFinalized==true`) and responding by executing the Nada code to decrypt the user's data. The warden mechanism is a stop gap solution that can be improved later (it's just a module in the overall system, after all) and be replaced with a more sophisticated implementation in the future. The contracts are designed to have a drop in replacement for the Warden, letting the crypt creator choose how they want to enable this.

Out of the box, the mechanism created accommodates more robust configurations including requiring an n/m setup of wardens, wherein a DataCrypt can only be de-crypted if a set of wardens agree to do the decryption. If this set is spread over a set of uncorrelated actors, who all have economic stake, this is sufficient for medium to high value data storage.

For further justification on the game theory of why the Warden mechanism is acceptable for medium value secrets, see the [here](#warden-game-theory-and-future-improvements) below.

**WardManagerContract:** To support the slashing mechanism described above, the `wardManagerContract` enables the registration of a warden, who can then receive stake. They can stake on themselfs or have others delegate stake to them. If a warden misbehaves, then anyone can call the `slashWarden` which challanges their behavour. To verify their miss-behavour, the OO is used to arbitrate the dispute. It can verify if the warden violated the terms of their SLA through failing to bridge information correctly to Nillion (not opening a datacrypt) or opening a datacrypt when it was not meant to be bridged. This contract has logic to bound when a user can stake/unstake, depending on if a warden is currently being slashed.

**WardenClient:** The `warden` package contains code that a warden can run to automatically execute their role.

## Local Development

There are three main sections to this repo that can be developed on locally:

#### a) Front End

To setup & run the front end clone the repo, install dependencies and run the appropriate yarn command. Make sure you are using at least node 18.x

```
git clone https://github.com/TriggerWard/catacombs
yarn install
yarn start
```

This config won't run easily against the Nillion test network (this is what the the deployed version of the UI at x does) as you require access to the closed [beta Nillion chain](https://docs.nillion.com/#nillion-network-access). Alternatively, the full stack can be run against the system deployed locally. Once the UI is running execute sections b and c and come back to the UI.

#### b) Solidity Smart Contracts

The smart contracts & tests can be developed on locally using Foundry. To use this, first install Foundry, if you don't have it already.

```
curl -L [https://foundry.paradigm.xyz](https://foundry.paradigm.xyz/) | bash
foundryup
```

Once this is done, navigate to the `contracts` directory, where you can run the unit tests.

```
cd ./packages
forge test
```

Note that this repo has _both_ Hardhat and Foundry. Hardhat is used by some parts of the Nillion system. To correctly configure this, if you want to run the repo locally, run the following from the root of the repo:

```
yarn chain
```

In a separate terminal run:

```
yarn deploy
```

#### c) Nillion Local Devnet

To get the Nillion devnet running locally, you must first install the `nilup` installer and version manager for the Nillion SDK tools.

```
curl https://nilup.nilogy.xyz/install.sh | bash
```

Then, validate the `nilup` installation:

```
nilup -V
```

Use `nilup` to install these:

```bash
nilup install latest
nilup use latest
nilup init
```

Confirm global Nillion tool installation

```
nillion -V
```

If you want to compile Nillion code, then `python3` is required, as well as some additional packages, such as `virtualenv`. However if you are not developing Nada contracts, feel free to skip this. If you don't have python, then get it here - [python3](https://www.python.org/downloads/) with a working [pip](https://pip.pypa.io/en/stable/getting-started/) installed. Confirm with:

```
python3 --version
python3 -m pip --version
```

Once this is done, we are ready to start the `nillion-devnet` with:

```
yarn nillion-devnet
```

If you want to compile your own Nada and extend the repo, then see the Nillion docs [here](https://docs.nillion.com/python-quickstart).

## Extra Info on Key Mechanism Details

#### How the Optimistic Oracle and DVM Work

The Optimistic Oracle functions by enabling anyone to make a public claim of a "truth" on any verifiable information. To make this assertion, they place a bond to back it. Once placed, this assertion enters a liveness period in which it can be publicly verified. If the assertion passes the liveness period without challenge, then it is taken as true.

If during this interval someone challenges the assertion, then it is escalated to the [UMA Data Verification Mechanism](https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work#umas-data-verification-mechanism) (DVM). The DVM is a schelling point oracle, Inspired by originally by Vitalik's [Schelling Coin](https://blog.ethereum.org/2014/03/28/schellingcoin-a-minimal-trust-universal-data-feed) mechanism from the early days of Ethereum. It operates through UMA token holders staking their UMA tokens, and voting in a blind Commit-Reveal voting system on the correct outcome of the dispute. This commit reveal mechanism hides the votes from other voters, making the only economically rational thing to do as a participant be to vote. The output from the majority vote is taken as true for the oracle resolution. Note that the DVM only ever arbitrates on the bonds being disputed within the OO so as long as the value of the UMA staked exceeds the sum of all bonds being disputed, it remains economically sound.

Today, UMA has [~1.7bln TVS](https://dune.com/risk_labs/uma-total-value-secured) and has been running from early 2020 without any loss of funds, showing some level of lindyness.

#### Warden Game theory and future improvements

From a game theory perspective, the warden mechanism works because the warden _does not know the contents of a DataCrypt, nor how valuable the data is_, which makes it impossible for them to price the profit they could extract from defaulting on their commitment and losing their stake. Consider a warden has 100 WSETH staked (yielding ETH) staked, and is the warden for 3 DataCrypts: a) a cat photo b) secret government documents c) a personal will, to be released on someones death. Only one of these items of data are highly valuable, and two are worth nothing publicly. If the warden was to default on their duties, and decrypt data before a trigger is hit, they would lose their bond but risk getting nothing of value out of the crypt and get slashed.

In the future, the warden system should be replaced with a cryptographic solution, rather than an economic one. A native light client from Ethereum to Nillion would be the best bet here.
