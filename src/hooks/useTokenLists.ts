import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { customTokensAtom } from "../store/customTokens";
import {
  activeTokensAtom,
  allListsAtom,
  customListsAtom,
  Token,
  tokenListsAtom,
} from "../store/tokenLists";
import { useWeb3 } from "./useWeb3";

export function useTokenLists() {
  const [state, setState] = useAtom(tokenListsAtom);
  const [customState, setCustomState] = useAtom(customListsAtom);
  const [allLists] = useAtom(allListsAtom);
  const [customTokens] = useAtom(customTokensAtom);
  const [activeTokensState] = useAtom(activeTokensAtom);
  const { chainId } = useWeb3();
  const initialized = useRef(false);

  // Initialiser les listes une seule fois au montage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Charger l'état stocké
  }, []); // S'exécute uniquement au montage

  const lists = useMemo(
    () =>
      Object.entries(allLists.lists).map(([id, list]) => {
        const filteredTokens = Array.isArray(list.tokens)
          ? list.tokens.filter((token) => token.chainId === chainId)
          : [];

        return {
          id,
          ...list,
          tokens: filteredTokens,
        };
      }),
    [allLists.lists, chainId]
  );

  const activeTokens = useMemo(() => {
    if (!chainId) return [];

    // Utiliser activeTokensAtom qui contient déjà tous les tokens (listes + personnalisés)
    return Object.values(activeTokensState[chainId] || {});
  }, [activeTokensState, chainId]);

  const searchTokens = useCallback(
    (query: string) => {
      if (!chainId) return [];

      const searchLower = query.toLowerCase();
      const isAddress = searchLower.startsWith("0x");

      // Fonction de recherche
      const matchesSearch = (token: Token) => {
        if (isAddress) {
          return token.address.toLowerCase().includes(searchLower);
        }
        return (
          token.symbol.toLowerCase().includes(searchLower) ||
          token.name.toLowerCase().includes(searchLower)
        );
      };

      // Rechercher dans tous les tokens actifs
      return activeTokens.filter(matchesSearch);
    },
    [activeTokens, chainId]
  );

  const toggleList = useCallback(
    (id: string, active: boolean) => {
      if (id.startsWith("custom-")) {
        setCustomState((prev) => {
          const newState = {
            ...prev,
            lists: {
              ...prev.lists,
              [id]: {
                ...prev.lists[id],
                active,
              },
            },
          };
          return newState;
        });
      } else {
        setState((prev) => {
          // Créer une copie profonde de l'état précédent
          const newState = {
            ...prev,
            lists: {
              ...prev.lists,
              [id]: {
                ...prev.lists[id],
                active,
              },
            },
          };

          return newState;
        });
      }
    },
    [setState, setCustomState]
  );

  const addList = useCallback(
    async (url: string) => {
      if (!url) return undefined;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Failed to fetch token list:", response.statusText);
          return undefined;
        }

        const listData = await response.json();

        if (!listData.tokens || !Array.isArray(listData.tokens)) {
          console.error("Invalid token list format");
          return undefined;
        }

        // Vérifier si la liste existe déjà
        const existingList = Object.entries(customState.lists).find(
          ([_, list]) => list.url === url
        );

        if (existingList) {
          // Mettre à jour la liste existante
          const [id] = existingList;
          setCustomState((prev) => ({
            ...prev,
            lists: {
              ...prev.lists,
              [id]: {
                ...prev.lists[id],
                name: listData.name || prev.lists[id].name,
                logoURI: listData.logoURI || prev.lists[id].logoURI,
                tokens: listData.tokens,
                active: true,
              },
            },
          }));
          return true;
        }

        // Ajouter une nouvelle liste
        const id = `custom-${Buffer.from(url).toString("base64")}`;
        setCustomState((prev) => ({
          ...prev,
          lists: {
            ...prev.lists,
            [id]: {
              name: listData.name || "Custom List",
              logoURI: listData.logoURI,
              tokens: listData.tokens,
              active: true,
              url,
            },
          },
        }));

        return true;
      } catch (error) {
        console.error("Failed to add token list:", error);
        return undefined;
      }
    },
    [customState.lists, setCustomState]
  );

  const removeList = useCallback(
    (id: string) => {
      if (!id.startsWith("custom-")) return;

      setCustomState((prev) => {
        const newLists = { ...prev.lists };
        delete newLists[id];
        return { ...prev, lists: newLists };
      });
    },
    [setCustomState]
  );

  return {
    lists,
    activeTokens,
    searchTokens,
    toggleList,
    addList,
    removeList,
  };
}
