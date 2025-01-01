import { TOKEN_LISTS } from "@/config/tokenLists.config";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { CustomToken, customTokensAtom } from "./customTokens";

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
  balance?: string;
  isRealToken?: boolean;
}

export interface TokenList {
  name: string;
  logoURI?: string;
  tokens: Token[];
  active: boolean;
  url?: string;
  readonly?: boolean;
}

export interface CustomTokenList extends TokenList {
  url: string;
}

export interface TokenListsState {
  lists: { [id: string]: TokenList };
  selectedTokens: { [chainId: number]: { [address: string]: Token } };
}

export interface CustomListsState {
  lists: { [id: string]: CustomTokenList };
}

// Tokens natifs par chaîne
export const NATIVE_TOKENS: { [chainId: number]: Token } = {
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000",
    chainId: 1,
    logoURI: "/images/native/eth.png",
  },
  100: {
    name: "xDAI",
    symbol: "XDAI",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000",
    chainId: 100,
    logoURI: "/images/native/xdai.png",
  },
};

// Liste spéciale pour les tokens natifs
const NATIVE_TOKEN_LIST_ID = "native-tokens";
const NATIVE_TOKEN_LIST: TokenList = {
  name: "Native Tokens",
  tokens: Object.values(NATIVE_TOKENS),
  active: true,
  readonly: true,
};

// État initial des listes personnalisées
const defaultCustomState: CustomListsState = {
  lists: {},
};

// Créer l'état initial à partir de la configuration
const defaultState: TokenListsState = {
  lists: {
    [NATIVE_TOKEN_LIST_ID]: NATIVE_TOKEN_LIST,
    ...TOKEN_LISTS.reduce(
      (acc, config) => ({
        ...acc,
        [config.id]: {
          name: config.name,
          logoURI: config.logoURI,
          tokens: [],
          active: config.defaultEnabled,
          readonly: config.readonly,
        },
      }),
      {}
    ),
  },
  selectedTokens: {},
};

// Clé unique pour le stockage local
const STORAGE_KEY = "tokenLists_v2";
const CUSTOM_STORAGE_KEY = "customTokenLists_v2";

// Fonction pour charger l'état depuis le stockage local
const loadFromStorage = (): TokenListsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;

    const parsed = JSON.parse(stored);

    // Fusionner avec l'état par défaut en préservant la liste native
    const mergedLists: { [key: string]: TokenList } = {
      [NATIVE_TOKEN_LIST_ID]: NATIVE_TOKEN_LIST, // Toujours garder la liste native
      ...defaultState.lists,
    };

    Object.entries(parsed.lists).forEach(([id, list]: [string, any]) => {
      if (mergedLists[id] && id !== NATIVE_TOKEN_LIST_ID) {
        // Ne pas écraser la liste native
        mergedLists[id] = {
          ...mergedLists[id],
          active:
            list.active !== undefined ? list.active : mergedLists[id].active,
          tokens: Array.isArray(list.tokens)
            ? list.tokens
            : mergedLists[id].tokens,
        };
      }
    });

    return {
      lists: mergedLists,
      selectedTokens: parsed.selectedTokens || {},
    };
  } catch (error) {
    console.error("Erreur lors du chargement des listes:", error);
    return defaultState;
  }
};

// Fonction pour charger les listes personnalisées
const loadCustomLists = (): CustomListsState => {
  try {
    const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!stored) return defaultCustomState;

    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error(
      "Erreur lors du chargement des listes personnalisées:",
      error
    );
    return defaultCustomState;
  }
};

// Fonction pour sauvegarder l'état dans le stockage local
const saveToStorage = (state: TokenListsState) => {
  try {
    // S'assurer que la liste native reste active
    const stateToSave = {
      ...state,
      lists: {
        ...state.lists,
        [NATIVE_TOKEN_LIST_ID]: NATIVE_TOKEN_LIST,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des listes:", error);
  }
};

// Fonction pour sauvegarder les listes personnalisées
const saveCustomLists = (state: CustomListsState) => {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des listes personnalisées:",
      error
    );
  }
};

