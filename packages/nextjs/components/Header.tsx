"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ui/connect-wallet";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const HeaderMenuLink = ({ label, href }: { label: string; href: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      {isActive ? <span className="text-green-400">{`< ${label} >`}</span> : <span>{label}</span>}
    </Link>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const asciiArt = `
                                    ___---___
                              ___---___---___---___
                        ___---___---         ---___---___
                  ___---___---                     ---___---___
            ___---___---                                 ---___---___
      ___---___---                                             ---___---___
___---___---                                                         ---___---___
___---___---_________________________________________________________---___---___
`;
  const asciiArt2 = `
=================================================================================
`;
  return (
    <div className="flex flex-col items-start w-[780px] mx-auto">
      <div className="flex flex-col items-center justify-center">
        <pre>{asciiArt}</pre>
        <div className="text-3xl font-semibold absolute top-36">trigger_ward</div>
      </div>
      <div className="flex flex-row mt-4 items-center justify-between w-full z-10">
        <div className="flex flex-row gap-8">
          <HeaderMenuLink label="create crypt" href="/" />
          <HeaderMenuLink label="view crypt" href="/view-crypt" />
        </div>
        <div className="flex flex-row items-center gap-8">
          {/* <HeaderMenuLink label="my crypts" href="/my-crypts" /> */}
          <ConnectButton />
        </div>
      </div>
      <div className="-mt-4">
        <pre>{asciiArt2}</pre>
      </div>
    </div>
  );
};
