"use client";

import { formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { BalanceProvider } from "./types";

export class MetaMaskBalanceProvider implements BalanceProvider {
  async getBalance(
    account: string,
    provider: ethers.providers.Web3Provider
  ): Promise<string> {
    try {
      if (!account || !provider) {
        return "0";
      }

      const balance = await provider.getBalance(account);
      return formatEther(balance);
    } catch (error) {
      console.error("MetaMask getBalance error:", error);
      return "0";
    }
  }

  subscribeToBalanceChanges(
    account: string,
    onBalanceChange: () => void
  ): () => void {
    if (typeof window === "undefined" || !window.ethereum) {
      return () => {};
    }

    try {
      window.ethereum.on("accountsChanged", onBalanceChange);
      window.ethereum.on("chainChanged", onBalanceChange);

      return () => {
        window.ethereum.removeListener("accountsChanged", onBalanceChange);
        window.ethereum.removeListener("chainChanged", onBalanceChange);
      };
    } catch (error) {
      console.error("Error in MetaMask subscription:", error);
      return () => {};
    }
  }
}
