export const LEVINSWAP_CONFIG = {
  // Adresses des contrats LevinSwap
  FACTORY_ADDRESS: "0x965769C9CeA8A7667246058504dcdcDb1E2975A5", // LevinSwap Factory
  ROUTER_ADDRESS: "0xb18d4f69627F8320619A696202Ad2C430CeF7C53", // LevinSwap Router

  // Tokens principaux sur Gnosis
  WRAPPED_NATIVE_TOKEN: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // wxDAI
  USDC_ADDRESS: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  WETH_ADDRESS: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
  STAKE_ADDRESS: "0xb7D311E2Eb55F2f68a9440da38e7989210b9A05e",
  LEVIN_ADDRESS: "0x1698cD22278ef6E7c0DF45a8dEA72EDbeA9E42aa",
  MULTICALL_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11",

  // Configuration UI
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_SLIPPAGE: 50, // 50%
  DEFAULT_DEADLINE: 20, // 20 minutes
} as const;

export const NATIVE_TOKEN = {
  NATIVE_ADDRESS: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  WRAPPED_ADDRESS: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  SYMBOL: "XDAI",
  WRAPPED_SYMBOL: "WXDAI",
  DECIMALS: 18,
} as const;

export const CHAIN_ID = 100; // Gnosis Chain

// Tokens communs pour l'interface
export const COMMON_TOKENS = [
  {
    address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
    symbol: "USDC",
    name: "USDC on xDai",
    decimals: 18,
    logoURI: "/images/tokens/usdc.png",
  },
  {
    address: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
    symbol: "WETH",
    name: "Wrapped Ether on xDai",
    decimals: 18,
    logoURI: "/images/tokens/weth.png",
  },
  {
    address: "0x1698cD22278ef6E7c0DF45a8dEA72EDbeA9E42aa",
    symbol: "LEVIN",
    name: "Levin Token on xDai",
    decimals: 18,
    logoURI: "/images/tokens/levin.png",
  },
];

export const REALT_TOKEN_LIST_URL =
  "https://api.realtoken.community/v1/tokenList";
