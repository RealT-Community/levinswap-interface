'use client';

import { AvailableConnectors } from '@realtoken/realt-commons';
import { BalanceProvider } from './types';
import { MetaMaskBalanceProvider } from './metamask';
import { WalletConnectBalanceProvider } from './walletconnect';

export class BalanceProviderFactory {
  private static providers: Map<AvailableConnectors, BalanceProvider> = new Map([
    [AvailableConnectors.metamask, new MetaMaskBalanceProvider()],
    [AvailableConnectors.walletConnectV2, new WalletConnectBalanceProvider()],
  ]);

  static getProvider(type: AvailableConnectors): BalanceProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`No balance provider found for wallet type: ${type}`);
    }
    return provider;
  }
}
