import React from "react";
import Link from "next/link";

const asciiArt = `
=================================================================================
`;
const asciiArt2 = `
  |                                                                            |
  |____________________________________________________________________________| 
`;
const asciiArt3 = `
 |                                                                              |
`;
const asciiArt4 = `
 |______________________________________________________________________________|
`;
const asciiArt5 = `
|                                                                                |
`;
const asciiArt6 = `
|________________________________________________________________________________|
`;

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="flex flex-col items-center w-[780px] mx-auto mb-20">
      <div className="flex flex-col items-center justify-center">
        <pre>{asciiArt}</pre>
      </div>
      <div className="flex flex-col items-center justify-center -mt-6">
        <pre>{asciiArt2}</pre>
      </div>

      <div className="flex flex-col items-center justify-center -mt-6">
        <pre>{asciiArt3}</pre>
      </div>
      <div className="flex flex-row items-center w-[750px] px-6 -mt-4 z-10 justify-between">
        <div className="flex flex-row">
          <Link href="/" passHref>
            <span className="">trigger_ward</span>
          </Link>
          <div className="mx-2">|</div>
          <Link href="https://ethberlin.org/" passHref target="_blank">
            <span>ethberlin04</span>
          </Link>
        </div>
        <div className="flex flex-row gap-4">
          <Link
            href="https://github.com/TriggerWard/catacombs?tab=readme-ov-file#-trigger-ward"
            passHref
            target="_blank"
          >
            <span className="">about</span>
          </Link>
          <Link href="https://github.com/TriggerWard/catacombs" passHref target="_blank">
            <span className="">github</span>
          </Link>
          <Link href="/" passHref>
            <span>documentation</span>
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center -mt-8">
        <pre>{asciiArt4}</pre>
      </div>

      <div className="flex flex-col items-center justify-center -mt-6 ml-2">
        <pre>{asciiArt5}</pre>
      </div>
      <div className="flex flex-col items-center justify-center -mt-6 ml-2">
        <pre>{asciiArt6}</pre>
      </div>
    </div>
  );
};
