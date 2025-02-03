import { Token } from "@/store/tokenLists";
import { gnosisChain } from "./chains";

/**
 * Tokens de base utilisés pour trouver des routes indirectes
 * Ces tokens sont généralement les plus liquides et servent d'intermédiaires
 */
export const BASES_TO_CHECK_TRADES_AGAINST: { [chainId: number]: Token[] } = {
  [gnosisChain.id]: [
    // WXDAI
    {
      address: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      chainId: gnosisChain.id,
      decimals: 18,
      name: "Wrapped XDAI",
      symbol: "WXDAI",
      logoURI: "",
    },
    // USDC
    {
      address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
      chainId: gnosisChain.id,
      decimals: 6,
      name: "USD Coin on Gnosis",
      symbol: "USDC",
      logoURI: "",
    },
    // WETH
    {
      address: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
      chainId: gnosisChain.id,
      decimals: 18,
      name: "Wrapped Ether on Gnosis",
      symbol: "WETH",
      logoURI: "",
    },
    // LEVIN
    {
      address: "0x1698cd22278ef6e7c0df45a8dea72edbea9e42aa",
      chainId: gnosisChain.id,
      decimals: 18,
      name: "Levin Token on Gnosis",
      symbol: "LEVIN",
      logoURI: "",
    },
  ],
};

/**
 * Certains tokens ne peuvent être échangés que via certaines paires
 * Utilisé pour éviter des routes indésirables
 */
export const CUSTOM_BASES: {
  [chainId: number]: { [tokenAddress: string]: Token[] };
} = {
  [gnosisChain.id]: {},
};
