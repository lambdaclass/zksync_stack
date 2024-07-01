import { cac } from "cac";
import { cmd } from "./commands";
import { ethers } from "ethers";

async function main() {
    const cli = cac();
    cli.command("balance [addr]", "\n\t└>Get Balance. If addr is not provided, the cli will ask for it")
        .option("--l1url <l1url>", "ETH chain URL")
        .option("-m, --mainnet", "Mainnet if set, else Sepolia. l1url will be prioritized if set")
        .option("-z, --zk", "Interact with ZKstack chain")
        .option("--l2url <l2url>", "ZKstack chain URL. If not set, it will use ZKsyncEra Mainnet or Sepolia depending on the -m flag")
        .example("balance --l1url https://ethereum-sepolia-rpc.publicnode.com")
        .example("balance --l1url https://eth.llamarpc.com")
        .example("balance --l2url <zkstack_url> -z")
        .action(
            async (addr, options) => {
                await cmd.balance.getBalance(addr, options.zk, options.l1url, options.l2url, options.mainnet)
            }
        );

    cli.command("send", "\n\t└>Send Balance, the cli will ask for sender and receiver")
        .option("-a, --amount <amount>", "Amount to Send")
        .option("--l1url <l1url>", "ETH chain URL")
        .option("-m, --mainnet", "Mainnet if set, else Sepolia. l1url will be prioritized if set")
        .option("-z, --zk", "Interact with ZKstack chain")
        .option("--l2url <l2url>", "ZKstack chain URL. If not set, it will use ZKsyncEra Mainnet or Sepolia depending on the -m flag")
        .example("send --l1url https://ethereum-sepolia-rpc.publicnode.com -a 0.001")
        .example("send --l2url <zkstack_url> -z -a 0.1")
        .action(
            async (options) => {
                const fromPk: string = String(prompt("Insert (from) PrivKey:"));
                try {
                    const fromAddr = ethers.utils.computeAddress(fromPk);
                    if (!ethers.utils.isAddress(fromAddr)) {
                        return;
                    }
                } catch {
                    console.error("Wrong Private Key Format.")
                }

                const toAddr: string = String(prompt("Insert   (to) Address:"));
                try {
                    if (!ethers.utils.isAddress(toAddr)) {
                        return;
                    }
                } catch {
                    console.error("Wrong Private Key Format.")
                    return;
                }
                await cmd.balance.sendBalance(fromPk, toAddr, options.amount, options.zk, options.l1url, options.l2url, options.mainnet)
            }
        )
    cli.command("deposit", "\n\t└>Deposit Balance (BaseToken or ERC20), the cli will ask for the PrivateKey.\n\t  The deposit works as a bridge, it transfer funds from the L1 to the ZKstack chain")
        .option("-a, --amount <amount>", "Amount to Send")
        .option("-e, --erc20", "ERC20 flag, if set the cli will ask for the ERC20 Contract Address")
        .option("--l1url <l1url>", "ETH chain URL")
        .option("-m, --mainnet", "Mainnet if set, else Sepolia. l1url will be prioritized if set")
        .option("--l2url <l2url>", "ZKstack chain URL. If not set, it will use ZKsyncEra Mainnet or Sepolia depending on the -m flag")
        .example("deposit --l1url https://ethereum-sepolia-rpc.publicnode.com --l2url <zkstack_url> -a 0.1")
        .action(
            async (options) => {
                const fromPk: string = String(prompt("Insert PrivKey:"));
                try {
                    const fromAddr = ethers.utils.computeAddress(fromPk);
                    if (!ethers.utils.isAddress(fromAddr)) {
                        return;
                    }
                } catch {
                    console.error("Wrong Private Key Format.")
                    return;
                }
                await cmd.balance.depositBalance(options.erc20, fromPk, options.amount, options.l1url, options.l2url, options.mainnet)
            }
        )
    cli.help();
    cli.parse();
}


main()
    .then()
    .catch((error) => {
        console.error(error);
        process.env.exitCode = "1";
    });

