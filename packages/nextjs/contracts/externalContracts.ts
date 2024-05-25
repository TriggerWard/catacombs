import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  11155111: {
    CryptManager: {
      address: "0x53F9f6b42D708C96734b5F86D1F0e8e4c2bC2dbe",
      abi: [
        {
          inputs: [{ internalType: "address", name: "_optimisticOracle", type: "address" }],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            { indexed: true, internalType: "uint256", name: "cryptId", type: "uint256" },
            { indexed: false, internalType: "string", name: "ipfsDataHash", type: "string" },
            { indexed: false, internalType: "string", name: "nillionCrypt", type: "string" },
            { indexed: false, internalType: "address", name: "decryptCallback", type: "address" },
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
      ],
    },
  },
} as const;

export default externalContracts satisfies GenericContractsDeclaration;
