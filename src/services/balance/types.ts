'use client';

import { ethers } from 'ethers';

export interface BalanceProvider {
  getBalance(account: string, provider: ethers.providers.Web3Provider): Promise<string>;
  subscribeToBalanceChanges(
    account: string,
    onBalanceChange: () => void
  ): () => void;
}
