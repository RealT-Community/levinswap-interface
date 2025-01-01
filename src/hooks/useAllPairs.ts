"use client";

import { LEVINSWAP_CONFIG, NATIVE_TOKEN } from "@/config/constants";
import { BASES_TO_CHECK_TRADES_AGAINST } from "@/config/routing";
import { useWeb3 } from "@/hooks/useWeb3";
import { Token } from "@/store/tokenLists";
import {
  Pair,
  TokenAmount,
  Trade,
  Token as UniToken,
  WETH,
} from "@levinswap/uniswap-sdk";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";
import FACTORY_ABI from "../abis/factory.json";
import PAIR_ABI from "../abis/pair.json";

export interface CustomPair {
  token0: Token;
  token1: Token;
  address: string;
  reserve0: string;
  reserve1: string;
}

export interface CustomRoute {
  path: Token[];
  pairs: CustomPair[];
  amountOut: string;
  amountIn?: string;
}

// Convertir un Token en UniToken
const convertToUniToken = (token: Token): UniToken => {
  if (isNativeToken(token)) {
    return WETH[token.chainId as keyof typeof WETH];
  }
  return new UniToken(
    token.chainId,
    token.address,
    token.decimals,
    token.symbol,
    token.name || token.symbol
  );
};

// Convertir un UniToken en Token
const convertToToken = (token: UniToken): Token => {
  return {
    address: token.address,
    chainId: token.chainId,
    decimals: token.decimals,
    symbol: token.symbol || "",
    name: token.name || token.symbol || "",
    logoURI: "", // Ajout de la propriété manquante
  };
};

// Fonction pour vérifier si c'est le token natif
const isNativeToken = (token: Token) => {
  return (
    token.address.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase() ||
    token.symbol === "XDAI"
  );
};

// Fonction pour obtenir l'adresse à utiliser pour le swap
const getSwapAddress = (token: Token) => {
  return isNativeToken(token) ? NATIVE_TOKEN.WRAPPED_ADDRESS : token.address;
};

