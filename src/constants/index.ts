import { Token } from '@levinswap/uniswap-sdk';

export const WXDAI = new Token(
  100, // Gnosis Chain ID
  '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  18,
  'WXDAI',
  'Wrapped XDAI'
);

// Bases to track against
export const BASES_TO_CHECK_TRADES_AGAINST: { [chainId: number]: Token[] } = {
  100: [ // Gnosis Chain
    WXDAI,
    // Ajoutez d'autres tokens de base pour Gnosis Chain ici
  ]
};
