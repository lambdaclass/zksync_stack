import { IncomingWebhook } from "@slack/webhook";
import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";

// ################ CONFIG ################
import config from "./config.json";
interface Account {
    addr: string;
    descr?: string;
}

interface Config {
    slack_webhook_url: string;
    rpc_url: {
        l1: string;
        l2: string;
    };
    accounts: Account[];
    sleep_ms: number;
}

const CFG = config as Config;
// ################ CONFIG ################

// ################ SLACK ################
const slack = new IncomingWebhook(CFG.slack_webhook_url);

const log = async (msg: string) => {
    slack.send({
        text: msg,
    });
}
// ################ SLACK ################

// ################ VARIABLES ################
const SLEEP_MS = CFG.sleep_ms;

const l1provider = new ethers.providers.JsonRpcProvider(CFG.rpc_url.l1);
const l2provider = new Provider(CFG.rpc_url.l2);
// ################ VARIABLES ################


// ################ CHECKERS ################
const checkBlock = async () => {
    let prevBlock = 0
    let alive = false

    while (true) {
        try {
            const block = await l2provider.getBlockNumber();
            prevBlock = Number(block);
            break;
        } catch (error) {
            console.error(`Error fetching block number`);
        }
    }

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
            await log(`Not advancing; block: ${block} // prevBlock: ${prevBlock}`);
            alive = false
        }

        prevBlock = block
        await Bun.sleep(SLEEP_MS);
    }
}

const checkBalance = async (accounts: Account[]) => {

    let lastBalance = Number[accounts.length];

    for (let i = 0; i < accounts.length; i++) {
        lastBalance[i] = Number(ethers.utils.formatEther(await l1provider.getBalance(accounts[i].addr)));
    }

    while (true) {

        for (let i = 0; i < accounts.length; i++) {
            lastBalance[i] = sendBalanceMsg(accounts[i], lastBalance[i]);
        }

        await Bun.sleep(SLEEP_MS);
    }
}

const sendBalanceMsg = async (account: Account, lastBalance: number) => {
    let THRESHOLD = [0.5, 2, 5, 10];
    let balance = Number(ethers.utils.formatEther(await l1provider.getBalance(account.addr)));
    for (let i = 0; i < THRESHOLD.length; i++) {
        if (balance < THRESHOLD[i] && lastBalance >= THRESHOLD[i]) {
            await log(`${account.addr} (${account.descr}) \nBalance decreased: ${balance} \nExplorer: https://explorer.sepolia.shyft.lambdaclass.com/address/${account.addr}`);
            break;
        }
        else if (balance >= THRESHOLD[i] && lastBalance < THRESHOLD[i]) {
            await log(`${account.addr} (${account.descr}) \nBalance increased: ${balance} \nExplorer: https://explorer.sepolia.shyft.lambdaclass.com/address/${account.addr}`);
            break;
        }
    }
    return balance
}
// ################ CHECKERS ################

async function main() {
    await log(`The monitor service is up and running, monitoring: ${CFG.rpc_url.l2}`)

    let p1 = checkBalance(CFG.accounts);

    let p2 = checkBlock();

    await Promise.all([p1, p2]);
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
