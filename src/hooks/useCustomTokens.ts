import { ethers } from "ethers";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { CustomToken, customTokensAtom } from "../store/customTokens";
import { useWeb3 } from "./useWeb3";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

const DEFAULT_TOKEN_LOGO = "/images/default-token.png";

export function useCustomTokens() {
  const [customTokens, setCustomTokens] = useAtom(customTokensAtom);
  const { chainId, provider, active } = useWeb3();

  const validateAddress = useCallback((address: string): boolean => {
    try {
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  }, []);

  const fetchTokenInfo = useCallback(
    async (address: string): Promise<Partial<CustomToken> | null> => {
      if (!active) {
        console.error("fetchTokenInfo: Wallet not connected");
        return null;
      }

      if (!provider?.provider) {
        console.error("fetchTokenInfo: No provider available");
        return null;
      }

      if (!chainId) {
        console.error("fetchTokenInfo: No chainId available");
        return null;
      }

      if (!validateAddress(address)) {
        console.error("fetchTokenInfo: Invalid address", { address });
        return null;
      }

      try {
        const ethersProvider = new ethers.providers.Web3Provider(
          provider.provider
        );

        const contract = new ethers.Contract(
          address,
          ERC20_ABI,
          ethersProvider
        );
        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ]);

        // Si on a réussi à obtenir les données du contrat, on essaie d'obtenir le logo de CoinGecko
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
          );

          if (response.ok) {
            const data = await response.json();

            return {
              address,
              chainId,
              name,
              symbol,
              decimals,
              logoURI: data.image?.small || DEFAULT_TOKEN_LOGO,
            };
          }
        } catch (error) {
          console.warn("Failed to fetch logo from CoinGecko:", error);
        }

        // Si on n'a pas pu obtenir le logo, on retourne les données sans logo
        return {
          address,
          chainId,
          name,
          symbol,
          decimals,
          logoURI: DEFAULT_TOKEN_LOGO,
        };
      } catch (error) {
        console.error("Failed to fetch token info from contract:", error);
        return null;
      }
    },
    [active, provider, chainId, validateAddress]
  );

  const addCustomToken = useCallback(
    async (address: string, logoUrl?: string): Promise<boolean> => {
      if (!active || !provider || !chainId) {
        console.error(
          "addCustomToken: Wallet not connected or missing provider/chainId"
        );
        return false;
      }

      const tokenInfo = await fetchTokenInfo(address);

      if (!tokenInfo) {
        console.error("addCustomToken: Failed to fetch token info");
        return false;
      }

      try {
        setCustomTokens((prev) => {
          const newState = {
            ...prev,
            [chainId]: {
              ...prev[chainId],
              [address]: {
                ...tokenInfo,
                logoURI: logoUrl || tokenInfo.logoURI || DEFAULT_TOKEN_LOGO,
                imported: true,
                lastUpdated: Date.now(),
              } as CustomToken,
            },
          };
          return newState;
        });

        return true;
      } catch (error) {
        console.error("addCustomToken: Error updating state:", error);
        return false;
      }
    },
    [active, chainId, provider, fetchTokenInfo, setCustomTokens]
  );

  const removeCustomToken = useCallback(
    (address: string) => {
      if (!chainId) return;

      setCustomTokens((prev) => {
        const chainTokens = { ...prev[chainId] };
        delete chainTokens[address];
        return {
          ...prev,
          [chainId]: chainTokens,
        };
      });
    },
    [chainId, setCustomTokens]
  );

  const getCustomTokens = useCallback((): CustomToken[] => {
    if (!chainId || !customTokens[chainId]) return [];
    return Object.values(customTokens[chainId]);
  }, [chainId, customTokens]);

  return {
    customTokens: getCustomTokens(),
    addCustomToken,
    removeCustomToken,
    validateAddress,
    isReady: active && !!provider && !!chainId,
  };
}
