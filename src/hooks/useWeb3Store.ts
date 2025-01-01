"use client";

import { Web3Provider } from "@ethersproject/providers";
import { AvailableConnectors, ConnectorsMap } from "@realtoken/realt-commons";
import { StateCreator, create } from "zustand";
import { devtools } from "zustand/middleware";

interface Web3State {
  account: string | undefined;
  provider: Web3Provider | undefined;
  chainId: number | undefined;
  isActive: boolean;
  error: Error | undefined;
  connectorsMap: ConnectorsMap | null;
  walletType: AvailableConnectors | undefined;
  setConnectors: (connectorsMap: ConnectorsMap) => void;
  setAccount: (account: string | undefined) => void;
  setProvider: (provider: Web3Provider | undefined) => void;
  setChainId: (chainId: number | undefined) => void;
  setIsActive: (isActive: boolean) => void;
  setError: (error: Error | undefined) => void;
  setWalletType: (type: AvailableConnectors | undefined) => void;
}

type Web3Store = StateCreator<
  Web3State,
  [["zustand/devtools", never]],
  [],
  Web3State
>;

const createWeb3Store: Web3Store = (set) => ({
  account: undefined,
  provider: undefined,
  chainId: undefined,
  isActive: false,
  error: undefined,
  connectorsMap: null,
  walletType: undefined,
  setConnectors: (connectorsMap) => set({ connectorsMap }),
  setAccount: (account) => set({ account }),
  setProvider: (provider) => set({ provider }),
  setChainId: (chainId) => set({ chainId }),
  setIsActive: (isActive) => set({ isActive }),
  setError: (error) => set({ error }),
  setWalletType: (walletType) => set({ walletType }),
});

export const useWeb3Store = create<Web3State>()(
  devtools(createWeb3Store, {
    name: "web3-store",
  })
);
