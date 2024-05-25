import { useState } from "react";
import { prepareWriteContract, waitForTransaction, writeContract } from "@wagmi/core";
import { encodeEventTopics, hexToBigInt, toHex, zeroAddress } from "viem";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Progress } from "~~/components/ui/progress";
import { Textarea } from "~~/components/ui/textarea";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { decrypt, encrypt, generateKey, importKey } from "~~/utils/crypto";
import { fileToArrayBuffer } from "~~/utils/file";
import { fetchFromIPFS, pinCryptMetadataToIPFS, pinFileToIPFS } from "~~/utils/ipfs";
import { retrieveSecretBlob } from "~~/utils/nillion/retrieveSecretBlob";
import { storeSecretsBlob } from "~~/utils/nillion/storeSecretsBlob";
import { cn } from "~~/utils/ui";
import { wait } from "~~/utils/wait";

type Status = "idle" | "pending" | "success" | "error";

export function CreateCryptForm({ nillion, nillionClient }: { nillion: any; nillionClient: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [triggerText, setTriggerText] = useState<string>("");

  const [fileUploadStatus, setFileUploadStatus] = useState<Status>("idle");
  const [fileUploadProgress, setFileUploadProgress] = useState<number>(0);

  const [sealCryptStatus, setSealCryptStatus] = useState<Status>("idle");
  const [sealCryptProgress, setSealCryptProgress] = useState<number>(0);

  const { data: cryptManagerData, isLoading } = useDeployedContractInfo("CryptManager");

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
      if (file && triggerText && cryptManagerData) {
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
            triggerText,
            iv,
          },
          cryptFileName + "_metadata.json",
        );
        console.log("Pinned metadata file:", pinnedMetadataIpfs.IpfsHash);
        setSealCryptProgress(60);

        // Store secret key on Nillion
        const nillionSecretName = `crypt_key_${pinnedMetadataIpfs.IpfsHash}`;
        const nillionStoreId = await storeSecretsBlob(nillion, nillionClient, [
          {
            name: nillionSecretName,
            value: base64ExportedKey,
          },
        ]);
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
                { internalType: "address", name: "decryptCallback", type: "address" },
              ],
              name: "createCrypt",
              outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ] as const,
          functionName: "createCrypt",
          args: [pinnedMetadataIpfs.IpfsHash, toHex(triggerText), nillionStoreId, zeroAddress],
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

        //// TESTS

        // test retrieve secret key from Nillion
        const base64RetrievedKey = await retrieveSecretBlob(nillionClient, nillionStoreId, nillionSecretName);
        const importedKey = await importKey(base64RetrievedKey);
        console.log("Retrieved key from Nillion", { base64RetrievedKey, importedKey });

        // test fetch metadata
        const metadata = await (await fetchFromIPFS(pinnedMetadataIpfs.IpfsHash)).json();
        console.log("Fetched crypt metadata:", metadata);
        const fetchedEncryptedFile = await fetchFromIPFS(metadata.fileIpfsCid);
        const fetchedEncryptedFileBuffer = await fetchedEncryptedFile.arrayBuffer();

        // test decrypt file
        const { decrypted, utf8Decrypted } = await decrypt(
          importedKey,
          Buffer.from(metadata.iv, "base64"),
          fetchedEncryptedFileBuffer,
        );
        console.log("Decrypted file", {
          decrypted,
          utf8Decrypted,
        });

        setSealCryptStatus("success");
      } else {
        setSealCryptProgress(0);
      }
    } catch (e) {
      console.error(e);
      setSealCryptProgress(0);
      setSealCryptStatus("error");
    }
  };

  const canCryptBeSealed = file && triggerText;

  return (
    <div className="flex flex-col w-full items-center space-x-2 gap-12">
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
      {sealCryptStatus === "pending" ? (
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
