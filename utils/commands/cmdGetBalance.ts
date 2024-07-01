import { ethers } from 'ethers';
import { getProvider } from "./common";

export async function getBalance(addr: string, zk: boolean, l1url: string, l2url: string, mainnet: boolean) {
    const address = addr || prompt("Insert Address:");

    if (!ethers.utils.isAddress(address!)) {
        console.log("Wrong address format");
        return;
    }

    try {
        const provider = await getProvider(zk, mainnet, l1url, l2url);
        console.log("#####################################################");
        console.log(`Balance: ${ethers.utils.formatEther(await provider.getBalance(address!))}`);;
        console.log("#####################################################");
    } catch {
        console.error("Couldn't reach Node");
    }
}
