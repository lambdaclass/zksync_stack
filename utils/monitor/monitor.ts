import { IncomingWebhook } from "@slack/webhook";
import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";
import { parseArgs } from "util";

const values = parseArgs({
    args: Bun.argv,
    options: {
        configFile: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
}).values;


// ################ CONFIG ################
let configFile = values.configFile || "./config.json"
const config = require(configFile);
interface Account {
    addr: string;
    descr?: string;
}

interface Config {
    slack_webhook_url: string;
    explorer_url?: string;
    rpc_url: {
        l1: string;
        l2: string;
    };
    accounts: Account[];
    sleep_minutes: number;
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
const sleep_ms = CFG.sleep_minutes * 60e3 || 1 * 60e3;
console.log(sleep_ms);
const explorerUrl = CFG.explorer_url || "explorerUrlPlaceholder";

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

    await Bun.sleep(sleep_ms);

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
        await Bun.sleep(sleep_ms);
    }
}

const checkBalance = async (accounts: Account[]) => {

    let lastBalance: number[] = new Array(accounts.length).fill(0);
    console.log(accounts.length);


    for (let i = 0; i < accounts.length; i++) {
        lastBalance[i] = Number(ethers.utils.formatEther(await l1provider.getBalance(accounts[i].addr)));
    }

    while (true) {
        console.log(lastBalance);
        for (let i = 0; i < accounts.length; i++) {
            lastBalance[i] = await sendBalanceMsg(accounts[i], lastBalance[i]);
        }

        await Bun.sleep(sleep_ms);
    }
}

const sendBalanceMsg = async (account: Account, lastBalance: number) => {
    let THRESHOLD = [0.5, 2, 5, 10];
    let balance = Number(ethers.utils.formatEther(await l1provider.getBalance(account.addr)));
    for (let i = 0; i < THRESHOLD.length; i++) {
        if (balance < THRESHOLD[i] && lastBalance >= THRESHOLD[i]) {
            await log(`${account.addr} (${account.descr}) \nBalance decreased: ${balance} \nExplorer: ${explorerUrl}/address/${account.addr}`);
            break;
        }
        else if (balance >= THRESHOLD[i] && lastBalance < THRESHOLD[i]) {
            await log(`${account.addr} (${account.descr}) \nBalance increased: ${balance} \nExplorer: ${explorerUrl}/address/${account.addr}`);
            break;
        }
    }
    return balance
}
// ################ CHECKERS ################

async function main() {
    //await log(`The monitor service is up and running, monitoring: ${CFG.rpc_url.l2}`)

    let p1 = checkBalance(CFG.accounts);

    //let p2 = checkBlock();

    await Promise.all([p1]);
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