// Atom principal pour les listes de tokens avec persistance
export const tokenListsAtom = atomWithStorage<TokenListsState>(
  STORAGE_KEY,
  loadFromStorage(),
  {
    getItem: (key) => {
      return loadFromStorage();
    },
    setItem: (key, value) => {
      saveToStorage(value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  }
);

// Atom pour les listes personnalisées
export const customListsAtom = atomWithStorage<CustomListsState>(
  CUSTOM_STORAGE_KEY,
  loadCustomLists(),
  {
    getItem: (key) => {
      return loadCustomLists();
    },
    setItem: (key, value) => {
      saveCustomLists(value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  }
);

// Atom pour les tokens sélectionnés
export const selectedTokensAtom = atomWithStorage<{
  [chainId: number]: { fromToken?: Token; toToken?: Token };
}>("selectedTokens_v1", {});

// Type guard pour TokenList
const isTokenList = (value: unknown): value is TokenList => {
  return (
    typeof value === "object" &&
    value !== null &&
    "active" in value &&
    "tokens" in value &&
    "name" in value &&
    Array.isArray((value as TokenList).tokens)
  );
};

// Type guard pour CustomTokenList
const isCustomTokenList = (value: unknown): value is CustomTokenList => {
  return (
    isTokenList(value) &&
    typeof value === "object" &&
    value !== null &&
    "url" in value
  );
};

// Convertir un CustomToken en Token standard
const customTokenToToken = (token: CustomToken): Token => ({
  address: token.address,
  chainId: token.chainId,
  decimals: token.decimals,
  name: token.name,
  symbol: token.symbol,
  logoURI: token.logoURI,
});

// Atome dérivé combinant les listes par défaut et personnalisées
export const allListsAtom = atom((get) => {
  const defaultLists = get(tokenListsAtom);
  const customLists = get(customListsAtom);
  const customTokens = get(customTokensAtom);

  type MergedLists = {
    lists: { [key: string]: TokenList };
    selectedTokens: { [chainId: number]: { [address: string]: Token } };
  };

  const mergedLists: MergedLists = {
    lists: {
      ...defaultLists.lists,
      ...Object.entries(customLists.lists).reduce((acc, [id, list]) => {
        if (isCustomTokenList(list)) {
          acc[id] = {
            name: list.name,
            logoURI: list.logoURI,
            tokens: list.tokens,
            active: list.active,
            url: list.url,
          };
        }
        return acc;
      }, {} as { [id: string]: TokenList }),
    },
    selectedTokens: {}, // Initialiser selectedTokens ici
  };

  return mergedLists;
});

// Atome dérivé pour obtenir tous les tokens des listes actives
export const activeTokensAtom = atom((get) => {
  const state = get(allListsAtom);
  const customTokens = get(customTokensAtom);
  const activeLists = Object.values(state.lists).filter(
    (list): list is TokenList => isTokenList(list) && list.active
  );

  const allTokens: { [chainId: number]: { [address: string]: Token } } = {};

  activeLists.forEach((list: TokenList) => {
    if (Array.isArray(list.tokens)) {
      list.tokens.forEach((token: Token) => {
        if (!allTokens[token.chainId]) {
          allTokens[token.chainId] = {};
        }
        allTokens[token.chainId][token.address] = token;
      });
    }
  });

  // Ajouter les tokens personnalisés directement
  Object.entries(customTokens).forEach(([chainId, tokens]) => {
    const numericChainId = Number(chainId);
    if (!allTokens[numericChainId]) {
      allTokens[numericChainId] = {};
    }
    Object.values(tokens).forEach((token) => {
      const customToken = token as CustomToken;
      allTokens[numericChainId][customToken.address] =
        customTokenToToken(customToken);
    });
  });

  return allTokens;
});
