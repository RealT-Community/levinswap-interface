import { CustomRoute } from "@/components/Exchange/SwapRoute";
import {
  Fraction,
  JSBI,
  Pair,
  Percent,
  Route,
  TokenAmount,
  Trade,
  TradeType,
  Token as UniToken,
} from "@levinswap/uniswap-sdk";
import { BigNumber } from "bignumber.js";

interface TradeDetails {
  priceImpact: string;
  lpFee: string;
}

// Constants pour le calcul des frais et de l'impact
const BASE_FEE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000));
const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000));
const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE);

export function computeTradeDetails(
  route: CustomRoute,
  amount: string,
  isExactIn: boolean
): TradeDetails {
  try {
    console.debug("Calcul des détails du trade:", {
      path: route.path.map((t) => t.symbol).join(" -> "),
      amount,
      isExactIn,
    });

    // 1. Créer les tokens d'entrée et de sortie
    const tokens = route.path.map(
      (token) =>
        new UniToken(token.chainId, token.address, token.decimals, token.symbol)
    );

    // 2. Créer les paires dans l'ordre exact du chemin
    const pairs = route.pairs.map((pairData, index) => {
      const token0 = tokens[index];
      const token1 = tokens[index + 1];

      // Utiliser la même logique de tri que la v1
      const [sortedToken0, sortedToken1] = token0.sortsBefore(token1)
        ? [token0, token1]
        : [token1, token0];

      // Vérifier si nous devons inverser les réserves en fonction du tri
      const shouldFlip = !token0.sortsBefore(token1);

      console.debug(`Création paire ${index}:`, {
        originalToken0: token0.symbol,
        originalToken1: token1.symbol,
        sortedToken0: sortedToken0.symbol,
        sortedToken1: sortedToken1.symbol,
        shouldFlip,
        reserves: shouldFlip
          ? [pairData.reserve1, pairData.reserve0]
          : [pairData.reserve0, pairData.reserve1],
      });

      return new Pair(
        new TokenAmount(
          sortedToken0,
          JSBI.BigInt(shouldFlip ? pairData.reserve1 : pairData.reserve0)
        ),
        new TokenAmount(
          sortedToken1,
          JSBI.BigInt(shouldFlip ? pairData.reserve0 : pairData.reserve1)
        )
      );
    });

    // 3. Créer le montant d'entrée
    const parsedAmount = new BigNumber(amount)
      .multipliedBy(10 ** route.path[0].decimals)
      .toString();

    const inputAmount = new TokenAmount(tokens[0], JSBI.BigInt(parsedAmount));

    // 4. Créer la route exactement comme dans le SDK
    const tradeRoute = new Route(pairs, tokens[0], tokens[tokens.length - 1]);
    console.debug("DEBUG tradeRoute", tradeRoute);
    // 5. Créer le trade directement, sans passer par bestTradeExactIn
    const trade = new Trade(tradeRoute, inputAmount, TradeType.EXACT_INPUT);

    console.debug("DEBUG Trade créé:", {
      route: trade.route.path.map((t) => t.symbol).join(" -> "),
      executionPrice: trade.executionPrice.toSignificant(6),
      nextMidPrice: trade.route.midPrice.toSignificant(6),
      priceImpact: trade.priceImpact.toSignificant(6),
    });

    // 6. Calculer les frais LP
    const realizedLPFee = ONE_HUNDRED_PERCENT.subtract(
      trade.route.pairs.reduce<Fraction>(
        (currentFee: Fraction): Fraction =>
          currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
        ONE_HUNDRED_PERCENT
      )
    );

    // 7. Calculer l'impact sur le prix sans les frais
    const priceImpactWithoutFeeFraction =
      trade.priceImpact.subtract(realizedLPFee);

    // 8. Convertir en pourcentage avec la même précision que la v1
    const priceImpactWithoutFeePercent = new Percent(
      JSBI.BigInt(priceImpactWithoutFeeFraction.numerator.toString()),
      JSBI.BigInt(priceImpactWithoutFeeFraction.denominator.toString())
    );

    // Calculer le montant des frais LP
    const lpFeeAmount = new BigNumber(amount)
      .multipliedBy(parseFloat(realizedLPFee.toSignificant(3)))
      .toFixed(6);

    console.debug("Calcul détaillé:", {
      trade: {
        route: trade.route.path.map((t) => t.symbol).join(" -> "),
        inputAmount: trade.inputAmount.toExact(),
        outputAmount: trade.outputAmount.toExact(),
        executionPrice: trade.executionPrice.toSignificant(6),
        priceImpact: trade.priceImpact.toSignificant(6),
      },
      rawPriceImpact: {
        numerator: trade.priceImpact.numerator.toString(),
        denominator: trade.priceImpact.denominator.toString(),
      },
      realizedLPFee: {
        value: realizedLPFee.toSignificant(3),
        numerator: realizedLPFee.numerator.toString(),
        denominator: realizedLPFee.denominator.toString(),
      },
      priceImpactWithoutFee: {
        fraction: priceImpactWithoutFeeFraction.toSignificant(6),
        numerator: priceImpactWithoutFeeFraction.numerator.toString(),
        denominator: priceImpactWithoutFeeFraction.denominator.toString(),
      },
      finalPriceImpact: {
        value: priceImpactWithoutFeePercent.toSignificant(3),
        numerator: priceImpactWithoutFeePercent.numerator.toString(),
        denominator: priceImpactWithoutFeePercent.denominator.toString(),
      },
    });

    return {
      priceImpact: priceImpactWithoutFeePercent.toSignificant(3),
      lpFee: lpFeeAmount,
    };
  } catch (error) {
    console.error("Erreur lors du calcul des détails du trade:", error);
    return {
      priceImpact: "0.00",
      lpFee: "0.00",
    };
  }
}
