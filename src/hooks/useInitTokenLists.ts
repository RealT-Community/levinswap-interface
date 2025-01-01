import { TOKEN_LISTS, TOKEN_LISTS_CONFIG } from "@/config/tokenLists.config";
import { tokenListsAtom } from "@/store/tokenLists";
import { useAtom } from "jotai";
import { useEffect } from "react";

async function fetchTokenList(url: string, retryCount = 0): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retryCount < TOKEN_LISTS_CONFIG.retryAttempts) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      return fetchTokenList(url, retryCount + 1);
    }
    throw error;
  }
}

export function useInitTokenLists() {
  const [tokenLists, setTokenLists] = useAtom(tokenListsAtom);

  useEffect(() => {
    const initTokenLists = async () => {
      try {
        // Charger d'abord l'état stocké pour chaque liste
        const storedState = { ...tokenLists.lists };

        // Chargement en parallèle des tokens pour les listes actives uniquement
        const tokenListPromises = TOKEN_LISTS.map(async (config) => {
          const currentList = storedState[config.id];
          const isActive = currentList
            ? currentList.active
            : config.defaultEnabled;

          // Si la liste n'est pas active et qu'elle a déjà des tokens, pas besoin de la recharger
          if (!isActive && currentList?.tokens?.length > 0) {
            return {
              id: config.id,
              data: { tokens: currentList.tokens },
              fromCache: true,
            };
          }

          try {
            // Vérifier d'abord le cache
            const cachedData = localStorage.getItem(`tokenList_${config.id}`);
            const cachedTimestamp = localStorage.getItem(
              `tokenList_${config.id}_timestamp`
            );
            const now = Date.now();
            const cacheExpiry =
              TOKEN_LISTS_CONFIG.cacheTimeInMinutes * 60 * 1000;

            if (
              cachedData &&
              cachedTimestamp &&
              now - parseInt(cachedTimestamp) < cacheExpiry
            ) {
              return {
                id: config.id,
                data: JSON.parse(cachedData),
                fromCache: true,
              };
            }

            // Si pas de cache valide, charger depuis l'URL
            const data = await fetchTokenList(config.url);
            localStorage.setItem(
              `tokenList_${config.id}`,
              JSON.stringify(data)
            );
            localStorage.setItem(
              `tokenList_${config.id}_timestamp`,
              now.toString()
            );

            return {
              id: config.id,
              data,
              fromCache: false,
            };
          } catch (error) {
            console.error(
              `Erreur de chargement de la liste ${config.id}:`,
              error
            );
            // En cas d'erreur, utiliser les tokens existants s'il y en a
            if (currentList?.tokens?.length > 0) {
              return {
                id: config.id,
                data: { tokens: currentList.tokens },
                fromCache: true,
              };
            }
            throw error;
          }
        });

        const results = await Promise.allSettled(tokenListPromises);

        // Mettre à jour le store en préservant l'état actif
        setTokenLists((prev) => {
          const newLists = { ...prev.lists };

          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const config = TOKEN_LISTS[index];
              const { data } = result.value;

              // IMPORTANT: Préserver l'état actif existant
              const currentList = prev.lists[config.id];
              const existingActive = currentList?.active;

              newLists[config.id] = {
                name: config.name,
                logoURI: config.logoURI,
                tokens: data.tokens || [],
                // Utiliser l'état actif existant s'il existe, sinon la valeur par défaut
                active:
                  existingActive !== undefined
                    ? existingActive
                    : config.defaultEnabled,
                readonly: config.readonly,
              };
            }
          });

          const finalState = {
            ...prev,
            lists: newLists,
          };

          return finalState;
        });
      } catch (error) {
        console.error("Erreur d'initialisation des listes:", error);
      }
    };

    initTokenLists();
  }, []); // S'exécute uniquement au montage

  return tokenLists;
}