export function useAllCommonPairs() {
  const { chainId, provider } = useWeb3();

  const bases: Token[] = useMemo(
    () => (chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []),
    [chainId]
  );

  // Fonction pour obtenir les données d'une paire
  const getPairData = useCallback(
    async (tokenA: Token, tokenB: Token): Promise<CustomPair | null> => {
      if (!provider) return null;

      try {
        const factory = new ethers.Contract(
          LEVINSWAP_CONFIG.FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );

        // Utiliser les adresses wrapped pour la recherche de paire
        const addressA = getSwapAddress(tokenA);
        const addressB = getSwapAddress(tokenB);

        const pairAddress = await factory.getPair(addressA, addressB);

        if (
          pairAddress === "0x0000000000000000000000000000000000000000" ||
          !pairAddress
        ) {
          return null;
        }

        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [token0, token1, reserves] = await Promise.all([
          pair.token0(),
          pair.token1(),
          pair.getReserves(),
        ]);

        const [reserve0, reserve1] = reserves;

        // Vérifier que les réserves ne sont pas nulles
        if (reserve0.isZero() && reserve1.isZero()) {
          return null;
        }

        return {
          token0:
            tokenA.address.toLowerCase() === token0.toLowerCase()
              ? tokenA
              : tokenB,
          token1:
            tokenA.address.toLowerCase() === token0.toLowerCase()
              ? tokenB
              : tokenA,
          address: pairAddress,
          reserve0: reserve0.toString(),
          reserve1: reserve1.toString(),
        };
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données de la paire:",
          error
        );
        return null;
      }
    },
    [provider]
  );

  // Fonction pour trouver toutes les routes possibles
  const findPairs = useCallback(
    async (
      tokenIn: Token,
      tokenOut: Token
    ): Promise<{ directPair: CustomPair | null; routes: CustomRoute[] }> => {
      const directPair = await getPairData(tokenIn, tokenOut);

      // Convertir les tokens en tokens Uniswap
      const uniTokenIn = convertToUniToken(tokenIn);
      const uniTokenOut = convertToUniToken(tokenOut);

      // Créer toutes les combinaisons possibles de paires avec les bases
      const allPairCombinations = [
        // Paires directes avec les bases
        ...bases.map((base) => [tokenIn, base]),
        ...bases.map((base) => [base, tokenOut]),
        // Paires entre les bases
        ...bases.flatMap((base1) =>
          bases
            .map((base2) => [base1, base2])
            .filter(([t1, t2]) => t1.address !== t2.address)
        ),
      ];

      console.debug(
        "Recherche de toutes les combinaisons de paires possibles:",
        {
          combinaisons: allPairCombinations.map(
            ([t1, t2]) => `${t1.symbol}-${t2.symbol}`
          ),
        }
      );

      // Obtenir toutes les paires existantes
      const allPairs = await Promise.all(
        allPairCombinations.map(async ([t1, t2]) => {
          const pair = await getPairData(t1, t2);
          if (pair) {
            console.debug(`Paire trouvée: ${t1.symbol}-${t2.symbol}`, {
              reserve0: pair.reserve0,
              reserve1: pair.reserve1,
            });
          }
          return pair;
        })
      );

      // Filtrer les paires nulles
      const validPairs = allPairs.filter(
        (pair): pair is CustomPair => pair !== null
      );

      console.debug("Paires valides trouvées:", {
        count: validPairs.length,
        paires: validPairs.map((p) => `${p.token0.symbol}-${p.token1.symbol}`),
      });

      // Convertir en paires Uniswap
      const uniPairs = validPairs.map((pair) => {
        const token0 = convertToUniToken(pair.token0);
        const token1 = convertToUniToken(pair.token1);
        return new Pair(
          new TokenAmount(token0, pair.reserve0),
          new TokenAmount(token1, pair.reserve1)
        );
      });

      if (uniPairs.length === 0) {
        return { directPair, routes: [] };
      }

      try {
        const amountIn = ethers.utils
          .parseUnits("1", uniTokenIn.decimals)
          .toString();

        // Augmenter maxHops à 4 pour permettre des routes plus longues
        const trades = Trade.bestTradeExactIn(
          uniPairs,
          new TokenAmount(uniTokenIn, amountIn),
          uniTokenOut,
          { maxNumResults: 3, maxHops: 4 }
        );

        console.debug("Routes trouvées:", {
          count: trades.length,
          routes: trades.map((trade) => ({
            path: trade.route.path.map((t) => t.symbol).join(" -> "),
            executionPrice: trade.executionPrice.toSignificant(6),
            inputAmount: trade.inputAmount.toExact(),
            outputAmount: trade.outputAmount.toExact(),
            priceImpact: trade.priceImpact.toSignificant(6),
            midPrice: trade.route.midPrice.toSignificant(6),
          })),
        });

        const customRoutes: CustomRoute[] = trades.map((trade: Trade) => {
          const formattedPairs = trade.route.pairs.map((pair: Pair) => {
            const reserve0 = pair.reserve0.raw.toString();
            const reserve1 = pair.reserve1.raw.toString();

            return {
              token0: convertToToken(pair.token0),
              token1: convertToToken(pair.token1),
              address: pair.liquidityToken.address,
              reserve0,
              reserve1,
            };
          });

          return {
            path: trade.route.path.map((token: UniToken) =>
              convertToToken(token)
            ),
            pairs: formattedPairs,
            amountOut: trade.executionPrice.toSignificant(6),
          };
        });

        return {
          directPair,
          routes: customRoutes,
        };
      } catch (error) {
        console.error("Erreur lors de la recherche des routes:", error);
        return {
          directPair,
          routes: [],
        };
      }
    },
    [provider, bases, getPairData]
  );

  return {
    findPairs,
  };
}
