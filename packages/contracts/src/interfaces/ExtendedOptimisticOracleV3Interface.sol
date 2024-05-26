// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";

interface ExtendedOptimisticOracleV3Interface is OptimisticOracleV3Interface {
    function defaultCurrency() external view returns (address);
    function defaultLiveness() external view returns (uint64);
}
