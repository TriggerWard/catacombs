const externalContracts = {
    11155111: {
        WardenManager: { address: "0x6625F9ca44ecA82C9A2b61caB58FBfACd24fF1C2", abi: [{ "inputs": [{ "internalType": "address", "name": "_optimisticOracle", "type": "address" }, { "internalType": "uint64", "name": "_optimisticOracleLiveness", "type": "uint64" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "AssertionPending", "type": "error" }, { "inputs": [], "name": "InsufficientStake", "type": "error" }, { "inputs": [], "name": "MustBeOracle", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "WardenAlreadySlashed", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "WardenNotSlashed", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "WardenSlashPending", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": true, "internalType": "address", "name": "caller", "type": "address" }], "name": "AssertionDisputed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "indexed": false, "internalType": "bool", "name": "assertedTruthfully", "type": "bool" }, { "indexed": true, "internalType": "address", "name": "caller", "type": "address" }], "name": "AssertionResolved", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": false, "internalType": "contract IERC20", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "caller", "type": "address" }], "name": "SlashExecuted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": true, "internalType": "address", "name": "staker", "type": "address" }, { "indexed": false, "internalType": "contract IERC20", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "StakePlaced", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": true, "internalType": "address", "name": "staker", "type": "address" }, { "indexed": false, "internalType": "contract IERC20", "name": "token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "StakeWithdrawn", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": false, "internalType": "string", "name": "ipfsInfoHash", "type": "string" }, { "indexed": false, "internalType": "string", "name": "nillionKey", "type": "string" }], "name": "WardenRegistered", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "warden", "type": "address" }, { "indexed": false, "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "caller", "type": "address" }], "name": "WardenSlashed", "type": "event" }, { "inputs": [{ "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }], "name": "assertionDisputedCallback", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "assertionIdToWarden", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "internalType": "bool", "name": "assertedTruthfully", "type": "bool" }], "name": "assertionResolvedCallback", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }, { "internalType": "contract IERC20", "name": "token", "type": "address" }], "name": "executeSlash", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }, { "internalType": "address", "name": "user", "type": "address" }, { "internalType": "contract IERC20", "name": "token", "type": "address" }], "name": "getUserStakeOnWarden", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "getWardenInfo", "outputs": [{ "internalType": "string", "name": "ipfsInfoHash", "type": "string" }, { "internalType": "string", "name": "nillionKey", "type": "string" }, { "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "internalType": "bool", "name": "isSlashed", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }, { "internalType": "contract IERC20", "name": "token", "type": "address" }], "name": "getWardenStakeInToken", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "optimisticOracle", "outputs": [{ "internalType": "contract ExtendedOptimisticOracleV3Interface", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "optimisticOracleLiveness", "outputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "wardenIpfsInfoHash", "type": "string" }, { "internalType": "string", "name": "wardenNillionKey", "type": "string" }], "name": "registerWarden", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }], "name": "slashWarden", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }, { "internalType": "contract IERC20", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "stakeOnWarden", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "wardens", "outputs": [{ "internalType": "string", "name": "ipfsInfoHash", "type": "string" }, { "internalType": "string", "name": "nillionKey", "type": "string" }, { "internalType": "bytes32", "name": "assertionId", "type": "bytes32" }, { "internalType": "bool", "name": "isSlashed", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "warden", "type": "address" }, { "internalType": "contract IERC20", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdrawStake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] },
        CryptManager: {
            address: "0xACA5ccFa48A5A4A6396efB6F104A5eb04eE43528",
            abi: [
                {
                    inputs: [
                        { internalType: "address", name: "_optimisticOracle", type: "address" },
                        { internalType: "uint64", name: "_optimisticOracleLiveness", type: "uint64" },
                    ],
                    stateMutability: "nonpayable",
                    type: "constructor",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "CryptAlreadyDecrypting",
                    type: "error",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "CryptAlreadyFinalized",
                    type: "error",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "CryptIdNotFound",
                    type: "error",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "CryptNotFinalized",
                    type: "error",
                },
                { inputs: [{ internalType: "address", name: "caller", type: "address" }], name: "OnlyOracle", type: "error" },
                {
                    inputs: [
                        { internalType: "uint256", name: "cryptId", type: "uint256" },
                        { internalType: "address", name: "caller", type: "address" },
                    ],
                    name: "OnlyOwner",
                    type: "error",
                },
                {
                    inputs: [
                        { internalType: "uint256", name: "cryptId", type: "uint256" },
                        { internalType: "address", name: "caller", type: "address" },
                    ],
                    name: "OnlyWarden",
                    type: "error",
                },
                {
                    anonymous: false,
                    inputs: [
                        { indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" },
                        { indexed: false, internalType: "string", name: "ipfsDataHash", type: "string" },
                        { indexed: false, internalType: "string", name: "nillionCrypt", type: "string" },
                        { indexed: false, internalType: "address", name: "decryptCallback", type: "address" },
                        { indexed: true, internalType: "address", name: "warden", type: "address" },
                        { indexed: true, internalType: "address", name: "owner", type: "address" },
                    ],
                    name: "CryptCreated",
                    type: "event",
                },
                {
                    anonymous: false,
                    inputs: [{ indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "CryptDeleted",
                    type: "event",
                },
                {
                    anonymous: false,
                    inputs: [
                        { indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" },
                        { indexed: false, internalType: "bool", name: "result", type: "bool" },
                    ],
                    name: "DecryptFinalized",
                    type: "event",
                },
                {
                    anonymous: false,
                    inputs: [
                        { indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" },
                        { indexed: false, internalType: "bytes", name: "decryptTrigger", type: "bytes" },
                    ],
                    name: "DecryptInitiated",
                    type: "event",
                },
                {
                    anonymous: false,
                    inputs: [
                        { indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" },
                        { indexed: false, internalType: "string", name: "decryptionKey", type: "string" },
                    ],
                    name: "DecryptionKeySet",
                    type: "event",
                },
                {
                    inputs: [{ internalType: "bytes32", name: "assertionId", type: "bytes32" }],
                    name: "assertionDisputedCallback",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
                {
                    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
                    name: "assertionIdToCryptId",
                    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [
                        { internalType: "bytes32", name: "assertionId", type: "bytes32" },
                        { internalType: "bool", name: "assertedTruthfully", type: "bool" },
                    ],
                    name: "assertionResolvedCallback",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
                {
                    inputs: [
                        { internalType: "string", name: "ipfsDataHash", type: "string" },
                        { internalType: "bytes", name: "decryptTrigger", type: "bytes" },
                        { internalType: "string", name: "nillionCrypt", type: "string" },
                        { internalType: "address", name: "warden", type: "address" },
                        { internalType: "address", name: "decryptCallback", type: "address" },
                    ],
                    name: "createCrypt",
                    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                    stateMutability: "nonpayable",
                    type: "function",
                },
                {
                    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                    name: "crypts",
                    outputs: [
                        { internalType: "string", name: "ipfsDataHash", type: "string" },
                        { internalType: "bytes", name: "decryptTrigger", type: "bytes" },
                        { internalType: "string", name: "nillionCrypt", type: "string" },
                        { internalType: "string", name: "decryptionKey", type: "string" },
                        { internalType: "address", name: "warden", type: "address" },
                        { internalType: "address", name: "decryptCallback", type: "address" },
                        { internalType: "address", name: "owner", type: "address" },
                        { internalType: "bytes32", name: "assertionId", type: "bytes32" },
                        { internalType: "bool", name: "isFinalized", type: "bool" },
                    ],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "deleteCrypt",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "getCrypt",
                    outputs: [
                        {
                            components: [
                                { internalType: "string", name: "ipfsDataHash", type: "string" },
                                { internalType: "bytes", name: "decryptTrigger", type: "bytes" },
                                { internalType: "string", name: "nillionCrypt", type: "string" },
                                { internalType: "string", name: "decryptionKey", type: "string" },
                                { internalType: "address", name: "warden", type: "address" },
                                { internalType: "address", name: "decryptCallback", type: "address" },
                                { internalType: "address", name: "owner", type: "address" },
                                { internalType: "bytes32", name: "assertionId", type: "bytes32" },
                                { internalType: "bool", name: "isFinalized", type: "bool" },
                            ],
                            internalType: "struct CryptManager.Crypt",
                            name: "",
                            type: "tuple",
                        },
                    ],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [],
                    name: "getCrypts",
                    outputs: [
                        {
                            components: [
                                { internalType: "string", name: "ipfsDataHash", type: "string" },
                                { internalType: "bytes", name: "decryptTrigger", type: "bytes" },
                                { internalType: "string", name: "nillionCrypt", type: "string" },
                                { internalType: "string", name: "decryptionKey", type: "string" },
                                { internalType: "address", name: "warden", type: "address" },
                                { internalType: "address", name: "decryptCallback", type: "address" },
                                { internalType: "address", name: "owner", type: "address" },
                                { internalType: "bytes32", name: "assertionId", type: "bytes32" },
                                { internalType: "bool", name: "isFinalized", type: "bool" },
                            ],
                            internalType: "struct CryptManager.Crypt[]",
                            name: "",
                            type: "tuple[]",
                        },
                    ],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
                    name: "initiateDecrypt",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
                {
                    inputs: [],
                    name: "optimisticOracle",
                    outputs: [{ internalType: "contract ExtendedOptimisticOracleV3Interface", name: "", type: "address" }],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [],
                    name: "optimisticOracleLiveness",
                    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
                    stateMutability: "view",
                    type: "function",
                },
                {
                    inputs: [
                        { internalType: "uint256", name: "cryptId", type: "uint256" },
                        { internalType: "string", name: "decryptionKey", type: "string" },
                    ],
                    name: "setDecryptionKey",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
        },
    },
} as const;

export default externalContracts;
