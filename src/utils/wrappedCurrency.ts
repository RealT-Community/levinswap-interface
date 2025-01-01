import { Currency, Token, WETH } from '@levinswap/uniswap-sdk';
import { WXDAI } from '@/constants';

export function wrappedCurrency(currency: Currency | undefined, chainId: number | undefined): Token | undefined {
  if (!chainId || !currency) return undefined;

  if (currency instanceof Token) return currency;
  if (currency === Currency.ETHER) {
    if (chainId === 100) { // Gnosis Chain
      return WXDAI;
    }
    return WETH[chainId];
  }
  return undefined;
}
