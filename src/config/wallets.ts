import { AvailableConnectors } from '@realtoken/realt-commons';

interface WalletConfig {
  icon: string;
  name: string;
}

type WalletConfigs = {
  [key in AvailableConnectors]: WalletConfig;
};

export const WALLET_CONFIGS: WalletConfigs = {
  [AvailableConnectors.metamask]: {
    icon: '/images/wallets/metamask.svg',
    name: 'MetaMask',
  },
  [AvailableConnectors.walletConnectV2]: {
    icon: '/images/wallets/walletconnect.svg',
    name: 'WalletConnect',
  },
  [AvailableConnectors.gnosisSafe]: {
    icon: '/images/wallets/gnosis-safe.svg',
    name: 'Gnosis Safe',
  },
  [AvailableConnectors.readOnly]: {
    icon: '/images/wallets/readonly.svg',
    name: 'Read Only',
  },
} as const;

// Génère dynamiquement les objets WALLET_ICONS et WALLET_NAMES
export const WALLET_ICONS = Object.fromEntries(
  Object.entries(WALLET_CONFIGS).map(([key, config]) => [key, config.icon])
) as Record<AvailableConnectors, string>;

export const WALLET_NAMES = Object.fromEntries(
  Object.entries(WALLET_CONFIGS).map(([key, config]) => [key, config.name])
) as Record<AvailableConnectors, string>;
