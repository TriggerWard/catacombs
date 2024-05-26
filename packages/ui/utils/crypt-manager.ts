import { fetchFromIPFS } from "./ipfs";
import { readContract } from "@wagmi/core";
import { zeroAddress } from "viem";

export type FetchedCrypt = Awaited<ReturnType<typeof fetchCryptWithStatus>>;

export const fetchCryptWithStatus = async (cryptId: bigint, cryptManagerAddress: string, oov3Address: string) => {
  // Fetch crypt data from CryptManager.sol
  const cryptFromContract = await readContract({
    address: cryptManagerAddress,
    abi: [
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
    ] as const,
    functionName: "getCrypt",
    args: [cryptId],
  });

  console.log("Crypt from contract", cryptFromContract);

  if (!cryptFromContract) {
    return;
  }

  // determine assertion status
  const assertion = await readContract({
    address: oov3Address,
    abi: [
      {
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "assertions",
        outputs: [
          {
            components: [
              { internalType: "bool", name: "arbitrateViaEscalationManager", type: "bool" },
              { internalType: "bool", name: "discardOracle", type: "bool" },
              { internalType: "bool", name: "validateDisputers", type: "bool" },
              { internalType: "address", name: "assertingCaller", type: "address" },
              { internalType: "address", name: "escalationManager", type: "address" },
            ],
            internalType: "struct OptimisticOracleV3Interface.EscalationManagerSettings",
            name: "escalationManagerSettings",
            type: "tuple",
          },
          { internalType: "address", name: "asserter", type: "address" },
          { internalType: "uint64", name: "assertionTime", type: "uint64" },
          { internalType: "bool", name: "settled", type: "bool" },
          { internalType: "contract IERC20", name: "currency", type: "address" },
          { internalType: "uint64", name: "expirationTime", type: "uint64" },
          { internalType: "bool", name: "settlementResolution", type: "bool" },
          { internalType: "bytes32", name: "domainId", type: "bytes32" },
          { internalType: "bytes32", name: "identifier", type: "bytes32" },
          { internalType: "uint256", name: "bond", type: "uint256" },
          { internalType: "address", name: "callbackRecipient", type: "address" },
          { internalType: "address", name: "disputer", type: "address" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "assertions",
    args: [cryptFromContract.assertionId],
  });
  const assertionExpirationTime = assertion[5];

  const cryptStatus =
    cryptFromContract.assertionId !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
    !cryptFromContract.isFinalized
      ? "unseal-initiated"
      : cryptFromContract.isFinalized
      ? "unsealed"
      : "sealed";

  // fetch metadata from IPFS
  const cryptMetadataIpfsHash = cryptFromContract.ipfsDataHash;
  const metadata = (await (await fetchFromIPFS(cryptMetadataIpfsHash)).json()) as {
    fileIpfsCid: string;
    iv: string;
    triggerText: string;
    fileType?: string;
  };

  return {
    cryptId,
    cryptStatus,
    cryptData: cryptFromContract,
    assertionExpirationTime,
    metadata,
  };
};
