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
    sleep_checkBalance_minutes: number;
    sleep_checkBlock_ms: number;
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
const sleep_checkBalance_minutes = CFG.sleep_checkBalance_minutes * 60e3 || 1 * 60e3;
const sleep_checkBlock_ms = CFG.sleep_checkBlock_ms || 10e3;

const explorerUrl = CFG.explorer_url || "explorerUrlPlaceholder";

const l1provider = new ethers.providers.JsonRpcProvider(CFG.rpc_url.l1);
const l2provider = new Provider(CFG.rpc_url.l2);
// ################ VARIABLES ################


// ################ CHECKERS ################
const checkBlock = async () => {
    let prevBlock = 0;
    let alive = false;

    while (true) {
        try {
            await Bun.sleep(sleep_checkBlock_ms);
            const block = await l2provider.getBlockNumber();
            prevBlock = Number(block);
            break;
        } catch (error) {
            console.error(`Error fetching block number`);
        }
    }

    await Bun.sleep(sleep_checkBlock_ms);

    while (true) {
        try {
            await Bun.sleep(sleep_checkBlock_ms);
            let block = await l2provider.getBlockNumber();
            if ((block > prevBlock) && !alive) {
                alive = true;
            } else if ((block == prevBlock) && alive) {
                await log(
                    `Blockchain not advancing\n` +
                    `Currently, it is normal behavior. The blockchain was stopped and now it received some transactions\n` +
                    `Explorer: ${explorerUrl}/block/${block}`);
                alive = false;
            }
            prevBlock = block;

        } catch (error) {
            console.error(`Error fetching block number`);
        }
    }
}

const checkConnection = async () => {
    const retries = 5;
    let alive = false;
    let sendmsg = true;

    while (true) {
        for (let i = 0; i < retries; i++) {
            try {
                await Bun.sleep(2e3);
                (await l2provider.getNetwork()).chainId;
                alive = true;
                sendmsg = true;
                break;
            } catch (e) {
                console.error(`Error fetching chainId`);
            }
        }

        if (!alive && sendmsg) {
            log(
                `Unable to connect after ${retries}\n` +
                `Blockchain seems to be down, URL: ${CFG.rpc_url.l2}`
            );
            sendmsg = false;
        }
    }
};

const checkBalance = async (accounts: Account[]) => {
    let lastBalance: number[] = new Array(accounts.length).fill(0);

    for (let i = 0; i < accounts.length; i++) {
        lastBalance[i] = Number(ethers.utils.formatEther(await l1provider.getBalance(accounts[i].addr)));
    }

    while (true) {
        for (let i = 0; i < accounts.length; i++) {
            lastBalance[i] = await sendBalanceMsg(accounts[i], lastBalance[i]);
        }

        await Bun.sleep(sleep_checkBalance_minutes);
    }
}

const sendBalanceMsg = async (account: Account, lastBalance: number) => {
    let THRESHOLD = [0.5, 2, 5, 10];
    let balance = 0;

    await l1provider.getBalance(account.addr)
        .then((b) => {
            balance = Number(ethers.utils.formatEther(b));
        })
        .catch((e) => {
            console.error(`Error fetching  balance from L1 \n${e}`);
            return
        });

    console.log(`Balance of ${account.addr}: ${balance}`);
    for (let i = 0; i < THRESHOLD.length; i++) {
        if (balance < THRESHOLD[i] && lastBalance >= THRESHOLD[i]) {
            await log(
                `${account.addr} (${account.descr})\n` +
                `Balance decreased: ${balance}\n` +
                `Explorer: ${explorerUrl}/address/${account.addr}`);
            break;
        }
        else if (balance >= THRESHOLD[i] && lastBalance < THRESHOLD[i]) {
            await log(
                `${account.addr} (${account.descr})\n` +
                `Balance increased: ${balance}\n` +
                `Explorer: ${explorerUrl}/address/${account.addr}`);
            break;
        }
    }
    return balance
}
// ################ CHECKERS ################

async function main() {
    //await log(`The monitor service is up and running, monitoring: ${CFG.rpc_url.l2}`)

    let p1 = checkBalance(CFG.accounts);

    let p2 = checkBlock();

    let p3 = checkConnection();

    await Promise.all([p1, p2, p3]);
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
