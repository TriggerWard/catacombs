"use client";

import { useEffect, useState } from "react";
import { RegisterWardenForm } from "./components/register-warden-form";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { NillionOnboarding } from "~~/components/nillion/NillionOnboarding";
import { Button } from "~~/components/ui/button";
import { getUserKeyFromSnap } from "~~/utils/nillion/getUserKeyFromSnap";

const RegisterWarden: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [connectedToSnap, setConnectedToSnap] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nillion, setNillion] = useState<any>(null);
  const [nillionClient, setNillionClient] = useState<any>(null);

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
      <div className="flex items-center flex-col w-full">
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
        </div>

        <div className="flex-grow w-full mt-16 flex-shrink-0">
          <div className="flex justify-center items-center gap-12 flex-col">
            {!connectedToSnap || !userId ? (
              <NillionOnboarding />
            ) : (
              <RegisterWardenForm nillionUserKey={userId} nillion={nillion} nillionClient={nillionClient} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWarden;
