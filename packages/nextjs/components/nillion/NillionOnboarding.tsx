import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const NillionOnboarding = () => {
  return (
    <div className="flex flex-col text-center items-center">
      <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
      <p>To connect with your Nillion user key...</p>
      <ol className="block my-4">
        <li>
          - Download the{" "}
          <Link
            className="text-green-400"
            href="https://docs.metamask.io/snaps/get-started/install-flask/"
            target="_blank"
            passHref
          >
            MetaMask Flask browser extension
          </Link>
          {""}
          to get access to MetaMask Snap
        </li>
        <li>- Temporarily disable any other wallet browser extensions - (Classic MetaMask, Rainbow Wallet, etc.)</li>
        <li>
          - Visit{" "}
          <Link className="text-green-400" href="https://nillion-snap-site.vercel.app" target="_blank" passHref>
            Nillion Key Management UI
          </Link>{" "}
          to generate a user key
        </li>
        <li>- Come back and connect to the snap</li>
      </ol>
    </div>
  );
};
