import {
  CurrencyAmount,
  Fraction,
  JSBI,
  Percent,
  TokenAmount,
  Trade,
} from "@levinswap/uniswap-sdk";
import { INPUT_FRACTION_AFTER_FEE, ONE_HUNDRED_PERCENT } from "./constants";
import { PriceBreakdown } from "./types";

/**
 * Calcule la décomposition du prix pour un trade
 * @param trade Le trade à analyser
 * @returns Un objet contenant l'impact sur le prix sans les frais et les frais de liquidité réalisés
 */
export function computeTradePriceBreakdown(
  trade?: Trade
): PriceBreakdown {
  if (!trade) {
    return {};
  }

  // Pour chaque saut dans notre trade, on prend en compte l'impact sur le prix x*y=k des frais de 0.3%
  // Par exemple, pour 3 tokens/2 sauts : 1 - ((1 - .03) * (1-.03))
  const realizedLPFee = ONE_HUNDRED_PERCENT.subtract(
    trade.route.pairs.reduce<Fraction>(
      (currentFee: Fraction): Fraction =>
        currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
      ONE_HUNDRED_PERCENT
    )
  );

  // On retire les frais LP de l'impact sur le prix
  const priceImpactWithoutFeeFraction = trade.priceImpact.subtract(realizedLPFee);

  // L'impact x*y=k
  const priceImpactWithoutFeePercent = new Percent(
    JSBI.BigInt(priceImpactWithoutFeeFraction.numerator.toString()),
    JSBI.BigInt(priceImpactWithoutFeeFraction.denominator.toString())
  );

  // Le montant de l'entrée qui revient aux LPs
  const realizedLPFeeAmount =
    trade.inputAmount instanceof TokenAmount
      ? new TokenAmount(
          trade.inputAmount.token,
          realizedLPFee.multiply(trade.inputAmount.raw).quotient
        )
      : CurrencyAmount.ether(
          realizedLPFee.multiply(trade.inputAmount.raw).quotient
        );

  console.log("Returned data", {
    priceImpactWithoutFee: priceImpactWithoutFeePercent,
    realizedLPFee: realizedLPFeeAmount,
  });

  return {
    priceImpactWithoutFee: priceImpactWithoutFeePercent,
    realizedLPFee: realizedLPFeeAmount,
  };
}
