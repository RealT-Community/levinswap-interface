"use client";

import { ethers } from "ethers";
import { formatEther } from "@ethersproject/units";
import { BalanceProvider } from "./types";

export class WalletConnectBalanceProvider implements BalanceProvider {
  async getBalance(
    account: string,
    provider: ethers.providers.Web3Provider
  ): Promise<string> {
    if (!account || !provider) return "0";

    try {
      const balance = await provider.getBalance(account);
      return formatEther(balance);
    } catch (error) {
      console.error("WalletConnect getBalance error:", error);
      return "0";
    }
  }

  subscribeToBalanceChanges(
    account: string,
    onBalanceChange: () => void
  ): () => void {
    try {
      return () => {};
    } catch (error) {
      console.error("Error in WalletConnect subscription:", error);
      return () => {};
    }
  }
}
