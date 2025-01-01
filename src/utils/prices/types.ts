import { CurrencyAmount, Percent, Trade } from "@levinswap/uniswap-sdk";

export interface PriceBreakdown {
  // Impact sur le prix sans les frais de liquidité
  priceImpactWithoutFee?: Percent;
  // Frais de liquidité réalisés
  realizedLPFee?: CurrencyAmount;
}

export interface TradeDetails {
  // Le trade Uniswap
  trade: Trade;
  // Impact sur le prix en pourcentage
  priceImpact: string;
  // Frais de liquidité
  lpFee: string;
}
