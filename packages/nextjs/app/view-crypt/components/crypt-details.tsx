import { useCallback, useEffect, useState } from "react";
import { ViewCryptContent } from "./view-crypt-content";
import { prepareWriteContract, waitForTransaction, writeContract } from "@wagmi/core";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
import { FetchedCrypt, fetchCryptWithStatus } from "~~/utils/crypt-manager";
import { retrieveSecretBlob } from "~~/utils/nillion/retrieveSecretBlob";
import { cn } from "~~/utils/ui";

type Status = "idle" | "pending" | "success" | "error";

export function CryptDetails({
  nillion,
  nillionClient,
  cryptId,
}: {
  nillion: any;
  nillionClient: any;
  cryptId?: string;
}) {
  const [cryptIdToSearch, setCryptIdToSearch] = useState<string>(cryptId || "");
  const [foundCrypt, setFoundCrypt] = useState<FetchedCrypt>();
  const [searchStatus, setSearchStatus] = useState<Status>("idle");

  const [mutationState, setMutationState] = useState<{
    action: "initUnseal" | "finalizeUnseal" | "deleteCrypt" | "unseal" | "setDecryptionKey";
    status: Status;
  }>({
    action: "initUnseal",
    status: "idle",
  });

  const { data: cryptManagerData } = useDeployedContractInfo("CryptManager");
  const { data: ooV3Data } = useDeployedContractInfo("OOV3");
  const { address: connectedAddress } = useAccount();

  const handleSearchCryptId = useCallback(async () => {
    try {
      setSearchStatus("pending");
      if (!cryptIdToSearch || !cryptManagerData || !ooV3Data) {
        throw new Error("Crypt ID or CryptManager not found");
      }
      const cryptId = BigInt(cryptIdToSearch);
      const crypt = await fetchCryptWithStatus(cryptId, cryptManagerData.address, ooV3Data.address);
      console.log("Crypt", crypt);
      setFoundCrypt(crypt);
      setSearchStatus("success");
    } catch (e) {
      setFoundCrypt(undefined);
      console.error("Error searching crypt", e);
      setSearchStatus("error");
    }
  }, [cryptIdToSearch, cryptManagerData]);

  useEffect(() => {
    if (cryptId) {
      handleSearchCryptId();
    }
  }, [cryptId, handleSearchCryptId]);

  const handleInitiateUnseal = async () => {
    try {
      setMutationState({ action: "initUnseal", status: "pending" });
      if (!foundCrypt || !cryptManagerData || !ooV3Data) {
        throw new Error("Crypt not found");
      }

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: cryptManagerData.address,
        abi: [
          {
            inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
            name: "initiateDecrypt",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "initiateDecrypt",
        args: [foundCrypt.cryptId],
      });
      const { hash } = await writeContract(request);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);

      // update crypt status
      const updatedCrypt = await fetchCryptWithStatus(foundCrypt.cryptId, cryptManagerData.address, ooV3Data.address);
      console.log("Updated crypt", updatedCrypt);
      setFoundCrypt(updatedCrypt);
      setMutationState({ action: "initUnseal", status: "success" });
    } catch (e) {
      console.error("Error initiating unseal", e);
      setMutationState({ action: "initUnseal", status: "error" });
    }
  };

  const handleDeleteCrypt = async () => {
    try {
      setMutationState({ action: "deleteCrypt", status: "pending" });
      if (!foundCrypt || !cryptManagerData || !ooV3Data) {
        throw new Error("Crypt not found");
      }

      if (foundCrypt.cryptData.owner !== connectedAddress) {
        throw new Error("Only the owner can delete the crypt");
      }

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: cryptManagerData.address,
        abi: [
          {
            inputs: [{ internalType: "uint256", name: "cryptId", type: "uint256" }],
            name: "deleteCrypt",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "deleteCrypt",
        args: [foundCrypt.cryptId],
      });
      const { hash } = await writeContract(request);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);

      // update crypt status
      const updatedCrypt = await fetchCryptWithStatus(foundCrypt.cryptId, cryptManagerData.address, ooV3Data.address);
      console.log("Updated crypt", updatedCrypt);
      setFoundCrypt(updatedCrypt);
      setMutationState({ action: "deleteCrypt", status: "success" });
    } catch (e) {
      console.error("Error deleting crypt", e);
      setMutationState({ action: "deleteCrypt", status: "error" });
    }
  };

  const handleRevealDecryptionKey = async () => {
    try {
      setMutationState({ action: "setDecryptionKey", status: "pending" });
      if (!foundCrypt || !cryptManagerData || !ooV3Data) {
        throw new Error("Crypt not found");
      }

      if (foundCrypt.cryptData.warden !== connectedAddress) {
        throw new Error("Only the warden can reveal the decryption key");
      }

      // Get decryption key
      const cryptMetadataIpfsHash = foundCrypt.cryptData.ipfsDataHash;
      const nillionStoreId = foundCrypt.cryptData.nillionCrypt;
      const nillionSecretName = `crypt_key_${cryptMetadataIpfsHash}`;
      const base64RetrievedKey = await retrieveSecretBlob(nillionClient, nillionStoreId, nillionSecretName);

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: cryptManagerData.address,
        abi: [
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
        functionName: "setDecryptionKey",
        args: [foundCrypt.cryptId, base64RetrievedKey],
      });
      const { hash } = await writeContract(request);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);

      // update crypt status
      const updatedCrypt = await fetchCryptWithStatus(foundCrypt.cryptId, cryptManagerData.address, ooV3Data.address);
      console.log("Updated crypt", updatedCrypt);
      setFoundCrypt(updatedCrypt);
      setMutationState({ action: "unseal", status: "success" });
    } catch (e) {
      console.error("Error revealing decryption key", e);
      setMutationState({ action: "unseal", status: "error" });
    }
  };

  const handleFinalizeUnseal = async () => {
    try {
      setMutationState({ action: "finalizeUnseal", status: "pending" });
      if (!foundCrypt || !cryptManagerData || !ooV3Data) {
        throw new Error("Crypt not found");
      }

      // Call CryptManager.sol
      const { request } = await prepareWriteContract({
        address: ooV3Data.address,
        abi: [
          {
            inputs: [{ internalType: "bytes32", name: "assertionId", type: "bytes32" }],
            name: "settleAssertion",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "settleAssertion",
        args: [foundCrypt.cryptData.assertionId],
      });
      const { hash } = await writeContract(request);
      console.log("Transaction hash", hash);
      const receipt = await waitForTransaction({ hash, confirmations: 1 });
      console.log("Transaction receipt", receipt);

      // update crypt status
      const updatedCrypt = await fetchCryptWithStatus(foundCrypt.cryptId, cryptManagerData.address, ooV3Data.address);
      console.log("Updated crypt", updatedCrypt);
      setFoundCrypt(updatedCrypt);
      setMutationState({ action: "finalizeUnseal", status: "success" });
    } catch (e) {
      console.error("Error finalizing unseal", e);
      setMutationState({ action: "finalizeUnseal", status: "error" });
    }
  };

  const isOwner = foundCrypt?.cryptData.owner === connectedAddress;
  const isWarden = foundCrypt?.cryptData.warden === connectedAddress;
  const canBeFinalized =
    foundCrypt?.cryptStatus === "unseal-initiated" && Number(foundCrypt.assertionExpirationTime) < Date.now() / 1000;
  const isDecryptionKeyRevealed = !!foundCrypt?.cryptData.decryptionKey;

  return (
    <div className="flex flex-col items-center gap-12 flex-shrink-0">
      <div className="flex flex-col w-full gap-4 flex-shrink-0">
        <Label className="font-bold w-full" htmlFor="crypt-id">
          /crypt_id
        </Label>
        <div className="flex w-full items-center">
          <Input value={cryptIdToSearch} id="crypt-id" onChange={e => setCryptIdToSearch(e.target.value)} />
          <Button
            onClick={handleSearchCryptId}
            variant="ghost"
            disabled={searchStatus === "pending" || !Boolean(cryptIdToSearch)}
          >
            {searchStatus === "pending" ? "searching..." : "search"}
          </Button>
        </div>
      </div>
      {searchStatus === "pending" ? null : foundCrypt ? (
        <div className="flex flex-col">
          <div className="flex flex-col gap-y-8">
            <div>
              <div className="font-bold">/status</div>
              <div
                className={cn(
                  "text-sm",
                  foundCrypt.cryptStatus === "sealed"
                    ? "text-red-500"
                    : foundCrypt.cryptStatus === "unsealed"
                    ? "text-green-500"
                    : "text-white",
                )}
              >
                {foundCrypt.cryptStatus}
              </div>
            </div>
            <div>
              <div className="font-bold">/creator</div>
              <div className="text-sm">{foundCrypt.cryptData.owner}</div>
            </div>
            <div>
              <div className="font-bold">/warden</div>
              <div className="text-sm">{foundCrypt.cryptData.warden}</div>
            </div>
            <div>
              <div className="font-bold">/enc_file</div>
              <div className="text-sm">{foundCrypt.metadata.fileIpfsCid}</div>
            </div>
            <div>
              <div className="font-bold">/trigger</div>
              <div className="text-sm text-wrap">{foundCrypt.metadata.triggerText}</div>
            </div>
          </div>
          <div className="flex flex-col mt-12 gap-8">
            {foundCrypt.cryptStatus === "sealed" && (
              <Button variant="outline" onClick={handleInitiateUnseal} disabled={mutationState.status === "pending"}>
                {mutationState.action === "initUnseal" && mutationState.status === "pending"
                  ? "initiation unseal..."
                  : "initiate unsealing"}
              </Button>
            )}
            {foundCrypt.cryptStatus === "unseal-initiated" && canBeFinalized ? (
              <Button variant="outline" onClick={handleFinalizeUnseal} disabled={mutationState.status === "pending"}>
                {mutationState.action === "finalizeUnseal" && mutationState.status === "pending"
                  ? "finalizing unseal..."
                  : "finalize unseal"}
              </Button>
            ) : null}
            {isOwner && foundCrypt.cryptStatus === "sealed" && (
              <Button
                variant="outline"
                className="text-red-500"
                onClick={handleDeleteCrypt}
                disabled={mutationState.status === "pending"}
              >
                {mutationState.action === "deleteCrypt" && mutationState.status === "pending"
                  ? "deleting crypt..."
                  : "delete crypt"}
              </Button>
            )}
            {isWarden && !isDecryptionKeyRevealed && foundCrypt.cryptStatus === "unsealed" && (
              <Button
                variant="outline"
                onClick={handleRevealDecryptionKey}
                disabled={mutationState.status === "pending"}
              >
                {mutationState.action === "setDecryptionKey" && mutationState.status === "pending"
                  ? "revealing decryption key..."
                  : "reveal decryption key"}
              </Button>
            )}
            {isOwner || !!foundCrypt.cryptData.decryptionKey ? (
              <ViewCryptContent nillionClient={nillionClient} crypt={foundCrypt} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="w-[383px] flex flex-row justify-center">Not found</div>
      )}
    </div>
  );
}
