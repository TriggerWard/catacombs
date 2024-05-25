"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CryptDetails } from "./components/crypt-details";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CopyString } from "~~/components/nillion/CopyString";
import { NillionOnboarding } from "~~/components/nillion/NillionOnboarding";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { getUserKeyFromSnap } from "~~/utils/nillion/getUserKeyFromSnap";

const ViewCrypt: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [connectedToSnap, setConnectedToSnap] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nillion, setNillion] = useState<any>(null);
  const [nillionClient, setNillionClient] = useState<any>(null);

  const searchParams = useSearchParams();
  const cryptIdFromParams = searchParams.get("cryptId");

  async function handleConnectToSnap() {
    const snapResponse = await getUserKeyFromSnap();
    setUserKey(snapResponse?.user_key || null);
    setConnectedToSnap(snapResponse?.connectedToSnap || false);
  }

  useEffect(() => {
    if (userKey) {
      const getNillionClientLibrary = async () => {
        const nillionClientUtil = await import("~~/utils/nillion/nillionClient");
        const libraries = await nillionClientUtil.getNillionClient(userKey);
        setNillion(libraries.nillion);
        setNillionClient(libraries.nillionClient);
        return libraries.nillionClient;
      };

      getNillionClientLibrary().then(nillionClient => {
        const user_id = nillionClient.user_id;
        setUserId(user_id);
      });
    }
  }, [userKey]);

  const resetNillion = () => {
    setConnectedToSnap(false);
    setUserKey(null);
    setUserId(null);
    setNillion(null);
    setNillionClient(null);
  };

  useEffect(() => {
    if (!connectedAddress) {
      resetNillion();
    }
  }, [connectedAddress]);

  return (
    <div className="flex w-[383px]">
      <div className="flex items-center flex-col pt-10">
        <div className="flex flex-col">
          <h1 className="text-xl">
            {connectedAddress && connectedToSnap && !userKey && (
              <a target="_blank" href="https://nillion-snap-site.vercel.app/" rel="noopener noreferrer">
                <Button className="mt-4">No Nillion User Key - Generate and store user key here</Button>
              </a>
            )}
          </h1>

          {connectedAddress && !connectedToSnap && (
            <Button className="mt-4" onClick={handleConnectToSnap}>
              Connect to Snap with your Nillion User Key
            </Button>
          )}

          {/* {connectedToSnap && (
            <div>
              {userKey && (
                <div>
                  <div className="flex justify-center items-center space-x-2">
                    <p className="my-2 font-medium">
                      🤫 Nillion User Key from{" "}
                      <a target="_blank" href="https://nillion-snap-site.vercel.app/" rel="noopener noreferrer">
                        MetaMask Flask
                      </a>
                      :
                    </p>

                    <CopyString str={userKey} />
                  </div>

                  {userId && (
                    <div className="flex justify-center items-center space-x-2">
                      <p className="my-2 font-medium">Connected as Nillion User ID:</p>
                      <CopyString str={userId} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )} */}
        </div>

        <div className="flex-grow w-full">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            {!connectedToSnap ? (
              <NillionOnboarding />
            ) : (
              <CryptDetails cryptId={cryptIdFromParams || undefined} nillion={nillion} nillionClient={nillionClient} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCrypt;
