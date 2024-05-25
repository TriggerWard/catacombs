import { useState } from "react";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { Progress } from "~~/components/ui/progress";
import { Textarea } from "~~/components/ui/textarea";
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

  const [sealCryptStatus, setSealCryptStatus] = useState<{
    text: string;
    status: Status;
  }>({
    text: "seal crypt",
    status: "idle",
  });

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

  const handleClickGo = async () => {
    if (file && triggerText) {
      const fileAsArrayBuffer = await fileToArrayBuffer(file);

      // Generate key
      const { iv, key, exportedKey, base64ExportedKey } = await generateKey();
      console.log("Generated key", { iv, key, exportedKey, base64ExportedKey });

      // Encrypt file
      const { base64Encrypted, encrypted } = await encrypt(key, iv, fileAsArrayBuffer);
      console.log("Encrypted file", { base64Encrypted, encrypted });

      // Store encrypted file on IPFS
      const cryptFileName = "crypt-file_" + Date.now();
      const pinnedFileIpfs = await pinFileToIPFS(encrypted, cryptFileName);
      console.log("Pinned encrypted file: ", pinnedFileIpfs.IpfsHash);

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

      // Store secret key on Nillion
      const nillionSecretName = `crypt_key_${pinnedMetadataIpfs.IpfsHash}`;
      const nillionStoreId = await storeSecretsBlob(nillion, nillionClient, [
        {
          name: nillionSecretName,
          value: base64ExportedKey,
        },
      ]);
      console.log("Stored secret key on Nillion", { nillionStoreId, nillionSecretName });

      // Call CryptManager.sol

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
    }
  };

  return (
    <div className="flex flex-col w-full items-center space-x-2 gap-12">
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="secret-file">/my_treasure</Label>
        <Progress
          className={cn("h-10", fileUploadStatus === "pending" ? "visible" : "hidden")}
          value={fileUploadProgress}
        />
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
      <Button variant="outline" className="w-full" onClick={handleClickGo}>
        seal crypt
      </Button>
    </div>
  );
}
