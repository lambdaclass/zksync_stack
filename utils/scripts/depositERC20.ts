import { Wallet, Provider, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { env } from "process";
import { parseArgs } from "util";

const { values, _positionals } = parseArgs({
    args: Bun.argv,
    options: {
        amount_to_bridge: {
            type: 'string',
        },
        l1_pk: {
            type: 'string',
        },
        erc20_l1: {
            type: 'string',
        },
        erc20_l2: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});


// HTTP RPC endpoints
const L1_RPC_ENDPOINT = env.L1_RPC_URL;
const L2_RPC_ENDPOINT = env.L2_RPC_URL;

const L1_RICH_PK = values.l1_pk || env.L1_RICH_PK;

const L1_RICH = {
    addr: ethers.utils.computeAddress(L1_RICH_PK),
    pk: env.L1_RICH_PK,
};

const AMOUNT_ERC20 = values.amount_to_bridge || env.AMOUNT_ERC20 || "1";
const ERC20_ADDRESS_L1 = values.erc20_l1 || env.ERC20_ADDRESS_L1 || "0x0000000000000000000000000000000000000000";
const ERC20_ADDRESS_L2 = values.erc20_l2 || env.ERC20_ADDRESS_L2 || "0x0000000000000000000000000000000000000000";


async function main() {
    // Initialize the wallet.
    const l1provider = new ethers.providers.JsonRpcProvider(L1_RPC_ENDPOINT)
    const l2provider = new Provider(L2_RPC_ENDPOINT);
    const wallet = new Wallet(L1_RICH.pk!, l2provider, l1provider);

    const ERC20balanceABI = [
        // balanceOf
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "balance", type: "uint256" }],
            type: "function",
        },
        // symbol
        {
            constant: true,
            inputs: [],
            name: "symbol",
            outputs: [{ "name": "", "type": "string" }],
            payable: false,
            stateMutability: "view",
            type: "function"
        },
        // decimals
        {
            constant: true,
            inputs: [],
            name: "decimals",
            outputs: [{ "name": "", "type": "uint8" }],
            payable: false,
            stateMutability: "view",
            type: "function"
        },
    ];

    const ERC20_L1 = new ethers.Contract(ERC20_ADDRESS_L1, ERC20balanceABI, l1provider);

    const ERC20_SYMBOL = await ERC20_L1.symbol();
    const ERC20_DECIMALS_MUL = Math.pow(10, Number(await ERC20_L1.decimals()));

    console.log(`Running script to deposit ${ERC20_SYMBOL} in L2`);

    let ERC20balanceL1: number = 0;
    await ERC20_L1.balanceOf(await wallet.getAddress())
        .then((balance: number) => {
            ERC20balanceL1 = balance;
        })
        .catch(() => {
            console.error("Error fetching ERC20 balance from L1");
            ERC20balanceL1 = 0;
        });


    const ERC20_L2 = new ethers.Contract(ERC20_ADDRESS_L2, ERC20balanceABI, l2provider);
    let ERC20balanceL2: number = 0;
    await ERC20_L2.balanceOf(await wallet.getAddress())
        .then((balance: number) => {
            ERC20balanceL2 = balance;
        })
        .catch(() => {
            console.error("Error fetching ERC20 balance from L2");
            ERC20balanceL2 = 0;
        });

    console.log(`L1 Endpoint: ${L1_RPC_ENDPOINT}`)
    console.log(`L2 Endpoint: ${L2_RPC_ENDPOINT}`)
    console.log("#####################################################\n")
    console.log(`L1 balance before deposit: ${ERC20balanceL1 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
    console.log(`L2 balance before deposit: ${ERC20balanceL2 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
    console.log("\n#####################################################\n")

    await wallet.deposit({
        token: ERC20_ADDRESS_L1,
        amount: ethers.utils.parseEther(AMOUNT_ERC20), // assumes ERC-20 has 18 decimals
        // performs the ERC-20 approve action
        approveERC20: true,
    }).then(async tx => {
        const receipt = await tx.wait();
        console.log(`L2 Tx hash: ${receipt.transactionHash}`)
    }).catch(() => {
        console.error("Error deposiitng ERC20 in L2");
        ERC20balanceL1 = 0;
    });


    await ERC20_L1.balanceOf(await wallet.getAddress())
        .then(balance => {
            ERC20balanceL1 = balance;
        })
        .catch(() => {
            console.error("Error fetching ERC20 balance from L1");
            ERC20balanceL1 = 0;
        });
    await ERC20_L2.balanceOf(await wallet.getAddress())
        .then(balance => {
            ERC20balanceL2 = balance;
        })
        .catch(() => {
            console.error("Error fetching ERC20 balance from L2");
            ERC20balanceL2 = 0;
        });
    console.log("\n#####################################################\n");
    console.log(`L1 balance after deposit: ${ERC20balanceL1 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
    console.log(`L2 balance after deposit: ${ERC20balanceL2 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
    console.log("\n#####################################################");
}

main()
    .then()
    .catch((error) => {
        console.error(error);
        env.exitCode = "1";
    });
