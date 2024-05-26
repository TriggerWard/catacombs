import dotenv from "dotenv";
import {    JsonRpcProvider,
    Wallet,
    ethers,
} from "ethers";
import externalContractsData from "../../ui/contracts/externalContracts";

import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
const exec = promisify(execOriginal);


console.log("externalContractsData", externalContractsData);

const externalContractsDataParsed = JSON.parse(
    JSON.stringify(externalContractsData)
).default;

dotenv.config();

function getProvider(chainId: string) {
    console.log(`Getting provider for chainId: ${chainId}`);
    return new JsonRpcProvider(process.env[`NODE_URL`]);
}

async function main() {
    console.log("Starting main function...");
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

    const WARDEN_MANAGER_ADDRESS =
        externalContractsDataParsed[CHAIN_ID]["WardenManager"].address;
    if (!WARDEN_MANAGER_ADDRESS)
        throw new Error(
            "WARDEN_MANAGER_ADDRESS missconfigured in externalContractsData"
        );

    const NODE_URL = process.env["NODE_URL"];
    if (!NODE_URL) throw new Error("NODE_URL not set");

    const WARDEN_ADDRESS = process.env["WARDEN_ADDRESS"];
    if (!WARDEN_ADDRESS) throw new Error("WARDEN_ADDRESS not set");

    const provider = getProvider(String(CHAIN_ID));
    const authSigner = new Wallet(PRIVATE_KEY).connect(provider);
    console.log("Crypt Warden started 🪦!\n -> CryptAddress:", CRYPT_MANAGER_ADDRESS, "\n -> Warden:", WARDEN_ADDRESS);

    const cryptManager = new ethers.Contract(
        CRYPT_MANAGER_ADDRESS,
        externalContractsDataParsed[CHAIN_ID]["CryptManager"].abi,
        authSigner
    );

    const wardenManager = new ethers.Contract(
        WARDEN_MANAGER_ADDRESS,
        externalContractsDataParsed[CHAIN_ID]["WardenManager"].abi,
        authSigner
    );

    const filter = cryptManager.filters.CryptCreated();
    const events = await cryptManager.queryFilter(filter);
    console.log(`Found ${events.length} crypt creation events.`);
    const wardenCryptsIds: any = [];
    events.forEach((event) => {
        if ("args" in event) {
            console.log(`Warden: ${event.args.warden}, Owner: ${event.args.owner}`);
            if (event.args.warden === WARDEN_ADDRESS) {
                wardenCryptsIds.push(event.args.cryptId);
            }
        }
    });

    console.log(`Warden is responsible for ${wardenCryptsIds.length} crypts.`);

    const wardenCrypts: any[] = [];
    const cryptStatusPromises = wardenCryptsIds.map((cryptId: any) =>
        cryptManager.getCrypt(cryptId).then((crypt: any) => {
            wardenCrypts.push(crypt);
        })
    );

    await Promise.all(cryptStatusPromises);
    console.log(`Retrieved details for ${wardenCrypts.length} crypts.`);

    // Now, consider only the crypts that are a) finalized and b) dont have a decryption key stored. If this is the
    // case then we need to retrieve the decryption key from nillion and push it back to the crypt manager.
    const filteredCrypts = wardenCrypts.filter((crypt) => crypt.isFinalized === true && crypt.decryptionKey === "");
    console.log(`Filtered ${filteredCrypts.length} crypts that are finalized and require decryption keys.`);

    for (const crypt of filteredCrypts) {

        const privateDataRetrievalCommand = retrieveSecretCommand(process.env.NILLION_USER_KEY, crypt.nillionCrypt, "my_blob"
        );

        console.log(`Executing command to retrieve secret for cryptId: ${crypt.cryptId}`);
        const { stdout, stderr } = await exec(privateDataRetrievalCommand);

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        const stdoutArray = JSON.parse(stdout);
        const decodedResponse = decodeAsciiArray(stdoutArray);
        console.log(`Decoded response for cryptId: ${crypt.cryptId}: ${decodedResponse}`);

        // Now, we have the private key/secret extracted from nillion we need to push it back to the crypt manager for the associated crypt.
        await cryptManager.setDecryptionKey(crypt.cryptId, decodedResponse);
        console.log(`Decryption key set for cryptId: ${crypt.cryptId}`);
    }
}


export const retrieveSecretCommand = (
    user_key: any,
    store_id: any,
    secret_name: any
) => `nillion --user-key ${user_key} \
--node-key-seed ${process.env.NEXT_PUBLIC_NILLION_NODEKEY_SEED} \
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
