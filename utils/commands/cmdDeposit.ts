import * as ethers from "ethers";
import { Wallet, utils } from "zksync-ethers";
import { getProviders } from "./common";

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

export async function depositBalance(erc20: boolean, from: string, amountToSend: string, l1url: string, l2url: string, mainnet: boolean) {
    const { l1provider, l2provider } = await getProviders(mainnet, l1url, l2url);
    const wallet = new Wallet(from, l2provider, l1provider);
    const amount = String(amountToSend || prompt("Amount to Send:"));

    let ERC20_L1;
    let ERC20_SYMBOL;
    let ERC20_DECIMALS_MUL;
    let erc20Addr;
    if (erc20) {
        try {
            erc20Addr = String(prompt("ERC20 Contract Address"));
            if (!ethers.utils.isAddress(erc20Addr)) {
                return;
            }
        } catch {
            console.error("Wrong ERC20 Contract Address Format");
            return;
        }
        ERC20_L1 = new ethers.Contract(erc20Addr, ERC20balanceABI, l1provider);
        ERC20_SYMBOL = await ERC20_L1.symbol();
        ERC20_DECIMALS_MUL = Math.pow(10, Number(await ERC20_L1.decimals()));
        console.log(`ERC20 Symbol: ${ERC20_SYMBOL}`);
        let ERC20balanceL1: number = 0;
        await ERC20_L1.balanceOf(await wallet.getAddress())
            .then((balance: number) => {
                ERC20balanceL1 = balance;
            })
            .catch(() => {
                console.error("Error fetching ERC20 balance from L1");
                ERC20balanceL1 = 0;
            });

        const fromAddr = ethers.utils.computeAddress(from);
        console.log("#####################################################");
        console.log(`ZK Network URL: ${l2url}`);
        console.log(`ZK Network ChainID: ${(await l2provider.getNetwork()).chainId}`);
        console.log(`L1 balance before deposit: ${ERC20balanceL1 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
        console.log(`Bridge ${amount}${ERC20_SYMBOL}`);
        console.log(`(from): ${fromAddr}`);
        try {
            const confirm = String(prompt("Confirm? [y or yes]"));
            if (!((confirm.toLowerCase() == "y") || (confirm.toLowerCase() == "yes"))) {
                console.log("Aborting...");
                return;
            }
        } catch {
            return;
        }
        console.log("#####################################################");
        await wallet.deposit({
            token: erc20Addr,
            amount: ethers.utils.parseEther(amount), // assumes ERC-20 has 18 decimals
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
            .then((balance: number) => {
                ERC20balanceL1 = balance;
            })
            .catch(() => {
                console.error("Error fetching ERC20 balance from L1");
                ERC20balanceL1 = 0;
            });
        console.log(`L1 balance after deposit: ${ERC20balanceL1 / ERC20_DECIMALS_MUL} ${ERC20_SYMBOL}`);
        console.log("#####################################################");
    } else {
        const fromAddr = ethers.utils.computeAddress(from);
        console.log("#####################################################");
        console.log(`ZK Network URL: ${l2url}`);
        console.log(`ZK Network ChainID: ${(await l2provider.getNetwork()).chainId}`);
        console.log(`L1 balance after deposit: ${ethers.utils.formatEther(await wallet.getBalanceL1())}`);
        console.log(`L2 balance after deposit: ${ethers.utils.formatEther(await wallet.getBalance())}`);
        console.log(`Bridge ${amount}${ethers.constants.EtherSymbol}`);
        console.log(`(from): ${fromAddr}`);
        try {
            const confirm = String(prompt("Confirm? [y or yes]"));
            if (!((confirm.toLowerCase() == "y") || (confirm.toLowerCase() == "yes"))) {
                console.log("Aborting...");
                return;
            }
        } catch {
            return;
        }
        console.log("#####################################################");
        await wallet.deposit({
            token: utils.ETH_ADDRESS,
            amount: ethers.utils.parseEther(amount),
            approveERC20: true,
        }).then(async tx => {
            const receipt = await tx.wait();
            console.log(`L2 Tx hash: ${receipt.transactionHash}`)
        }).catch(() => {
            console.error("Error deposiitng ETH in L2");
        });
        console.log(`L1 balance after deposit: ${ethers.utils.formatEther(await wallet.getBalanceL1())}`);
        console.log(`L2 balance after deposit: ${ethers.utils.formatEther(await wallet.getBalance())}`);
        console.log("#####################################################");
    }
}
