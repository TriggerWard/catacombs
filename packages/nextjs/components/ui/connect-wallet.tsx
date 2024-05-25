"use client";

import Image from "next/image";
import { Button } from "./button";
import { ConnectButton as RainbowKitButton } from "@rainbow-me/rainbowkit";

export function ConnectButton() {
  return (
    <RainbowKitButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant="ghost" type="button">
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="ghost" type="button">
                    Wrong network
                  </Button>
                );
              }

              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <Button
                    onClick={openChainModal}
                    variant="ghost"
                    style={{ display: "flex", alignItems: "center" }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <Image alt={chain.name ?? "Chain icon"} src={chain.iconUrl} width={12} height={12} />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  <Button onClick={openAccountModal} type="button" variant="ghost">
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ""}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitButton.Custom>
  );
}
