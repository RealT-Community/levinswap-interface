"use client";

import { CustomRoute } from "@/components/Exchange/SwapRoute";
import { LEVINSWAP_CONFIG } from "@/config/constants";
import { Token } from "@/store/tokenLists";
import { ethers } from "ethers";
import { useCallback, useState } from "react";
import { useAllCommonPairs } from "./useAllPairs";
import { useWeb3 } from "./useWeb3";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] memory path) view returns (uint[] memory amounts)",
];

const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function getAmountOut(uint amountIn, bool fromToken0) external view returns (uint amountOut)",
  "function getAmountIn(uint amountOut, bool fromToken0) external view returns (uint amountIn)",
];

export const usePairPrice = () => {
  const { provider } = useWeb3();
  const { findPairs } = useAllCommonPairs();
  const [currentRoute, setCurrentRoute] = useState<CustomRoute | null>(null);

  const getBestRoute = useCallback(
    async (tokenA: Token, tokenB: Token) => {
      if (!provider) return { route: null, isDirect: false };

      try {
        const { directPair, routes } = await findPairs(tokenA, tokenB);
        console.debug("getBestRoute -> Routes trouvées:", {
          directPair,
          routes: routes.map((r) => ({
            path: r.path.map((t) => t.symbol).join(" -> "),
            amountOut: r.amountOut,
          })),
        });

        let bestRoute: CustomRoute | null = null;
        let isDirect = false;

        // Si nous avons des routes
        if (routes.length > 0 || directPair) {
          // Si une paire directe existe, on l'utilise
          if (directPair) {
            console.debug("Utilisation de la route directe");
            bestRoute = {
              path: [tokenA, tokenB],
              pairs: [directPair],
              amountOut: "0", // Sera calculé plus tard
            };
            isDirect = true;

            console.debug("Route directe créée:", {
              path: [tokenA, tokenB].map((t) => t.symbol).join(" -> "),
              tokenA: tokenA.address,
              tokenB: tokenB.address,
            });
          } else {
            // Sinon, on prend la meilleure route indirecte
            console.debug("Utilisation de la meilleure route indirecte:", {
              path: routes[0].path.map((t) => t.symbol).join(" -> "),
              amountOut: routes[0].amountOut,
            });
            bestRoute = routes[0];
          }
        }

        console.debug(
          "Route sélectionnée:",
          bestRoute
            ? {
                path: bestRoute.path.map((t) => t.symbol).join(" -> "),
                isDirect,
              }
            : "Aucune route"
        );

        setCurrentRoute(bestRoute);
        return { route: bestRoute, isDirect };
      } catch (error) {
        console.error(
          "Erreur lors de la recherche de la meilleure route:",
          error
        );
        setCurrentRoute(null);
        return { route: null, isDirect: false };
      }
    },
    [provider, findPairs]
  );

  const calculatePrice = useCallback(
    async (
      inputAmount: string,
      fromToken: Token,
      toToken: Token,
      isExactIn: boolean = true
    ) => {
      if (!provider || !currentRoute) {
        console.debug("Calcul des prix impossible:", {
          hasProvider: !!provider,
          hasRoute: !!currentRoute,
        });
        return "0";
      }

      try {
        console.debug("Calcul du montant de sortie pour:", {
          inputAmount,
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          isExactIn,
          route: currentRoute.path.map((t) => t.symbol).join(" -> "),
        });

        // Si c'est une route directe
        if (currentRoute.pairs.length === 1) {
          const pairContract = new ethers.Contract(
            currentRoute.pairs[0].address,
            PAIR_ABI,
            provider
          );

          const [token0, token1, reserves] = await Promise.all([
            pairContract.token0(),
            pairContract.token1(),
            pairContract.getReserves(),
          ]);

          const [reserve0, reserve1] = reserves;

          // Déterminer si fromToken est token0 ou token1
          const isFromToken0 =
            fromToken.address.toLowerCase() === token0.toLowerCase();
          const fromReserve = isFromToken0 ? reserve0 : reserve1;
          const toReserve = isFromToken0 ? reserve1 : reserve0;

          console.debug("Configuration de la paire directe:", {
            isFromToken0,
            token0,
            token1,
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
            fromReserve: fromReserve.toString(),
            toReserve: toReserve.toString(),
          });

          if (isExactIn) {
            const amountIn = ethers.utils.parseUnits(
              inputAmount,
              fromToken.decimals
            );
            // Calcul: (amountIn * 997 * toReserve) / (fromReserve * 1000 + amountIn * 997)
            const numerator = amountIn.mul(997).mul(toReserve);
            const denominator = fromReserve.mul(1000).add(amountIn.mul(997));
            const amountOut = numerator.div(denominator);

            const result = ethers.utils.formatUnits(
              amountOut,
              toToken.decimals
            );
            console.debug("Résultat du calcul (route directe):", {
              amountIn: amountIn.toString(),
              amountOut: amountOut.toString(),
              result,
            });
            return result;
          } else {
            const amountOut = ethers.utils.parseUnits(
              inputAmount,
              toToken.decimals
            );
            // Calcul: (fromReserve * amountOut * 1000) / ((toReserve - amountOut) * 997)
            const numerator = fromReserve.mul(amountOut).mul(1000);
            const denominator = toReserve.sub(amountOut).mul(997);
            const amountIn = numerator.div(denominator);

            const result = ethers.utils.formatUnits(
              amountIn,
              fromToken.decimals
            );
            console.debug("Résultat du calcul (route directe):", {
              amountOut: amountOut.toString(),
              amountIn: amountIn.toString(),
              result,
            });
            return result;
          }
        }
        // Pour les routes indirectes
        else {
          const router = new ethers.Contract(
            LEVINSWAP_CONFIG.ROUTER_ADDRESS,
            ROUTER_ABI,
            provider
          );

          const path = currentRoute.path.map((token) => token.address);
          console.debug(
            "Chemin pour le calcul (route indirecte):",
            path.join(" -> ")
          );

          if (isExactIn) {
            const amountIn = ethers.utils.parseUnits(
              inputAmount,
              fromToken.decimals
            );
            console.debug("Calcul getAmountsOut avec:", {
              amountIn: amountIn.toString(),
              path,
            });
            const amounts = await router.getAmountsOut(amountIn, path);
            const result = ethers.utils.formatUnits(
              amounts[amounts.length - 1],
              toToken.decimals
            );
            console.debug("Résultat getAmountsOut:", result);
            return result;
          } else {
            const amountOut = ethers.utils.parseUnits(
              inputAmount,
              toToken.decimals
            );
            console.debug("Calcul getAmountsIn avec:", {
              amountOut: amountOut.toString(),
              path,
            });
            const amounts = await router.getAmountsIn(amountOut, path);
            const result = ethers.utils.formatUnits(
              amounts[0],
              fromToken.decimals
            );
            console.debug("Résultat getAmountsIn:", result);
            return result;
          }
        }
      } catch (error) {
        console.error("Erreur lors du calcul des prix:", error);
        return "0";
      }
    },
    [provider, currentRoute]
  );

  return {
    calculatePrice,
    getBestRoute,
    currentRoute,
  };
};
