import * as ethers from "ethers";
import { Wallet, Provider, types } from "zksync-ethers";

export async function getProvider(zk: boolean, mainnet: boolean, l1url: string, l2url: string) {
    let provider;
    if (zk) {
        const net = mainnet ? types.Network.Mainnet : types.Network.Sepolia;
        provider = l2url ? new Provider(l2url) : Provider.getDefaultProvider(net);
    }
    else {
        const net = mainnet ? "mainnet" : "sepolia";
        provider = l1url ? new ethers.providers.JsonRpcProvider(l1url) : ethers.providers.getDefaultProvider(net);
    }

    console.log(`Network Name: ${(await provider.getNetwork()).name}`)
    console.log(`Network ChainID: ${(await provider.getNetwork()).chainId}`)
    return provider;
}

export async function getProviders(mainnet: boolean, l1url: string, l2url: string) {
    const netL2 = mainnet ? types.Network.Mainnet : types.Network.Sepolia;
    const l2provider = l2url ? new Provider(l2url) : Provider.getDefaultProvider(netL2);

    const netL1 = mainnet ? "mainnet" : "sepolia";
    const l1provider = l1url ? new ethers.providers.JsonRpcProvider(l1url) : ethers.providers.getDefaultProvider(netL1);

    return { l1provider, l2provider };
}
