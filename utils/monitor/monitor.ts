import { IncomingWebhook } from "@slack/webhook";
import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";

// ################ SLACK ################
const url = process.env.SLACK_WEBHOOK_URL;
const slack = new IncomingWebhook(url!);

const log = async (msg: string) => {
    slack.send({
        text: msg,
    });
}
// ################ SLACK ################

// ################ VARIABLES ################
const L1_RPC_ENDPOINT = env.L1_RPC_URL || "http://127.0.0.1:8545";
const L2_RPC_ENDPOINT = env.L2_RPC_URL || "http://127.0.0.1:3050";

const SLEEP_MS = env.SLEEP_MS|| 10000;

const L1_ADDR = env.L1_ADDR || "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049";

const l1provider = new ethers.providers.JsonRpcProvider(L1_RPC_ENDPOINT);
const l2provider = new Provider(L2_RPC_ENDPOINT);
// ################ VARIABLES ################


// ################ CHECKERS ################
const checkBlock = async () => {
    let prevBlock = await l2provider.getBlockNumber();
    let alive = false
    await Bun.sleep(SLEEP_MS);

    while (true) {
        let block = await l2provider.getBlockNumber();

        // The +1 handles the case in which the 
        // block = n and prevBlock = n-1
        // If using a sleep period of 10[s] the block should be much greater than prevBlock
        // not just a difference of 1 block. Also, some test blockchains create a new block after 
        // l1provider.getBlockNumber();
        if ((block > prevBlock + 1) && !alive) {
            await log("Node is up")
            alive = true
        } else if ((block == prevBlock) && alive) {
            await log(`Not advancing block: ${block} // prevBlock: ${prevBlock}`);
            alive = false
        }

        prevBlock = block
        await Bun.sleep(SLEEP_MS);
    }
}

const checkBalance = async (addr: string) => {
    let THRESHOLD = [0.5, 2, 5, 10];

    let lastBalance = Number(ethers.utils.formatEther(await l1provider.getBalance(addr)));
    while (true) {

        let balance = Number(ethers.utils.formatEther(await l1provider.getBalance(addr)));

        for (let i = 0; i < THRESHOLD.length; i++) {
            if (balance < THRESHOLD[i] && lastBalance >= THRESHOLD[i]) {
                await log(`Balance is less than: ${balance}`);
                break;
            }
            else if (balance >= THRESHOLD[i] && lastBalance < THRESHOLD[i]) {
                await log(`Balance of ${addr} is more than: ${balance}`);
                break;
            }
        }

        lastBalance = balance;

        await Bun.sleep(SLEEP_MS);
    }
}
// ################ CHECKERS ################

async function main() {
    let p1 =  checkBalance(L1_ADDR);

    let p2 = checkBlock();

    await Promise.all([p1, p2]);
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
