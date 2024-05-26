import dotenv from "dotenv";
import {
  JsonRpcProvider,
  Provider,
  Signer,
  Wallet,
  ethers,
  keccak256,
} from "ethers";
import externalContractsData from "../../ui/contracts/externalContracts";

import { exec } from "child_process";

import { retrieveSecretBlob } from "../../ui/utils/nillion/retrieveSecretBlob";
console.log("externalContractsData", externalContractsData);

const externalContractsDataParsed = JSON.parse(
  JSON.stringify(externalContractsData)
).default;

dotenv.config();

function getProvider(chainId: string) {
  return new JsonRpcProvider(process.env[`NODE_URL`]);
}

async function main() {
  // Environment variables & consts.
  const CHAIN_ID = 11155111;
  if (!CHAIN_ID) throw new Error("CHAIN_ID not set");

  const PRIVATE_KEY = process.env["PRIVATE_KEY"];
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set");

  const CRYPT_MANAGER_ADDRESS =
    externalContractsDataParsed[CHAIN_ID]["CryptManager"].address;
  if (!CRYPT_MANAGER_ADDRESS)
    throw new Error(
      "CRYPT_MANAGER_ADDRESS missconfigured in externalContractsData"
    );

  const NODE_URL = process.env["NODE_URL"];
  if (!NODE_URL) throw new Error("NODE_URL not set");

  const WARDEN_ADDRESS = process.env["WARDEN_ADDRESS"];
  if (!WARDEN_ADDRESS) throw new Error("WARDEN_ADDRESS not set");

  const provider = getProvider(String(CHAIN_ID));
  const authSigner = new Wallet(PRIVATE_KEY).connect(provider);
  console.log(
    "Crypt Warden started 🪦!\n -> CryptAddress:",
    CRYPT_MANAGER_ADDRESS,
    "\n -> Warden:",
    WARDEN_ADDRESS
  );

  const cryptManager = new ethers.Contract(
    CRYPT_MANAGER_ADDRESS,
    externalContractsDataParsed[CHAIN_ID]["CryptManager"].abi,
    authSigner
  );

  const optimisticOracleAddress = await cryptManager.optimisticOracle();
  console.log("Optimistic Oracle Address:", optimisticOracleAddress);

  const filter = cryptManager.filters.CryptCreated();
  const events = await cryptManager.queryFilter(filter);
  const wardenCrypts: any = [];
  events.forEach((event) => {
    if ("args" in event) {
      console.log(`Warden: ${event.args.warden}, Owner: ${event.args.owner}`);
      if (event.args.warden === WARDEN_ADDRESS) {
        wardenCrypts.push(event.args.cryptId);
      }
    }
  });

  console.log("Warden Crypts:", wardenCrypts);

  const wardenFinalizedCrypts: any[] = [];
  const cryptStatusPromises = wardenCrypts.map((cryptId: any) =>
    cryptManager.getCrypt(cryptId).then((crypt: { isFinalized: boolean }) => {
      if (crypt.isFinalized) {
        wardenFinalizedCrypts.push(cryptId);
      }
    })
  );

  await Promise.all(cryptStatusPromises);
  console.log("Warden Finalized Crypts:", wardenFinalizedCrypts);

  console.log("decodeAsciiArray", decodeAsciiArray([52, 50, 48]));
  // exec('your-shell-command', (error, stdout, stderr) => {
  //     if (error) {
  //         console.error(`Error: ${error.message}`);
  //         return;
  //     }
  //     if (stderr) {
  //         console.error(`stderr: ${stderr}`);
  //         return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  // });

  console.log(
    retrieveSecretCommand(
      "4AY2pXeHDHJg6SScbD1CAdNGhMRMbsvz75Nf14Wg9HuULRwxUt5TkFkzYEm9rYBQQKapz8o5Pd1dK9UrkYTuM3mQ",
      "9d9d6bc3-e864-4741-8585-85dc990a4247",
      "my_blob"
    )
  );
}

// TODO: Ensure NEXT_PUBLIC_NILLION_WALLET_PRIVATE_KEY does not have 0x prefix
export const retrieveSecretCommand = (
  user_key: any,
  store_id: any,
  secret_name: any
) => `nillion --user-key ${user_key} \
  --node-key ${process.env.NEXT_PUBLIC_NILLION_NODEKEY_TEXT_PARTY_1} \
  -b ${process.env.NEXT_PUBLIC_NILLION_BOOTNODE_MULTIADDRESS} \
  --payments-private-key ${process.env.NEXT_PUBLIC_NILLION_WALLET_PRIVATE_KEY} \ 
  --payments-chain-id ${process.env.NEXT_PUBLIC_NILLION_CHAIN_ID} \
  --payments-rpc-endpoint ${process.env.NEXT_PUBLIC_NILLION_BLOCKCHAIN_RPC_ENDPOINT} \
  --payments-sc-address ${process.env.NEXT_PUBLIC_NILLION_PAYMENTS_SC_ADDRESS} \
  --blinding-factors-manager-sc-address ${process.env.NEXT_PUBLIC_NILLION_BLINDING_FACTORS_MANAGER_SC_ADDRESS} \
  retrieve-secret \
  --cluster-id ${process.env.NEXT_PUBLIC_NILLION_CLUSTER_ID} \
  --store-id ${store_id} \
  --secret-id ${secret_name}`;

function decodeAsciiArray(asciiArray: any) {
  return asciiArray
    .map((charCode: any) => String.fromCharCode(charCode))
    .join("");
}

main();
