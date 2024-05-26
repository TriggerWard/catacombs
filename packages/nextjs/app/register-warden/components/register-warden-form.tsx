import { useEffect, useState } from "react";
import { prepareWriteContract, readContract, waitForTransaction, writeContract } from "@wagmi/core";
import { parseUnits } from "viem";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Textarea } from "~~/components/ui/textarea";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { pinWardenMetadataToIPFS } from "~~/utils/ipfs";
import { FetchedWarden, fetchWarden } from "~~/utils/warden-manager";

type Status = "idle" | "pending" | "success" | "error";

const STAKE_TOKEN = {
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  symbol: "USDC",
};

export function RegisterWardenForm({
  nillion,
  nillionClient,
  nillionUserKey,
}: {
  nillion: any;
  nillionClient: any;
  nillionUserKey: string;
}) {
  const [wardenStake, setWardenStake] = useState<string>("");
  const [wardenName, setWardenName] = useState<string>("");
  const [wardenDescription, setWardenDescription] = useState<string>("");

  const [registeredWarden, setRegisteredWarden] = useState<FetchedWarden>();

  const [registerWardenStatus, setRegisterWardenStatus] = useState<Status>("idle");
  const [stakeStatus, setStakeStatus] = useState<Status>("idle");
  const [fetchWardenStatus, setFetchWardenStatus] = useState<Status>("idle");

  const { data: wardenManagerData, isLoading } = useDeployedContractInfo("WardenManager");
  const { switchNetwork } = useSwitchNetwork({
    chainId: 11155111,
  });
  const { chain } = useNetwork();
  const { address: connectedAccount } = useAccount();

  useEffect(() => {
    if (!wardenManagerData || !connectedAccount) {
      return;
    }

    fetchWarden(connectedAccount, wardenManagerData.address)
      .then(warden => {
        setRegisteredWarden(warden);
        setFetchWardenStatus("success");
      })
      .catch(e => {
        console.error(e);
        setFetchWardenStatus("error");
      });
  }, [connectedAccount, wardenManagerData]);

  const handleWardenStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWardenStake(e.target.value);
  };

  const handleWardenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWardenName(e.target.value);
  };

  const handleWardenDescription = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWardenDescription(e.target.value);
  };

  const handleRegisterWarden = async () => {
    try {
      setRegisterWardenStatus("pending");

      if (!nillionUserKey || !connectedAccount) {
        throw new Error("Nillion user key required");
      }

      if (!wardenManagerData) {
        throw new Error("WardenManager not found");
      }

      if (!wardenName || !wardenDescription) {
        throw new Error("Warden name and description required");
      }

      // Store warden metadata on IPFS
      const pinnedWardenMetadata = await pinWardenMetadataToIPFS(
        {
          name: wardenName,
          description: wardenDescription,
          nillionUserKey,
        },
        "warden-metadata.json",
      );
      console.log("Pinned warden metadata file:", pinnedWardenMetadata.IpfsHash);

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: wardenManagerData.address,
        abi: [
          {
            inputs: [
              { internalType: "string", name: "wardenIpfsInfoHash", type: "string" },
              { internalType: "string", name: "wardenNillionKey", type: "string" },
            ],
            name: "registerWarden",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        functionName: "registerWarden",
        args: [pinnedWardenMetadata.IpfsHash, nillionUserKey],
      });
      const { hash } = await writeContract(request);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);

      // fetch warden
      const warden = await fetchWarden(connectedAccount, wardenManagerData.address);
      setRegisteredWarden(warden);

      setRegisterWardenStatus("success");
    } catch (e) {
      console.error(e);
      setRegisterWardenStatus("error");
    }
  };

  const handleStake = async () => {
    try {
      setStakeStatus("pending");

      if (!wardenManagerData) {
        throw new Error("WardenManager not found");
      }

      if (!connectedAccount) {
        throw new Error("Connected account required");
      }

      if (!wardenStake) {
        throw new Error("Warden stake required");
      }

      const parsedWardenStake = parseUnits(wardenStake, 6);

      // Check approved token balance
      const approvalAmount = await readContract({
        address: STAKE_TOKEN.address,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "owner", type: "address" },
              { internalType: "address", name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "allowance",
        args: [connectedAccount, wardenManagerData.address],
      });
      console.log("Approval amount", approvalAmount);

      // Check if user has enough approved balance
      if (approvalAmount < BigInt(parsedWardenStake)) {
        const { request } = await prepareWriteContract({
          address: STAKE_TOKEN.address,
          abi: [
            {
              inputs: [
                { internalType: "address", name: "spender", type: "address" },
                { internalType: "uint256", name: "amount", type: "uint256" },
              ],
              name: "approve",
              outputs: [{ internalType: "bool", name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ] as const,
          functionName: "approve",
          args: [wardenManagerData.address, BigInt(parsedWardenStake)],
        });

        const { hash } = await writeContract(request);
        console.log("Approve tx hash", hash);
        const receipt = await waitForTransaction({ hash, confirmations: 1 });
        console.log("Approve tx receipt", receipt);
      }

      // Call WardenManager.sol
      const { request } = await prepareWriteContract({
        address: wardenManagerData.address,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "warden", type: "address" },
              { internalType: "contract IERC20", name: "token", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "stakeOnWarden",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        functionName: "stakeOnWarden",
        args: [
          connectedAccount,
          STAKE_TOKEN.address, // TODO: allow user to select token
          BigInt(parsedWardenStake),
        ],
      });
      const { hash } = await writeContract(request);
      console.log("Stake tx hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Stake tx receipt", receipt);

      setStakeStatus("success");
    } catch (e) {
      console.error(e);
      setStakeStatus("error");
    }
  };

  const isWardenRegistered = !!registeredWarden;

  if (fetchWardenStatus === "pending") {
    return <div>Fetching warden...</div>;
  }

  return (
    <div className="flex flex-col w-full items-center gap-12 flex-shrink-0">
      {isWardenRegistered ? (
        <>
          <div className="grid w-full items-center gap-4">
            <Label htmlFor="stake-amount">/warden_stake</Label>
            <div className="flex w-full items-center space-x-2">
              <Input type="stake-amount" placeholder="Stake amount" onChange={handleWardenStakeChange} />
              <div className="">USDC</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid w-full items-center gap-4">
            <Label htmlFor="name">/warden_name</Label>
            <Input id="name" onChange={handleWardenNameChange} />
          </div>
          <div className="grid w-full items-center gap-4">
            <Label htmlFor="description">/warden_description</Label>
            <Textarea id="description" onChange={handleWardenDescription} />
          </div>
        </>
      )}
      {chain?.id !== 11155111 ? (
        <Button variant="ghost" onClick={() => switchNetwork?.()}>
          Switch network
        </Button>
      ) : isWardenRegistered ? (
        <Button variant="outline" className="w-full h-10" onClick={handleStake} disabled={stakeStatus == "pending"}>
          stake
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full h-10"
          onClick={handleRegisterWarden}
          disabled={registerWardenStatus === "pending"}
        >
          register warden
        </Button>
      )}
    </div>
  );
}
