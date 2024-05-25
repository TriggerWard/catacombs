"use client";

import { usePathname } from "next/navigation";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { WagmiConfig } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { appChains } from "~~/services/web3/wagmiConnectors";

const pillarAscii = `
   (_,.....,_)
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     ||||||| 
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     ||||||| 
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
    ,_______,
      )   (
    ,      '
  _/_________\_
 |_____________|
`;

const pillarAsciiSmall = `
   (_,.....,_)
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     ||||||| 
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
     |||||||
    ,_______,
      )   (
    ,      '
  _/_________\_
 |_____________|
`;

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();

  const isViewCrypt = path === "/view-crypt";
  const pillarAsciiToUse = isViewCrypt ? pillarAscii : pillarAsciiSmall;

  return (
    <>
      <div className="flex flex-col min-h-screen ">
        <Header />
        <main className="flex flex-row w-[780px] mx-auto justify-between">
          <div>
            <pre>{pillarAsciiToUse}</pre>
          </div>
          <div className="flex flex-col">{children}</div>
          <div className="mr-2">
            <pre>{pillarAsciiToUse}</pre>
          </div>
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={appChains.chains} avatar={BlockieAvatar} theme={darkTheme()}>
        <ScaffoldEthApp>{children}</ScaffoldEthApp>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};
