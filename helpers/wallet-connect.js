import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { chainConfig } from "../constants";

export const connect = async () => {
  try {
    localStorage.clear();
    const provider = new WalletConnectProvider({
      rpc: {
        [chainConfig.chainId]: chainConfig.rpcUrls[0],
      },
      chainId: chainConfig.chainId,
    });
    await provider.enable();
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    if (Number(provider.chainId) !== Number(chainConfig.chainId)) {
      window.alert(
        "Switch your Wallet to blockchain network " + chainConfig.chainName
      );
      return null;
    }
    // provider.on("accountsChanged", utils.reloadApp);
    // provider.on("chainChanged", utils.reloadApp);
    // provider.on("disconnect", utils.reloadApp);
    return {
      walletProviderName: "walletconnect",
      address: (await ethersProvider.listAccounts())[0],
      browserWeb3Provider: ethersProvider,
      serverWeb3Provider: new ethers.providers.JsonRpcProvider(
        chainConfig.rpcUrls[0]
      ),
      wcProvider: provider,
      connected: true,
      chainId: provider.chainId,
    };
  } catch (e) {
    return null;
  }
};
