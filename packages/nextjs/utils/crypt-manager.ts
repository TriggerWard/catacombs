import { fetchFromIPFS } from "./ipfs";
import { readContract } from "@wagmi/core";

export type FetchedCrypt = Awaited<ReturnType<typeof fetchCryptWithStatus>>;

export const fetchCryptWithStatus = async (cryptId: bigint, cryptManagerAddress: string) => {
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
    metadata,
  };
};
