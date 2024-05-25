import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "~~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/components/ui/dialog";
import { Progress } from "~~/components/ui/progress";
import { FetchedCrypt } from "~~/utils/crypt-manager";
import { decrypt, importKey } from "~~/utils/crypto";
import { fetchFromIPFS } from "~~/utils/ipfs";
import { retrieveSecretBlob } from "~~/utils/nillion/retrieveSecretBlob";
import { wait } from "~~/utils/wait";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString();

type Status = "idle" | "pending" | "success" | "error";

export function ViewCryptContent(props: { crypt: FetchedCrypt; nillionClient: any }) {
  const { crypt } = props;
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<Status>("idle");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [decoded, setDecoded] = useState<ArrayBuffer | undefined>();

  useEffect(() => {
    if (!crypt || !isOpen) {
      setProgress(0);
      setStatus("idle");
      return;
    }

    setStatus("pending");
    const fetchAndDecrypt = async () => {
      setProgress(10);
      const cryptMetadataIpfsHash = crypt.cryptData.ipfsDataHash;
      const nillionStoreId = crypt.cryptData.nillionCrypt;
      const nillionSecretName = `crypt_key_${cryptMetadataIpfsHash}`;

      // retrieve secret key from Nillion
      // TODO: replace with contract based key retrieval
      const base64RetrievedKey = await retrieveSecretBlob(props.nillionClient, nillionStoreId, nillionSecretName);
      const importedKey = await importKey(base64RetrievedKey);
      console.log("Retrieved key from Nillion", { base64RetrievedKey, importedKey });
      setProgress(40);

      // fetch metadata
      const metadata = await (await fetchFromIPFS(cryptMetadataIpfsHash)).json();
      console.log("Fetched crypt metadata:", metadata);
      setProgress(60);
      const fetchedEncryptedFile = await fetchFromIPFS(metadata.fileIpfsCid);
      const fetchedEncryptedFileBuffer = await fetchedEncryptedFile.arrayBuffer();
      setProgress(80);

      // decrypt file
      const { decrypted, utf8Decrypted } = await decrypt(
        importedKey,
        Buffer.from(metadata.iv, "base64"),
        fetchedEncryptedFileBuffer,
      );
      setProgress(100);
      setDecoded(decrypted);
      console.log("Decrypted file", {
        decrypted,
        utf8Decrypted,
      });
      await wait(500);
      setStatus("success");
    };
    fetchAndDecrypt().catch(e => {
      console.error("Error fetching crypt content", e);
      setProgress(0);
      setStatus("error");
    });
  }, [crypt, isOpen]);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="ghost" onClick={() => setIsOpen(isOpen => !isOpen)}>
          [view contents]
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#191919] border-[1px] border-white">
        {status === "pending" ? (
          <Progress value={progress}>decrypting... ({progress}%)</Progress>
        ) : decoded ? (
          <DialogHeader>
            <DialogTitle>decrypted crypt content</DialogTitle>
            <DialogDescription>
              <RenderDecryptedContent decoded={decoded} fileType={crypt?.metadata.fileType} />
            </DialogDescription>
          </DialogHeader>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenderDecryptedContent(props: { fileType?: string; decoded: ArrayBuffer }) {
  const { fileType, decoded } = props;

  if (!fileType) {
    return <div>{Buffer.from(decoded).toString("utf-8")}</div>;
  }

  if (fileType.includes("image")) {
    return <ImageByData data={decoded} fileType={fileType} />;
  }

  if (fileType.includes("pdf")) {
    return <PdfByData data={decoded} />;
  }

  return <div>{Buffer.from(decoded).toString("utf-8")}</div>;
}

function ImageByData(props: { data: ArrayBuffer; fileType: string }) {
  const fileExt = props.fileType.split("/")[1];
  const base64Data = Buffer.from(props.data).toString("base64");
  const src = `data:image/${fileExt};base64,${base64Data}`;
  return <img src={src} />;
}

function PdfByData(props: { data: ArrayBuffer }) {
  const base64Data = Buffer.from(props.data).toString("base64");
  const src = `data:application/pdf;base64,${base64Data}`;

  return (
    <div className="h-[600px] overflow-scroll">
      <Document file={src}>
        <Page height={200} scale={3} pageNumber={1} />
      </Document>
    </div>
  );
}
