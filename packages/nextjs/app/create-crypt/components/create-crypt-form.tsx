import { useState } from "react";
import Link from "next/link";
import { SelectWarden, Warden } from "./select-warden";
import { prepareWriteContract, waitForTransaction, writeContract } from "@wagmi/core";
import { encodeEventTopics, hexToBigInt, toHex, zeroAddress } from "viem";
import { useNetwork, useSwitchNetwork } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Progress } from "~~/components/ui/progress";
import { Textarea } from "~~/components/ui/textarea";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { encrypt, generateKey } from "~~/utils/crypto";
import { fileToArrayBuffer } from "~~/utils/file";
import { pinCryptMetadataToIPFS, pinFileToIPFS } from "~~/utils/ipfs";
import { storeSecretsBlob } from "~~/utils/nillion/storeSecretsBlob";
import { cn } from "~~/utils/ui";
import { wait } from "~~/utils/wait";

type Status = "idle" | "pending" | "success" | "error";

const WARDENS = [
  {
    name: "Warden 1",
    address: "0x5d996408dbbBB9Fdbb15F7BA45A01e25f86E3131",
    nillionUserKey: "4AY2pXeHDHJg6SScbD1CAdNGhMRMbsvz75Nf14Wg9HuULRwxUt5TkFkzYEm9rYBQQKapz8o5Pd1dK9UrkYTuM3mQ",
  },
  {
    name: "Warden 2",
    address: "0x93D9e141160174c7d62e0dCEDb1625Fd92509A32",
    nillionUserKey: "5hG8DWxqTX7rtdrjFLuBF6AQFrmZZxfoGQYdVzXJDB9ReDhH1SPubAxnAgJPCZRy8LdV6MVMRGJycAww1z3MS2mg",
  },
];

const asciiArt = `
      .--.
     /.-. '----------.
     \'-' .--"--""-"-'
      '--'
`;

