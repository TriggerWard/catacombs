
import dotenv from "dotenv";
import { JsonRpcProvider, Provider, Signer, Wallet, ethers, keccak256 } from "ethers";
import externalContractsData from "../../nextjs/contracts/externalContracts";

import { exec } from 'child_process';

import { retrieveSecretBlob } from "../../nextjs/utils/nillion/retrieveSecretBlob";
console.log("externalContractsData", externalContractsData)

const externalContractsDataParsed = JSON.parse(JSON.stringify(externalContractsData)).default;


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

    const CRYPT_MANAGER_ADDRESS = externalContractsDataParsed[CHAIN_ID]["CryptManager"].address;
    if (!CRYPT_MANAGER_ADDRESS) throw new Error("CRYPT_MANAGER_ADDRESS missconfigured in externalContractsData");

    const NODE_URL = process.env["NODE_URL"];
    if (!NODE_URL) throw new Error("NODE_URL not set");

    const WARDEN_ADDRESS = process.env["WARDEN_ADDRESS"];
    if (!WARDEN_ADDRESS) throw new Error("WARDEN_ADDRESS not set");


    const provider = getProvider(String(CHAIN_ID));
    const authSigner = new Wallet(PRIVATE_KEY).connect(provider);
    console.log("Crypt Warden started 🪦!\n -> CryptAddress:", CRYPT_MANAGER_ADDRESS, "\n -> Warden:", WARDEN_ADDRESS);

    const cryptManager = new ethers.Contract(CRYPT_MANAGER_ADDRESS, externalContractsDataParsed[CHAIN_ID]["CryptManager"].abi, authSigner);

    const optimisticOracleAddress = await cryptManager.optimisticOracle();
    console.log("Optimistic Oracle Address:", optimisticOracleAddress);


    const filter = cryptManager.filters.CryptCreated();
    const events = await cryptManager.queryFilter(filter);
    const wardenCrypts: any = [];
    events.forEach(event => {
        if ('args' in event) {

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


    console.log("Process.env", process.env)

    const getDataCommand = `nillion --user-key ${process.env.NILLION_USER_KEY} \
	--node-key ${process.env.NILLION_NODE_KEY} \
	-b ${process.env.NEXT_PUBLIC_NILLION_BOOTNODE_MULTIADDRESS} \
	--payments-private-key ${process.env.NEXT_PUBLIC_NILLION_WALLET_PRIVATE_KEY} \
	--payments-chain-id ${process.env.NEXT_PUBLIC_NILLION_CHAIN_ID} \
	--payments-rpc-endpoint ${process.env.NEXT_PUBLIC_NILLION_BLOCKCHAIN_RPC_ENDPOINT} \
	--payments-sc-address ${process.env.NEXT_PUBLIC_NILLION_PAYMENTS_SC_ADDRESS} \
	--blinding-factors-manager-sc-address ${process.env.NEXT_PUBLIC_NILLION_BLINDING_FACTORS_MANAGER_SC_ADDRESS} \
  retrieve-secret \
  --cluster-id ${process.env.NEXT_PUBLIC_NILLION_CLUSTER_ID} \
  --store-id ${process.env.NEXT_PUBLIC_NILLION_STORE_ID} \
  --secret-id ${process.env.NEXT_PUBLIC_NILLION_SECRET_ID}`

    console.log("getDataCommand", getDataCommand)

    console.log("decodeAsciiArray", decodeAsciiArray([52, 50, 48]))
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



}
function decodeAsciiArray(asciiArray: any) {
    return asciiArray.map((charCode: any) => String.fromCharCode(charCode)).join('');

}

main();


nillion --user-key 4pEgXmeogsMAMgadC2zERGtXxpvLCkLeBVWPDQwERP3XRTCzSaSfx7ezZ51ntGwLuAoZNUqvPC8wo7jKoiaBzQc 	--node-key 23jhTcGxMzYzuTwHEVfzZFLC4jJVfW6zKPE6wqkFwoQ38UAnKsWhALQpWx9h8cavfhVPtMPDmNeKMkYxXdZ1AgManBLpR 	-b /ip4/127.0.0.1/tcp/47354/p2p/12D3KooWNQTeFoEFHLp46RVG3ydUSZ9neeoAL44DSRYjExWLsRQ4 	--payments-private-key 5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a 	--payments-chain-id 31337 	--payments-rpc-endpoint http://localhost:33279 	--payments-sc-address 5fc8d32690cc91d4c39d9d3abcbd16989f875707 	--blinding-factors-manager-sc-address a513e6e4b8f2a923d98304ec87f64353c4d5c853   retrieve-secret   --cluster-id 18d71351-b5d9-4d8d-bbcd-cdcc615badab   --store-id undefined   --secret-id undefined


nillion --user-key 4pEgXmeogsMAMgadC2zERGtXxpvLCkLeBVWPDQwERP3XRTCzSaSfx7ezZ51ntGwLuAoZNUqvPC8wo7jKoiaBzQc --node-key 23jhTcGxMzYzuTwHEVfzZFLC4jJVfW6zKPE6wqkFwoQ38UAnKsWhALQpWx9h8cavfhVPtMPDmNeKMkYxXdZ1AgManBLpR -b /ip4/127.0.0.1/tcp/47354/p2p/12D3KooWNQTeFoEFHLp46RVG3ydUSZ9neeoAL44DSRYjExWLsRQ4 --payments-private-key 5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --payments-chain-id 31337 --payments-rpc-endpoint http://localhost:33279 --payments-sc-address 5fc8d32690cc91d4c39d9d3abcbd16989f875707 --blinding-factors-manager-sc-address a513e6e4b8f2a923d98304ec87f64353c4d5c853 retrieve-secret --cluster-id 18d71351-b5d9-4d8d-bbcd-cdcc615badab --store-id 33944651-ed55-4853-93ec-569778630137 --secret-id my_blob