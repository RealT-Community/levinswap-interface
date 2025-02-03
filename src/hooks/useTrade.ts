import { BASES_TO_CHECK_TRADES_AGAINST } from "@/constants";
import { wrappedCurrency } from "@/utils/wrappedCurrency";
import {
  Currency,
  CurrencyAmount,
  Pair,
  Token,
  Trade,
} from "@levinswap/uniswap-sdk";
import { useMemo } from "react";
import { PairState, usePairs } from "./usePairs";
import { useWeb3 } from "./useWeb3";

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency
): Trade | null {
  const { chainId } = useWeb3();
  const bases = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? [] : [];

  const [tokenA, tokenB] = chainId
    ? [
        wrappedCurrency(currencyAmountIn?.currency, chainId),
        wrappedCurrency(currencyOut, chainId),
      ]
    : [undefined, undefined];

  const basePairs = useMemo(
    () =>
      bases
        .flatMap((base) => bases.map((otherBase) => [base, otherBase]))
        .filter(([t0, t1]) => t0.address !== t1.address),
    [bases]
  );

  const allPairCombinations = useMemo(
    () =>
      tokenA && tokenB
        ? [
            [tokenA, tokenB], // direct pair
            ...bases.map((base) => [tokenA, base]), // token A against all bases
            ...bases.map((base) => [tokenB, base]), // token B against all bases
            ...basePairs, // each base against all bases
          ]
            .filter((tokens): tokens is [Token, Token] =>
              Boolean(tokens[0] instanceof Token && tokens[1] instanceof Token)
            )
            .filter(([t0, t1]) => t0.address !== t1.address)
        : [],
    [tokenA, tokenB, bases, basePairs]
  );

  const allPairs = usePairs(allPairCombinations);

  const allowedPairs = useMemo(
    () =>
      Object.values(
        allPairs
          .filter((result): result is [PairState.EXISTS, Pair] =>
            Boolean(result[0] === PairState.EXISTS && result[1])
          )
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] =
              memo[curr.liquidityToken.address] ?? curr;
            return memo;
          }, {})
      ),
    [allPairs]
  );

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
          maxHops: 3,
          maxNumResults: 1,
        })[0] ?? null
      );
    }
    return null;
  }, [allowedPairs, currencyAmountIn, currencyOut]);
}
