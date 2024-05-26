# TriggerWarding - Contracts

This package contains the smart contract infra from both UMA's Oracles as well as TriggerWard's contracts

## Overview

Due to the mixed dependencies & set up from Nillion's boilerplate, this codebase contains both Hardhat & Foundry.

For the most part, we will make of Foundry's `forge` commands.

## Getting Started 👩‍💻

### Install dependencies 👷‍♂️

On Linux and macOS Foundry toolchain can be installed with:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

In case there was a prior version of Foundry installed, it is advised to update it with `foundryup` command.

Other installation methods are documented [here](https://book.getfoundry.sh/getting-started/installation).

Forge manages dependencies using [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) by default, which
is also the method used in this repository. To install dependencies, run:

```bash
forge install
```

### Compile the contracts 🏗

Compile the contracts with:

```bash
forge build
```

### Run the tests 🧪

Test the example contracts with:

```bash
forge test
```
