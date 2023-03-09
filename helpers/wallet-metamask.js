import { ethers } from "ethers";
import { chainConfig } from "../constants";

const hexToInt = (s) => {
  const bn = ethers.BigNumber.from(s);
  return parseInt(bn.toString());
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const switchNetwork = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainConfig.chainId }],
    });
  } catch (e) {
    console.log(e);
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainConfig.chainId,
          chainName: chainConfig.chainName,
          rpcUrls: chainConfig.rpcUrls,
          nativeCurrency: chainConfig.nativeCurrency,
          blockExplorerUrls: chainConfig.blockExplorerUrls,
        },
      ],
    });
  }
};

export const connect = async () => {
  try {
    let chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (!(chainId === chainConfig.chainId)) {
      await switchNetwork();
      await delay(2000);
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // window.ethereum.on("chainChanged", utils.reloadApp);
    // window.ethereum.on("accountsChanged", utils.reloadApp);
    // window.ethereum.on("disconnect", utils.reloadApp);

    return {
      walletProviderName: "metamask",
      address: accounts[0],
      browserWeb3Provider: new ethers.providers.Web3Provider(window.ethereum),
      serverWeb3Provider: new ethers.providers.JsonRpcProvider(
        chainConfig.rpcUrls[0]
      ),
      connected: true,
      chainId: hexToInt(
        await window.ethereum.request({ method: "eth_chainId" })
      ),
    };
  } catch (e) {
    console.log("error:", e);
    return null;
  }
};
