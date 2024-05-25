//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract WardenManager {
    struct Warden {
        string ipfsInfo;
        string nillionKey;
    }

    mapping(address => Warden) public wardens;

    function registerWarden(string memory wardenIpfsInfo, string memory wardenNillionKey) public {
        wardens[msg.sender] = Warden(wardenIpfsInfo, wardenNillionKey);
    }
}
