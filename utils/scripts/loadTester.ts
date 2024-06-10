import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";
import { parseArgs } from "util";

const { values, _positionals } = parseArgs({
    args: Bun.argv,
    options: {
        amount_to_pass: {
            type: 'string',
        },
        amount_to_bridge: {
            type: 'string',
        },
        l1_pk: {
            type: 'string',
        },
        l2_pk: {
            type: 'string',
        },
        sleep_ms: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});

if (Object.keys(values).length !== 0) {
    console.log(values);
}

// HTTP RPC endpoints
const L1_RPC_ENDPOINT = env.L1_RPC_URL || "http://127.0.0.1:8545";
const L2_RPC_ENDPOINT = env.L2_RPC_URL || "http://127.0.0.1:3050";

const AMOUNT_TO_PASS = values.amount_to_pass || env.AMOUNT_TO_PASS || "0.0001";
const AMOUNT_TO_BRIDGE = values.amount_to_bridge || env.AMOUNT_TO_BRIDGE || "0.5";
const SLEEP_MS = values.sleep_ms || env.SLEEP_MS || "1000";

const L1_RICH_PK = values.l1_pk || env.L1_RICH_PK || "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

const L1_RICH = {
    addr: ethers.utils.computeAddress(L1_RICH_PK),
    pk: L1_RICH_PK,
};

const L2_PK = values.l2_pk || env.L2_PK || "0x27593fea79697e947890ecbecce7901b0008345e5d7259710d0dd5e500d040be";


const L2_ACCOUNT = {
    addr: ethers.utils.computeAddress(L2_PK),
    pk: L2_PK,
};

async function main() {
    // Initialize the wallet.
    const l1provider = new ethers.providers.JsonRpcProvider(L1_RPC_ENDPOINT)
    const l2provider = new Provider(L2_RPC_ENDPOINT);
    const wallet1 = new Wallet(L1_RICH.pk, l2provider, l1provider);
    const wallet2 = new Wallet(L2_ACCOUNT.pk, l2provider, l1provider);

    const sleep = Number(SLEEP_MS) || 100;

    console.log(`Running script to deposit ${AMOUNT_TO_BRIDGE}ETH in L2`);
    console.log(`Deposit ${AMOUNT_TO_BRIDGE}ETH using ${L1_RICH.addr}`);

    console.log(`L1 Endpoint: ${L1_RPC_ENDPOINT}`);
    console.log(`L2 Endpoint: ${L2_RPC_ENDPOINT}`);

    console.log("#####################################################\n");
    console.log(`L1 balance before deposit: ${ethers.utils.formatEther(await wallet1.getBalanceL1())}`);
    console.log(`L2 balance before deposit: ${ethers.utils.formatEther(await wallet1.getBalance())}`);
    console.log("\n#####################################################\n");

    const tx = await wallet1.deposit({
        token: utils.ETH_ADDRESS,
        to: await wallet1.getAddress(),
        amount: ethers.utils.parseEther(AMOUNT_TO_BRIDGE),
    });
    const receipt = await tx.wait();
    console.log(`Tx: ${receipt.transactionHash}`);

    console.log("\n#####################################################\n")
    console.log(`L1 balance after deposit: ${ethers.utils.formatEther(await wallet1.getBalanceL1())}`);
    console.log(`L2 balance after deposit: ${ethers.utils.formatEther(await wallet1.getBalance())}`);
    console.log("\n#####################################################\n")

    console.log(`Running script to generate transactions between two accounts in L2`);
    console.log(`With an interval between txs of ${SLEEP_MS}[ms]`);
    console.log(`Using ${AMOUNT_TO_PASS}ETH to send back and forth`);
    console.log(`Using:\naddr(1): ${L1_RICH.addr}\naddr(2): ${L2_ACCOUNT.addr}`);

    console.log("\n#####################################################\n");

    console.log("Send initial funds to the second wallet to pay the fees");

    const tx0 = await wallet1.transfer({
        to: await wallet2.getAddress(),
        amount: ethers.utils.parseEther(String(Number(AMOUNT_TO_BRIDGE)/2)),
    });
    const receipt1 = await tx0.wait();
    console.log(`Tx(0): ${receipt1.transactionHash}`);

    while (true) {
        const tx1 = await wallet1.transfer({
            to: await wallet2.getAddress(),
            amount: ethers.utils.parseEther(AMOUNT_TO_PASS),
        });
        const receipt1 = await tx1.wait();
        console.log(`Tx(1): ${receipt1.transactionHash}`);

        const tx2 = await wallet2.transfer({
            to: await wallet1.getAddress(),
            amount: ethers.utils.parseEther(AMOUNT_TO_PASS),
        });
        const receipt2 = await tx2.wait();
        console.log(`Tx(2): ${receipt2.transactionHash}`);
        console.log(`addr(1): ${L1_RICH.addr} balance: ${ethers.utils.formatEther(await wallet1.getBalance())}`);
        console.log(`addr(2): ${L2_ACCOUNT.addr} balance: ${ethers.utils.formatEther(await wallet2.getBalance())}`);
        console.log("\n#####################################################\n")
        await Bun.sleep(sleep);
    }
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
