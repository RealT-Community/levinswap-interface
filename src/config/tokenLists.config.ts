export interface TokenListConfig {
  id: string;
  name: string;
  url: string;
  logoURI?: string;
  defaultEnabled: boolean;
  readonly?: boolean;
  description?: string;
  category?: 'default' | 'stablecoin' | 'realt' | 'community';
}

export const TOKEN_LISTS: TokenListConfig[] = [
  {
    id: 'levinswap-default',
    name: 'Levinswap Default',
    url: 'https://ipfs.io/ipfs/QmUmN7Be3LLHiEwcVZDm6WsPjcTddWsc6C7hrLCmPzsanv?filename=levinswap-default.tokenlist.json',
    logoURI: '/images/logo.svg',
    defaultEnabled: false,
    category: 'default',
    description: 'Default token list from Levinswap'
  },
  {
    id: 'levinswap-stablecoin',
    name: 'Stablecoins',
    url: 'https://ipfs.io/ipfs/QmWrhnRTCQ8CgSoNmHV6WsneLLhErouD4fQPpSaqhsibpD?filename=levinswap-stablecoin-tokenlist.json',
    logoURI: '/images/stablecoin.svg',
    defaultEnabled: true,
    category: 'stablecoin',
    description: 'A list of commonly used stablecoins'
  },
  {
    id: 'realt',
    name: 'RealT',
    url: 'https://api.realtoken.community/v1/tokenList',
    logoURI: '/images/realtoken-logo.svg',
    defaultEnabled: true,
    category: 'realt',
    description: 'RealToken official token list'
  }
];

// Groupes de token lists pour une meilleure organisation dans l'UI
export const TOKEN_LIST_CATEGORIES = {
  default: 'Default',
  stablecoin: 'Stablecoins',
  realt: 'RealT Tokens',
  community: 'Community Lists'
} as const;

// Configuration pour l'initialisation des token lists
export const TOKEN_LISTS_CONFIG = {
  cacheTimeInMinutes: 60, // Durée de mise en cache des listes
  retryAttempts: 3, // Nombre de tentatives de chargement
  batchSize: 10, // Nombre de tokens à charger en parallèle
  refreshIntervalInMinutes: 30, // Intervalle de rafraîchissement automatique
} as const;
