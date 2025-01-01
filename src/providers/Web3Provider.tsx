"use client";

import { useWeb3Store } from "@/hooks/useWeb3Store";
import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";
import {
  AvailableConnectors,
  CHAINS,
  ChainsID,
  environment,
  getConnectors,
  getWalletConnectV2,
  metaMask,
  metaMaskHooks,
  parseAllowedChain,
  RealtProvider,
  Web3Providers,
} from "@realtoken/realt-commons";
import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { FC, PropsWithChildren, useEffect } from "react";

const env =
  process.env.NODE_ENV === "production"
    ? environment.PRODUCTION
    : environment.DEVELOPMENT;
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Configuration des chaînes autorisées
const customChains = {
  allowedChains: parseAllowedChain([ChainsID.Gnosis]),
  chainsConfig: {
    ...CHAINS,
    [ChainsID.Gnosis]: {
      ...CHAINS[ChainsID.Gnosis],
      rpcUrl: "https://rpc.gnosischain.com",
      blockExplorerUrl: "https://gnosisscan.io",
      isTestnet: false,
    },
  },
  defaultChainId: ChainsID.Gnosis,
};

const showAllNetworks = true;

// Configuration de WalletConnect avec les bonnes options
const [walletConnectV2, walletConnectV2Hooks] = getWalletConnectV2(
  customChains,
  env,
  walletConnectProjectId,
  showAllNetworks
);

// Configuration des connecteurs disponibles (sans Safe)
const libraryConnectors = getConnectors({
  metamask: [metaMask, metaMaskHooks],
  walletConnectV2: [walletConnectV2, walletConnectV2Hooks],
});

const Web3ProviderInner: FC<PropsWithChildren> = ({ children }) => {
  const { setConnectors, setWalletType } = useWeb3Store();
  const { account, provider, chainId, isActive, connector } =
    useWeb3React<EthersWeb3Provider>();
  const { setAccount, setProvider, setChainId, setIsActive } = useWeb3Store();

  // Initialiser les connecteurs dès que possible
  useEffect(() => {
    if (libraryConnectors.connectorsMap) {
      setConnectors(libraryConnectors.connectorsMap);
    }
  }, [setConnectors]);

  // Détecter le type de wallet
  useEffect(() => {
    if (connector && isActive) {
      const metamaskConnector = libraryConnectors.connectorsMap.get(
        AvailableConnectors.metamask
      )?.connector;
      const walletConnectConnector = libraryConnectors.connectorsMap.get(
        AvailableConnectors.walletConnectV2
      )?.connector;

      if (connector === metamaskConnector) {
        setWalletType(AvailableConnectors.metamask);
      } else if (connector === walletConnectConnector) {
        setWalletType(AvailableConnectors.walletConnectV2);
      }
    }
  }, [connector, isActive, setWalletType]);

  // Mettre à jour l'état du store quand le wallet change
  useEffect(() => {
    setAccount(account);
    setProvider(provider);
    setChainId(chainId);
    setIsActive(isActive);
  }, [
    account,
    provider,
    chainId,
    isActive,
    setAccount,
    setProvider,
    setChainId,
    setIsActive,
  ]);

  return (
    <RealtProvider
      value={{
        env,
        showAllNetworks: true,
        disabledWrongNetworkBanner: false,
      }}
    >
      <Web3Providers libraryConnectors={libraryConnectors}>
        {children}
      </Web3Providers>
    </RealtProvider>
  );
};

const Web3Provider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Web3ReactProvider connectors={libraryConnectors.connectors}>
      <Web3ProviderInner>{children}</Web3ProviderInner>
    </Web3ReactProvider>
  );
};

export default Web3Provider;
