"use client";

import { BalanceProviderFactory } from "@/services/balance";
import { ChainsID } from "@realtoken/realt-commons";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useWeb3 } from "./useWeb3";

export const useNativeBalance = () => {
  const { provider, account, chainId, walletType } = useWeb3();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (!account || !provider || !walletType) {
      setBalance("0");
      return;
    }

    const ethersProvider = new ethers.providers.Web3Provider(provider.provider);
    const balanceProvider = BalanceProviderFactory.getProvider(walletType);

    const fetchBalance = async () => {
      try {
        const newBalance = await balanceProvider.getBalance(account, ethersProvider);
        setBalance(newBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0");
      }
    };

    fetchBalance();

    const cleanup = balanceProvider.subscribeToBalanceChanges(
      account,
      fetchBalance
    );

    return cleanup;
  }, [account, chainId, provider, walletType]);

  const getSymbol = (chainId?: number) => {
    switch (chainId) {
      case ChainsID.Gnosis:
        return "xDAI";
      case ChainsID.Ethereum:
        return "ETH";
      default:
        return "ETH";
    }
  };

  return {
    balance,
    symbol: getSymbol(chainId ?? undefined),
    formattedBalance: balance ? parseFloat(balance).toFixed(4) : "0",
  };
};
