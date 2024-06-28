import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";
import { parseArgs } from "util";

const { values, _positionals } = parseArgs({
    args: Bun.argv,
    options: {
        amount: {
            type: 'string',
        },
        from_pk: {
            type: 'string',
        },
        to: {
            type: 'string',
        },
        l1_or_l2: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});


// HTTP RPC endpoints
const L1_RPC_ENDPOINT = env.L1_RPC_URL || "http://127.0.0.1:8545";
const L2_RPC_ENDPOINT = env.L2_RPC_URL || "http://127.0.0.1:3050";


const FROM_PK = values.from_pk || "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

let TO_ADDR;

if (values.to === "random") {
    TO_ADDR = ethers.Wallet.createRandom().address;
}
else {
    TO_ADDR = values.to || "0xde03a0B5963f75f1C8485B355fF6D30f3093BDE7";
}

const FROM = {
    addr: ethers.utils.computeAddress(FROM_PK),
    pk: FROM_PK
};

const TO = {
    addr: TO_ADDR,
    pk: undefined
};

const AMOUNT = values.amount || "0.1";

async function main() {
    // Initialize the wallet.

    const l1provider = new ethers.providers.JsonRpcProvider(L1_RPC_ENDPOINT)
    const l2provider = new Provider(L2_RPC_ENDPOINT);

    const ethersWallet = new ethers.Wallet(FROM.pk!, l1provider);

    const wallet = new Wallet(FROM.pk!, l2provider, l1provider);

    console.log(`L1 balance : ${ethers.utils.formatEther(await wallet.getBalanceL1())}`);

    console.log(`L1 Endpoint: ${L1_RPC_ENDPOINT}`)
    console.log(`L2 Endpoint: ${L2_RPC_ENDPOINT}`)
    console.log("#####################################################\n")
    console.log(`(from) balance before deposit: ${ethers.utils.formatEther(await wallet.getBalanceL1())}`);
    console.log(`(to) balance before deposit: ${ethers.utils.formatEther(await l1provider.getBalance(TO.addr!))}`);
    console.log("\n#####################################################\n")

    await ethersWallet.sendTransaction({
        to: TO.addr!,
        value: ethers.utils.parseEther(AMOUNT),
    }).then(async tx => {
        const receipt = await tx.wait();
        console.log(`Tx hash: ${receipt.transactionHash}`)
    }).catch((e) => {
        console.error(`Error Sending Tx: \n${e}`);
    });

    console.log("\n#####################################################\n");
    console.log(`(from) balance after deposit: ${ethers.utils.formatEther(await wallet.getBalanceL1())}`);
    console.log(`(to) balance after deposit: ${ethers.utils.formatEther(await l1provider.getBalance(TO.addr!))}`);
    console.log("\n#####################################################");
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
