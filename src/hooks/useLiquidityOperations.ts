"use client";

import { LEVINSWAP_CONFIG, NATIVE_TOKEN } from "@/config/constants";
import { Token } from "@/store/tokenLists";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { useCallback } from "react";
import FACTORY_ABI from "../abis/factory.json";
import PAIR_ABI from "../abis/pair.json";
import ROUTER_ABI from "../abis/router.json";
import { useWeb3Store } from "./useWeb3Store";

// Fonction pour vérifier si c'est le token natif
const isNativeToken = (token: Token) => {
  return (
    token.address.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
  );
};

export function useLiquidityOperations() {
  const { provider, account } = useWeb3Store();

  // Fonction pour obtenir l'adresse de la paire
  const getPairAddress = useCallback(
    async (token0: Token, token1: Token) => {
      if (!provider) return null;

      try {
        const factory = new ethers.Contract(
          LEVINSWAP_CONFIG.FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );

        const pairAddress = await factory.getPair(
          token0.address,
          token1.address
        );
        return pairAddress === ethers.constants.AddressZero
          ? null
          : pairAddress;
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'adresse de la paire:",
          error
        );
        return null;
      }
    },
    [provider]
  );

  // Fonction pour obtenir la part de l'utilisateur dans la pool
  const getUserShare = useCallback(
    async (token0: Token, token1: Token) => {
      if (!provider || !account) return null;

      try {
        const pairAddress = await getPairAddress(token0, token1);
        if (!pairAddress) return null;

        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [totalSupply, userBalance] = await Promise.all([
          pair.totalSupply(),
          pair.balanceOf(account),
        ]);

        if (totalSupply.isZero()) return "0";

        return new BigNumber(userBalance.toString())
          .dividedBy(totalSupply.toString())
          .multipliedBy(100)
          .toFixed(2);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de la part utilisateur:",
          error
        );
        return null;
      }
    },
    [provider, account, getPairAddress]
  );

  // Fonction pour ajouter de la liquidité
  const addLiquidity = useCallback(
    async (
      token0: Token,
      token1: Token,
      amount0: string,
      amount1: string,
      slippageTolerance: number,
      deadline: number
    ) => {
      if (!provider || !account)
        throw new Error("Provider ou compte non disponible");

      const router = new ethers.Contract(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        ROUTER_ABI,
        provider.getSigner()
      );

      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

      // Calculer les montants minimum avec le slippage
      const amount0Min = new BigNumber(amount0)
        .multipliedBy(1 - slippageTolerance / 100)
        .toFixed(token0.decimals);
      const amount1Min = new BigNumber(amount1)
        .multipliedBy(1 - slippageTolerance / 100)
        .toFixed(token1.decimals);

      // Préparer les montants en wei
      const amount0Wei = ethers.utils.parseUnits(amount0, token0.decimals);
      const amount1Wei = ethers.utils.parseUnits(amount1, token1.decimals);
      const amount0MinWei = ethers.utils.parseUnits(
        amount0Min,
        token0.decimals
      );
      const amount1MinWei = ethers.utils.parseUnits(
        amount1Min,
        token1.decimals
      );

      let tx;
      if (isNativeToken(token0)) {
        tx = await router.addLiquidityETH(
          token1.address,
          amount1Wei,
          amount1MinWei,
          amount0MinWei,
          account,
          deadlineTimestamp,
          { value: amount0Wei }
        );
      } else if (isNativeToken(token1)) {
        tx = await router.addLiquidityETH(
          token0.address,
          amount0Wei,
          amount0MinWei,
          amount1MinWei,
          account,
          deadlineTimestamp,
          { value: amount1Wei }
        );
      } else {
        tx = await router.addLiquidity(
          token0.address,
          token1.address,
          amount0Wei,
          amount1Wei,
          amount0MinWei,
          amount1MinWei,
          account,
          deadlineTimestamp
        );
      }

      return tx;
    },
    [provider, account]
  );

  // Fonction pour retirer de la liquidité
  const removeLiquidity = useCallback(
    async (
      token0: Token,
      token1: Token,
      liquidity: string,
      amount0Min: string,
      amount1Min: string,
      deadline: number
    ) => {
      if (!provider || !account)
        throw new Error("Provider ou compte non disponible");

      const router = new ethers.Contract(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        ROUTER_ABI,
        provider.getSigner()
      );

      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

      // Convertir les montants en wei
      const liquidityWei = ethers.utils.parseUnits(liquidity, 18); // LP tokens ont toujours 18 décimales
      const amount0MinWei = ethers.utils.parseUnits(
        amount0Min,
        token0.decimals
      );
      const amount1MinWei = ethers.utils.parseUnits(
        amount1Min,
        token1.decimals
      );

      let tx;
      if (isNativeToken(token0)) {
        tx = await router.removeLiquidityETH(
          token1.address,
          liquidityWei,
          amount1MinWei,
          amount0MinWei,
          account,
          deadlineTimestamp
        );
      } else if (isNativeToken(token1)) {
        tx = await router.removeLiquidityETH(
          token0.address,
          liquidityWei,
          amount0MinWei,
          amount1MinWei,
          account,
          deadlineTimestamp
        );
      } else {
        tx = await router.removeLiquidity(
          token0.address,
          token1.address,
          liquidityWei,
          amount0MinWei,
          amount1MinWei,
          account,
          deadlineTimestamp
        );
      }

      return tx;
    },
    [provider, account]
  );

  return {
    getPairAddress,
    getUserShare,
    addLiquidity,
    removeLiquidity,
  };
}
