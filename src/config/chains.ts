import { Chain } from 'viem';

export const gnosisChain = {
  id: 100,
  name: "Gnosis Chain",
  network: "gnosis",
  nativeCurrency: {
    decimals: 18,
    name: "xDAI",
    symbol: "xDAI",
  },
  rpcUrls: {
    default: { http: ["https://rpc.gnosischain.com"] },
    public: { http: ["https://rpc.gnosischain.com"] },
  },
  blockExplorers: {
    default: {
      name: "GnosisScan",
      url: "https://gnosisscan.io",
    },
  },
} as const satisfies Chain;