export function CreateCryptForm({ nillion, nillionClient }: { nillion: any; nillionClient: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [triggerText, setTriggerText] = useState<string>("");
  const [warden, setWarden] = useState<Warden>();
  const [createdCryptId, setCreatedCryptId] = useState<string | null>(null);

  const [fileUploadStatus, setFileUploadStatus] = useState<Status>("idle");
  const [fileUploadProgress, setFileUploadProgress] = useState<number>(0);

  const [sealCryptStatus, setSealCryptStatus] = useState<Status>("idle");
  const [sealCryptProgress, setSealCryptProgress] = useState<number>(0);

  const { data: cryptManagerData, isLoading } = useDeployedContractInfo("CryptManager");
  const { switchNetwork } = useSwitchNetwork({
    chainId: 11155111,
  });
  const { chain } = useNetwork();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileUploadStatus("pending");
      setFileUploadProgress(30);
      await wait(1_000);
      setFileUploadProgress(80);
      await wait(500);
      setFileUploadProgress(100);
      setFile(e.target.files[0]);
      setFileUploadStatus("success");
    }
  };

  const handleTriggerTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTriggerText(e.target.value);
  };

  const handleCreateCrypt = async () => {
    try {
      if (!file || !triggerText || !warden) {
        throw new Error("File or trigger text required");
      }
      if (!cryptManagerData) {
        throw new Error("CryptManager not found");
      }

      setSealCryptStatus("pending");
      const fileAsArrayBuffer = await fileToArrayBuffer(file);

      // Generate key
      const { iv, key, exportedKey, base64ExportedKey } = await generateKey();
      console.log("Generated key", { iv, key, exportedKey, base64ExportedKey });
      setSealCryptProgress(10);

      // Encrypt file
      const { base64Encrypted, encrypted } = await encrypt(key, iv, fileAsArrayBuffer);
      console.log("Encrypted file", { base64Encrypted, encrypted });
      setSealCryptProgress(40);

      // Store encrypted file on IPFS
      const cryptFileName = "crypt-file_" + Date.now();
      const pinnedFileIpfs = await pinFileToIPFS(encrypted, cryptFileName);
      console.log("Pinned encrypted file: ", pinnedFileIpfs.IpfsHash);
      setSealCryptProgress(50);

      // Store metadata on IPFS
      const pinnedMetadataIpfs = await pinCryptMetadataToIPFS(
        {
          fileIpfsCid: pinnedFileIpfs.IpfsHash,
          fileType: file.type,
          triggerText,
          iv,
          wardenUserKey: warden.nillionUserKey,
        },
        cryptFileName + "_metadata.json",
      );
      console.log("Pinned metadata file:", pinnedMetadataIpfs.IpfsHash);
      setSealCryptProgress(60);

      // Store secret key on Nillion
      const nillionSecretName = `crypt_key_${pinnedMetadataIpfs.IpfsHash}`;
      const nillionStoreId = await storeSecretsBlob(
        nillion,
        nillionClient,
        [
          {
            name: nillionSecretName,
            value: base64ExportedKey,
          },
        ],
        [warden.nillionUserKey],
      );
      console.log("Stored secret key on Nillion", { nillionStoreId, nillionSecretName });
      setSealCryptProgress(80);

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: cryptManagerData.address,
        abi: [
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
          ,
        ] as const,
        functionName: "createCrypt",
        args: [pinnedMetadataIpfs.IpfsHash, toHex(triggerText), nillionStoreId, warden.address, zeroAddress],
      });
      const { hash } = await writeContract(request);
      setSealCryptProgress(89);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);
      setSealCryptProgress(100);

      const [encodedEventTopic] = encodeEventTopics({
        eventName: "CryptCreated",
        abi: [
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
        ],
      });
      const cryptCreatedLog = receipt.logs.find(log => log.topics[0] === encodedEventTopic);
      const cryptId = hexToBigInt(cryptCreatedLog?.topics[1] || "0x0");
      console.log("Crypt created", cryptId);
      setCreatedCryptId(cryptId.toString());
      setSealCryptStatus("success");
    } catch (e) {
      console.error(e);
      setSealCryptProgress(0);
      setSealCryptStatus("error");
    }
  };

  const canCryptBeSealed = file && triggerText && warden;

  if (sealCryptStatus === "success") {
    return (
      <div className="flex flex-col w-full items-center gap-12 flex-shrink-0">
        <div className="">
          <pre>{asciiArt}</pre>
        </div>
        <Link href={`/view-crypt?cryptId=${createdCryptId}`} passHref target="_blank">
          View created crypt #{createdCryptId}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-center gap-12 flex-shrink-0">
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="secret-file">/my_treasure</Label>
        <Progress
          className={cn("h-10", fileUploadStatus === "pending" ? "visible" : "hidden")}
          value={fileUploadProgress}
        >
          <span className="text-white">{fileUploadProgress}%</span>
        </Progress>
        <Input
          className={cn(fileUploadStatus === "pending" ? "hidden" : "visible")}
          id="secret-file"
          type="file"
          onChange={handleFileChange}
        />
      </div>
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="trigger">/ward_trigger</Label>
        <Textarea id="trigger" onChange={handleTriggerTextChange} />
      </div>
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="">/warden</Label>
        <SelectWarden
          selectedWardenAddress={warden?.address}
          onSelect={wardenAddress => {
            setWarden(WARDENS.find(warden => warden.address === wardenAddress));
          }}
          wardens={WARDENS}
        />
      </div>
      {chain?.id !== 11155111 ? (
        <Button variant="ghost" onClick={() => switchNetwork?.()}>
          Switch network
        </Button>
      ) : sealCryptStatus === "pending" ? (
        <Progress className={cn("h-10")} value={sealCryptProgress}>
          <span className="text-white">sealing crypt...</span>
        </Progress>
      ) : (
        <Button variant="outline" className="w-full h-10" onClick={handleCreateCrypt} disabled={!canCryptBeSealed}>
          seal crypt
        </Button>
      )}
    </div>
  );
}
