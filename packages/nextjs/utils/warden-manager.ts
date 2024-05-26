import { fetchFromIPFS } from "./ipfs";
import { readContract } from "@wagmi/core";

export type FetchedWarden = Awaited<ReturnType<typeof fetchWarden>>;

export const fetchWarden = async (wardenAddress: string, wardenManagerAddress: string) => {
  // Fetch warden data from WardenManager.sol
  const wardenFromContract = await readContract({
    address: wardenManagerAddress,
    abi: [
      {
        inputs: [{ internalType: "address", name: "warden", type: "address" }],
        name: "getWardenInfo",
        outputs: [
          { internalType: "string", name: "ipfsInfoHash", type: "string" },
          { internalType: "string", name: "nillionKey", type: "string" },
          { internalType: "bytes32", name: "assertionId", type: "bytes32" },
          { internalType: "bool", name: "isSlashed", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "getWardenInfo",
    args: [wardenAddress],
  });

  console.log("Warden from contract", wardenFromContract);

  if (!wardenFromContract || !wardenFromContract[0]) {
    return;
  }

  // fetch metadata from IPFS
  const wardenMetadataIpfsHash = wardenFromContract[0];
  const metadata = (await (await fetchFromIPFS(wardenMetadataIpfsHash)).json()) as {
    name: string;
    description: string;
    nillionUserKey: string;
  };

  return {
    wardenData: wardenFromContract,
    metadata,
  };
};

export function fetchAllWardens(wardenManagerAddress: string) {
  // Fetch all wardens from WardenManager.sol
}
