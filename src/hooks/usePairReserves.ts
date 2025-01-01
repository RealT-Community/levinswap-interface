"use client";

import { LEVINSWAP_CONFIG } from "@/config/constants";
import { ethers } from "ethers";
import { useCallback } from "react";
import FACTORY_ABI from "../abis/factory.json";
import PAIR_ABI from "../abis/pair.json";
import { useWeb3Store } from "./useWeb3Store";

export function usePairReserves() {
  const { provider } = useWeb3Store();

  const getReserves = useCallback(
    async (token0Address: string, token1Address: string) => {
      if (!provider) return null;

      try {
        const factory = new ethers.Contract(
          LEVINSWAP_CONFIG.FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );

        const pairAddress = await factory.getPair(token0Address, token1Address);

        if (
          pairAddress === "0x0000000000000000000000000000000000000000" ||
          !pairAddress
        ) {
          return null;
        }

        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [actualToken0, actualToken1, reserves] = await Promise.all([
          pair.token0(),
          pair.token1(),
          pair.getReserves(),
        ]);

        const [reserve0, reserve1] = reserves;

        // Vérifier si les tokens sont dans le bon ordre
        const isToken0First =
          token0Address.toLowerCase() === actualToken0.toLowerCase();

        return {
          reserve0: isToken0First ? reserve0.toString() : reserve1.toString(),
          reserve1: isToken0First ? reserve1.toString() : reserve0.toString(),
        };
      } catch (error) {
        console.error("Erreur lors de la récupération des réserves:", error);
        return null;
      }
    },
    [provider]
  );

  return {
    getReserves,
  };
}
