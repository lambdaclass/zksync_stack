import * as ethers from "ethers";
import { Wallet } from "zksync-ethers";
import { getProviders } from "./common";

export async function sendBalance(from: string, toAddr: string, amountToSend: string, zk: boolean, l1url: string, l2url: string, mainnet: boolean) {
    const { l1provider, l2provider } = await getProviders(mainnet, l1url, l2url);

    const amount = String(amountToSend || prompt("Amount to Send:"));

    if (!zk) {
        const ethersWallet = new ethers.Wallet(from, l1provider);
        const fromAddr = ethers.utils.computeAddress(from);
        console.log("#####################################################")
        console.log(`L1 Network Name: ${(await l1provider.getNetwork()).name}`);
        console.log(`L1 Network ChainID: ${(await l1provider.getNetwork()).chainId}`);
        console.log(`(from) balance before deposit: ${ethers.utils.formatEther(await l1provider.getBalance(fromAddr))}`);
        console.log(`  (to) balance before deposit: ${ethers.utils.formatEther(await l1provider.getBalance(toAddr))}`);
        console.log(`Send ${amount}${ethers.constants.EtherSymbol}`);
        console.log(`(from): ${fromAddr}`);
        console.log(`  (to): ${toAddr}`);
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
        await ethersWallet.sendTransaction({
            to: toAddr,
            value: ethers.utils.parseEther(amount!),
        }).then(async tx => {
            const receipt = await tx.wait();
            console.log(`Tx hash: ${receipt.transactionHash}`);
        }).catch((e) => {
            console.error(`Error Sending Tx: \n${e}`);
        });
        console.log("#####################################################");
        console.log(`(from) balance before deposit: ${ethers.utils.formatEther(await l1provider.getBalance(ethers.utils.computeAddress(from)))}`);
        console.log(`  (to) balance before deposit: ${ethers.utils.formatEther(await l1provider.getBalance(toAddr))}`);
        console.log("#####################################################");
    }
    else {
        const wallet = new Wallet(from, l2provider, l1provider);
        const fromAddr = ethers.utils.computeAddress(from);
        console.log("#####################################################");
        console.log(`ZK Network URL: ${l2url}`);
        console.log(`ZK Network ChainID: ${(await l2provider.getNetwork()).chainId}`);
        console.log(`(from) balance before deposit: ${ethers.utils.formatEther(await l2provider.getBalance(fromAddr))}`);
        console.log(`  (to) balance before deposit: ${ethers.utils.formatEther(await l2provider.getBalance(toAddr))}`);
        console.log(`Send ${amount}${ethers.constants.EtherSymbol}`);
        console.log(`(from): ${fromAddr}`);
        console.log(`  (to): ${toAddr}`);
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
        await wallet.sendTransaction({
            to: toAddr,
            value: ethers.utils.parseEther(amount!),
        }).then(async tx => {
            const receipt = await tx.wait();
            console.log(`Tx hash: ${receipt.transactionHash}`)
        }).catch((e) => {
            console.error(`Error Sending Tx: \n${e}`);
        });
        console.log("#####################################################");
        console.log(`(from) balance before deposit: ${ethers.utils.formatEther(await l2provider.getBalance(ethers.utils.computeAddress(from)))}`);
        console.log(`  (to) balance before deposit: ${ethers.utils.formatEther(await l2provider.getBalance(toAddr))}`);
        console.log("#####################################################");
    }
}
