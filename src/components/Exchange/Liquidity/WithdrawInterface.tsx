import { LEVINSWAP_CONFIG } from "@/config/constants";
import { useWeb3Store } from "@/hooks/useWeb3Store";
import { useWithdrawValidation } from "@/hooks/useWithdrawValidation";
import { Token } from "@/store/tokenLists";
import { formatPercentage } from "@/utils/formatNumber";
import {
  Anchor,
  Button,
  Card,
  Group,
  Slider,
  Switch,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCoins } from "@tabler/icons-react";
import { ethers } from "ethers";
import React, { useEffect, useMemo, useState } from "react";
import classes from "./WithdrawInterface.module.css";
import { WithdrawTokenInput } from "./WithdrawTokenInput";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const ROUTER_ABI = [
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
];

const REALTOKEN_ABI = [
  "function canTransfer(address _from, address _to, uint256 _amount) view returns (bool)",
];

const showOperationNotification = (
  operationId: string,
  notification: {
    id: string;
    title: string;
    message: string | React.ReactNode;
    color: string;
    loading?: boolean;
  }
) => {
  notifications.hide(operationId);
  notifications.show({
    ...notification,
    id: operationId,
    autoClose: notification.loading ? false : 60000,
    withCloseButton: !notification.loading,
  });
};

interface WithdrawInterfaceProps {
  token0: Token;
  token1: Token;
  reserves: {
    reserve0: string;
    reserve1: string;
  };
  userShare: string;
  lpTokens: string;
  lpToken: Token;
  onPercentageChange: (percentage: number) => void;
  pairAddress: string;
  onWithdrawSuccess?: () => void;
}

// Fonctions utilitaires pour la conversion et le formatage
const formatDisplayValue = (value: string): string => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "0";
  if (num < 0.000001) return num.toExponential(4);
  if (num < 0.001) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
};

const calculateTokenAmount = (
  percentage: number,
  reserve: string,
  userShare: string,
  decimals: number
): string => {
  try {
    if (percentage === 0) return "0";

    console.debug("Calcul du montant - Données initiales:", {
      percentage,
      reserve,
      userShare,
      decimals,
    });

    // Convertir les réserves en BigNumber (déjà en wei)
    const reserveBN = ethers.BigNumber.from(reserve);

    // Convertir userShare en BigNumber avec précision maximale
    const userSharePrecise = ethers.utils.parseUnits(userShare, 18);

    // Convertir le pourcentage en BigNumber avec précision
    const percentageBN = ethers.utils.parseUnits(percentage.toString(), 18);

    // Calculer la part de l'utilisateur dans les réserves avec précision maximale
    const amount = reserveBN
      .mul(userSharePrecise)
      .mul(percentageBN)
      .div(ethers.utils.parseUnits("100", 18))
      .div(ethers.utils.parseUnits("100", 18));

    const formattedAmount = ethers.utils.formatUnits(amount, decimals);

    console.debug("Calcul du montant - Résultat:", {
      reserveBN: reserveBN.toString(),
      userSharePrecise: userSharePrecise.toString(),
      percentageBN: percentageBN.toString(),
      amount: amount.toString(),
      formattedAmount,
      calcul: `(${reserveBN.toString()} * ${userSharePrecise.toString()} * ${percentageBN.toString()}) / (${ethers.utils
        .parseUnits("100", 18)
        .toString()} * ${ethers.utils.parseUnits("100", 18).toString()})`,
    });

    return formattedAmount;
  } catch (error) {
    console.error("Erreur dans calculateTokenAmount:", error);
    return "0";
  }
};

const calculatePercentageFromAmount = (
  amount: string,
  reserve: string,
  userShare: string,
  decimals: number
): number => {
  try {
    if (!amount || amount === "0") return 0;

    console.debug("Début calculatePercentageFromAmount:", {
      amount,
      reserve,
      userShare,
      decimals,
    });

    // Convertir le montant en BigNumber avec les bonnes décimales
    const amountBN = ethers.utils.parseUnits(amount, decimals);

    // Convertir les réserves en BigNumber (déjà en wei)
    const reserveBN = ethers.BigNumber.from(reserve);

    // Calculer la part totale de l'utilisateur
    const userShareBN = ethers.utils.parseUnits(userShare, 2);
    const userReserve = reserveBN.mul(userShareBN).div(10000);

    // Calculer le pourcentage (résultat avec 2 décimales)
    const percentage = amountBN.mul(10000).div(userReserve);
    const percentageNumber = Number(ethers.utils.formatUnits(percentage, 2));

    console.debug("Résultat calculatePercentageFromAmount:", {
      amountBN: amountBN.toString(),
      reserveBN: reserveBN.toString(),
      userShareBN: userShareBN.toString(),
      userReserve: userReserve.toString(),
      percentage: percentage.toString(),
      percentageNumber,
    });

    return Math.min(percentageNumber, 100);
  } catch (error) {
    console.error("Erreur lors du calcul du pourcentage:", error);
    return 0;
  }
};

const checkRealTokenTransfer = async (
  token: Token,
  amount: string,
  provider: ethers.providers.Web3Provider,
  account: string
): Promise<boolean> => {
  try {
    if (!token.isRealToken) return true;

    const contract = new ethers.Contract(
      token.address,
      REALTOKEN_ABI,
      provider
    );

    const amountWei = ethers.utils.parseUnits(amount, token.decimals);
    const canTransfer = await contract.canTransfer(
      account,
      LEVINSWAP_CONFIG.ROUTER_ADDRESS,
      amountWei
    );

    console.debug("Vérification RealToken canTransfer:", {
      token: token.symbol,
      from: account,
      to: LEVINSWAP_CONFIG.ROUTER_ADDRESS,
      amount: amount,
      amountWei: amountWei.toString(),
      canTransfer,
    });

    return canTransfer;
  } catch (error) {
    console.error(
      `Erreur lors de la vérification canTransfer pour ${token.symbol}:`,
      error
    );
    return false;
  }
};

const verifyAllowanceAndProceed = async (
  contract: ethers.Contract,
  account: string,
  amountToApprove: ethers.BigNumber,
  lpToken: Token,
  token0: Token,
  token1: Token,
  amount0: string,
  amount1: string,
  provider: ethers.providers.Web3Provider,
  updateTransactionState: (
    state: "idle" | "waiting_wallet" | "pending" | "success" | "error"
  ) => void
) => {
  // Vérifier l'allowance finale
  const finalAllowance = await contract.allowance(
    account,
    LEVINSWAP_CONFIG.ROUTER_ADDRESS
  );

  console.debug("Vérification finale post-approbation:", {
    finalAllowance: finalAllowance.toString(),
    finalAllowanceFormatted: ethers.utils.formatUnits(
      finalAllowance,
      lpToken.decimals
    ),
    amountToApprove: amountToApprove.toString(),
    amountToApproveFormatted: ethers.utils.formatUnits(
      amountToApprove,
      lpToken.decimals
    ),
    isApproved: finalAllowance.gte(amountToApprove),
  });

  if (finalAllowance.lt(amountToApprove)) {
    throw new Error("L'approbation n'a pas été effectuée avec le bon montant");
  }

  // Vérifier les RealTokens
  const token0CanTransfer = await checkRealTokenTransfer(
    token0,
    amount0,
    provider,
    account
  );
  const token1CanTransfer = await checkRealTokenTransfer(
    token1,
    amount1,
    provider,
    account
  );

  console.debug("Résultat des vérifications RealToken:", {
    token0: {
      symbol: token0.symbol,
      isRealToken: token0.isRealToken,
      canTransfer: token0CanTransfer,
    },
    token1: {
      symbol: token1.symbol,
      isRealToken: token1.isRealToken,
      canTransfer: token1CanTransfer,
    },
  });

  if (!token0CanTransfer) {
    throw new Error(`Le transfert de ${token0.symbol} n'est pas autorisé`);
  }

  if (!token1CanTransfer) {
    throw new Error(`Le transfert de ${token1.symbol} n'est pas autorisé`);
  }

  // Forcer la mise à jour de l'état de validation
  updateTransactionState("idle");
  return true;
};

export function WithdrawInterface({
  token0,
  token1,
  reserves,
  userShare,
  lpTokens,
  lpToken,
  onPercentageChange,
  pairAddress,
  onWithdrawSuccess,
}: WithdrawInterfaceProps) {
  // Créer un ID unique pour cette instance du composant
  const instanceId = React.useMemo(
    () => `${token0.symbol}-${token1.symbol}-${pairAddress}`,
    [token0.symbol, token1.symbol, pairAddress]
  );

  console.debug("Initialisation WithdrawInterface:", {
    instanceId,
    token0: token0?.symbol,
    token1: token1?.symbol,
    pairAddress,
    reserves: {
      reserve0: reserves?.reserve0,
      reserve1: reserves?.reserve1,
    },
    userShare,
    lpTokens,
  });

  if (!pairAddress) {
    console.error("PairAddress manquant dans WithdrawInterface");
  }

  const { provider, account } = useWeb3Store();
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [amount0, setAmount0] = useState("0");
  const [amount1, setAmount1] = useState("0");

  // Réinitialiser les états quand les tokens changent
  useEffect(() => {
    console.debug("Réinitialisation des états - changement de tokens:", {
      instanceId,
      token0: token0?.symbol,
      token1: token1?.symbol,
    });
    setAmount0("0");
    setAmount1("0");
    setPercentage(0);
  }, [instanceId, token0?.symbol, token1?.symbol]);

  const [transactionState, setTransactionState] = useState<
    "idle" | "waiting_wallet" | "pending" | "success" | "error"
  >("idle");
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const {
    isValid,
    buttonText,
    errorMessage,
    isApproval,
    warningStyle,
    updateTransactionState,
  } = useWithdrawValidation(
    token0,
    token1,
    lpToken,
    percentage,
    LEVINSWAP_CONFIG.ROUTER_ADDRESS,
    lpTokens
  );

  const handlePercentageChange = (value: number) => {
    console.debug(`[${instanceId}] Début handlePercentageChange:`, {
      value,
      token0: token0?.symbol,
      token1: token1?.symbol,
    });

    setPercentage(value);
    onPercentageChange(value);

    try {
      // Calculer les montants pour les deux tokens
      console.debug("Calcul du montant pour token0...");
      const newAmount0 = calculateTokenAmount(
        value,
        reserves.reserve0,
        userShare,
        token0.decimals
      );

      console.debug("Calcul du montant pour token1...");
      const newAmount1 = calculateTokenAmount(
        value,
        reserves.reserve1,
        userShare,
        token1.decimals
      );

      console.debug("Résultats finaux:", {
        token0: {
          symbol: token0.symbol,
          amount: newAmount0,
          decimals: token0.decimals,
        },
        token1: {
          symbol: token1.symbol,
          amount: newAmount1,
          decimals: token1.decimals,
        },
      });

      setAmount0(newAmount0);
      setAmount1(newAmount1);
    } catch (error) {
      console.error("Erreur lors du calcul des montants:", error);
      setAmount0("0");
      setAmount1("0");
      updateTransactionState("error");
    }
  };

  const handleAmount0Change = (value: string) => {
    console.debug(`[${instanceId}] Début handleAmount0Change:`, {
      enteredValue: value,
      currentAmount0: amount0,
      currentAmount1: amount1,
      token0: token0?.symbol,
      token1: token1?.symbol,
    });

    if (!value || value === "0") {
      console.debug("Réinitialisation des montants à 0");
      setAmount0("0");
      setAmount1("0");
      setPercentage(0);
      onPercentageChange(0);
      updateTransactionState("idle");
      return;
    }

    try {
      // Convertir la valeur entrée en BigNumber
      const valueBN = ethers.utils.parseUnits(value, token0.decimals);
      console.debug("Token0 - Valeur convertie en BigNumber:", {
        value,
        decimals: token0.decimals,
        valueBN: valueBN.toString(),
        valueFormatted: ethers.utils.formatUnits(valueBN, token0.decimals),
      });

      const reserve0BN = ethers.BigNumber.from(reserves.reserve0);
      // Convertir userShare en BigNumber avec toute la précision
      const userSharePrecise = ethers.utils.parseUnits(userShare, 18); // Utiliser 18 décimales pour la précision maximale
      console.debug("Token0 - Réserves et part utilisateur:", {
        reserve0: reserves.reserve0,
        reserve0Formatted: ethers.utils.formatUnits(
          reserve0BN,
          token0.decimals
        ),
        userShare,
        userSharePrecise: userSharePrecise.toString(),
        userShareFormatted: ethers.utils.formatUnits(userSharePrecise, 18),
      });

      // Calculer le montant maximum disponible en tenant compte de la précision
      const maxAmount = reserve0BN
        .mul(userSharePrecise)
        .div(ethers.utils.parseUnits("100", 18));
      console.debug("Token0 - Calcul du montant maximum:", {
        maxAmountWei: maxAmount.toString(),
        maxAmountFormatted: ethers.utils.formatUnits(
          maxAmount,
          token0.decimals
        ),
        calcul: `${reserve0BN.toString()} * ${userSharePrecise.toString()} / ${ethers.utils
          .parseUnits("100", 18)
          .toString()}`,
      });

      // Limiter la valeur au maximum disponible
      const limitedValue = valueBN.gt(maxAmount) ? maxAmount : valueBN;
      console.debug("Token0 - Limitation de la valeur:", {
        isLimited: valueBN.gt(maxAmount),
        valueBN: valueBN.toString(),
        maxAmount: maxAmount.toString(),
        limitedValue: limitedValue.toString(),
        limitedValueFormatted: ethers.utils.formatUnits(
          limitedValue,
          token0.decimals
        ),
      });

      // Calculer le pourcentage par rapport au maximum avec précision
      const percentageBN = limitedValue
        .mul(ethers.utils.parseUnits("100", 18))
        .div(maxAmount);
      const newPercentage = Number(ethers.utils.formatUnits(percentageBN, 18));
      console.debug("Token0 - Calcul du pourcentage:", {
        limitedValue: limitedValue.toString(),
        maxAmount: maxAmount.toString(),
        calcul: `(${limitedValue.toString()} * ${ethers.utils
          .parseUnits("100", 18)
          .toString()}) / ${maxAmount.toString()}`,
        percentageBN: percentageBN.toString(),
        percentageFormatted: ethers.utils.formatUnits(percentageBN, 18),
        newPercentage,
      });

      // Calculer le montant proportionnel pour token1
      const reserve1BN = ethers.BigNumber.from(reserves.reserve1);
      console.debug("Token1 - Réserves:", {
        reserve1: reserves.reserve1,
        reserve1Formatted: ethers.utils.formatUnits(
          reserve1BN,
          token1.decimals
        ),
        decimals: token1.decimals,
      });

      // Calculer d'abord le ratio exact avec précision maximale
      const amount1BN = reserve1BN
        .mul(userSharePrecise)
        .mul(percentageBN)
        .div(ethers.utils.parseUnits("100", 18))
        .div(ethers.utils.parseUnits("100", 18));

      console.debug("Token1 - Calcul du montant proportionnel:", {
        reserve1BN: reserve1BN.toString(),
        userSharePrecise: userSharePrecise.toString(),
        percentageBN: percentageBN.toString(),
        calcul: `(${reserve1BN.toString()} * ${userSharePrecise.toString()} * ${percentageBN.toString()}) / (${ethers.utils
          .parseUnits("100", 18)
          .toString()} * ${ethers.utils.parseUnits("100", 18).toString()})`,
        amount1BNWei: amount1BN.toString(),
        amount1Formatted: ethers.utils.formatUnits(amount1BN, token1.decimals),
      });

      // Si la valeur est limitée, utiliser la valeur limitée, sinon garder la valeur saisie
      const finalAmount0 = valueBN.gt(maxAmount)
        ? ethers.utils.formatUnits(maxAmount, token0.decimals)
        : value;

      console.debug("Valeurs finales:", {
        amount0: finalAmount0,
        amount1: ethers.utils.formatUnits(amount1BN, token1.decimals),
        percentage: newPercentage,
      });

      setAmount0(finalAmount0);
      setAmount1(ethers.utils.formatUnits(amount1BN, token1.decimals));
      setPercentage(newPercentage);
      onPercentageChange(newPercentage);
      updateTransactionState("idle");
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      setAmount0("0");
      setAmount1("0");
      setPercentage(0);
      onPercentageChange(0);
      updateTransactionState("error");
    }
  };

  const handleAmount1Change = (value: string) => {
    console.debug(`[${instanceId}] Début handleAmount1Change:`, {
      enteredValue: value,
      currentAmount0: amount0,
      currentAmount1: amount1,
      token0: token0?.symbol,
      token1: token1?.symbol,
    });

    if (!value || value === "0") {
      console.debug("Réinitialisation des montants à 0");
      setAmount0("0");
      setAmount1("0");
      setPercentage(0);
      onPercentageChange(0);
      updateTransactionState("idle");
      return;
    }

    try {
      // Convertir la valeur entrée en BigNumber
      const valueBN = ethers.utils.parseUnits(value, token1.decimals);
      console.debug("Token1 - Valeur convertie en BigNumber:", {
        value,
        decimals: token1.decimals,
        valueBN: valueBN.toString(),
        valueFormatted: ethers.utils.formatUnits(valueBN, token1.decimals),
      });

      const reserve1BN = ethers.BigNumber.from(reserves.reserve1);
      // Convertir userShare en BigNumber avec toute la précision
      const userSharePrecise = ethers.utils.parseUnits(userShare, 18); // Utiliser 18 décimales pour la précision maximale
      console.debug("Token1 - Réserves et part utilisateur:", {
        reserve1: reserves.reserve1,
        reserve1Formatted: ethers.utils.formatUnits(
          reserve1BN,
          token1.decimals
        ),
        userShare,
        userSharePrecise: userSharePrecise.toString(),
        userShareFormatted: ethers.utils.formatUnits(userSharePrecise, 18),
      });

      // Calculer le montant maximum disponible en tenant compte de la précision
      const maxAmount = reserve1BN
        .mul(userSharePrecise)
        .div(ethers.utils.parseUnits("100", 18));
      console.debug("Token1 - Calcul du montant maximum:", {
        maxAmountWei: maxAmount.toString(),
        maxAmountFormatted: ethers.utils.formatUnits(
          maxAmount,
          token1.decimals
        ),
        calcul: `${reserve1BN.toString()} * ${userSharePrecise.toString()} / ${ethers.utils
          .parseUnits("100", 18)
          .toString()}`,
      });

      // Limiter la valeur au maximum disponible
      const limitedValue = valueBN.gt(maxAmount) ? maxAmount : valueBN;
      console.debug("Token1 - Limitation de la valeur:", {
        isLimited: valueBN.gt(maxAmount),
        valueBN: valueBN.toString(),
        maxAmount: maxAmount.toString(),
        limitedValue: limitedValue.toString(),
        limitedValueFormatted: ethers.utils.formatUnits(
          limitedValue,
          token1.decimals
        ),
      });

      // Calculer le pourcentage par rapport au maximum avec précision
      const percentageBN = limitedValue
        .mul(ethers.utils.parseUnits("100", 18))
        .div(maxAmount);
      const newPercentage = Number(ethers.utils.formatUnits(percentageBN, 18));
      console.debug("Token1 - Calcul du pourcentage:", {
        limitedValue: limitedValue.toString(),
        maxAmount: maxAmount.toString(),
        calcul: `(${limitedValue.toString()} * ${ethers.utils
          .parseUnits("100", 18)
          .toString()}) / ${maxAmount.toString()}`,
        percentageBN: percentageBN.toString(),
        percentageFormatted: ethers.utils.formatUnits(percentageBN, 18),
        newPercentage,
      });

      // Calculer le montant proportionnel pour token0
      const reserve0BN = ethers.BigNumber.from(reserves.reserve0);
      console.debug("Token0 - Réserves:", {
        reserve0: reserves.reserve0,
        reserve0Formatted: ethers.utils.formatUnits(
          reserve0BN,
          token0.decimals
        ),
        decimals: token0.decimals,
      });

      // Calculer d'abord le ratio exact avec précision maximale
      const amount0BN = reserve0BN
        .mul(userSharePrecise)
        .mul(percentageBN)
        .div(ethers.utils.parseUnits("100", 18))
        .div(ethers.utils.parseUnits("100", 18));

      console.debug("Token0 - Calcul du montant proportionnel:", {
        reserve0BN: reserve0BN.toString(),
        userSharePrecise: userSharePrecise.toString(),
        percentageBN: percentageBN.toString(),
        calcul: `(${reserve0BN.toString()} * ${userSharePrecise.toString()} * ${percentageBN.toString()}) / (${ethers.utils
          .parseUnits("100", 18)
          .toString()} * ${ethers.utils.parseUnits("100", 18).toString()})`,
        amount0BNWei: amount0BN.toString(),
        amount0Formatted: ethers.utils.formatUnits(amount0BN, token0.decimals),
      });

      // Si la valeur est limitée, utiliser la valeur limitée, sinon garder la valeur saisie
      const finalAmount1 = valueBN.gt(maxAmount)
        ? ethers.utils.formatUnits(maxAmount, token1.decimals)
        : value;

      console.debug("Valeurs finales:", {
        amount0: ethers.utils.formatUnits(amount0BN, token0.decimals),
        amount1: finalAmount1,
        percentage: newPercentage,
      });

      setAmount1(finalAmount1);
      setAmount0(ethers.utils.formatUnits(amount0BN, token0.decimals));
      setPercentage(newPercentage);
      onPercentageChange(newPercentage);
      updateTransactionState("idle");
    } catch (error) {
      console.error("Erreur lors du calcul:", error);
      setAmount0("0");
      setAmount1("0");
      setPercentage(0);
      onPercentageChange(0);
      updateTransactionState("error");
    }
  };

  const formatReserve = (reserve: string, decimals: number) => {
    return Number(ethers.utils.formatUnits(reserve, decimals));
  };

  const reserve0Formatted = formatReserve(reserves.reserve0, token0.decimals);
  const reserve1Formatted = formatReserve(reserves.reserve1, token1.decimals);

  const price0Per1 = reserve1Formatted / reserve0Formatted;
  const price1Per0 = reserve0Formatted / reserve1Formatted;

  const formatAmount = (amount: number) => {
    return formatPercentage(amount);
  };

  const handleApprove = async () => {
    if (!provider || !account || !lpToken) return;

    const operationId = `approve-lp-${lpToken.symbol}-${Date.now()}`;
    setTransactionError(null);
    setTransactionState("waiting_wallet");

    try {
      const contract = new ethers.Contract(
        lpToken.address,
        ERC20_ABI,
        provider.getSigner()
      );

      // Calculer le montant exact de LP tokens à approuver
      const lpTokensBN = ethers.utils.parseUnits(lpTokens, lpToken.decimals);
      const percentageBN = ethers.utils.parseUnits(percentage.toString(), 18);
      const amountToApprove = lpTokensBN
        .mul(percentageBN)
        .div(ethers.utils.parseUnits("100", 18));

      console.debug("Montant à approuver:", {
        lpTokens,
        lpTokensBN: lpTokensBN.toString(),
        percentage,
        percentageBN: percentageBN.toString(),
        amountToApprove: amountToApprove.toString(),
        amountFormatted: ethers.utils.formatUnits(
          amountToApprove,
          lpToken.decimals
        ),
        calcul: `(${lpTokensBN.toString()} * ${percentageBN.toString()}) / ${ethers.utils
          .parseUnits("100", 18)
          .toString()}`,
      });

      // Vérifier l'allowance actuelle
      const currentAllowance = await contract.allowance(
        account,
        LEVINSWAP_CONFIG.ROUTER_ADDRESS
      );
      console.debug("Allowance actuelle:", {
        currentAllowance: currentAllowance.toString(),
        currentAllowanceFormatted: ethers.utils.formatUnits(
          currentAllowance,
          lpToken.decimals
        ),
      });

      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation en attente",
        message: `En attente de votre validation pour ${ethers.utils.formatUnits(
          amountToApprove,
          lpToken.decimals
        )} ${lpToken.symbol}`,
        color: "yellow",
        loading: true,
      });

      const tx = await contract.approve(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        amountToApprove
      );

      setTransactionState("pending");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Transaction envoyée",
        message: `Transaction d'approbation envoyée pour ${ethers.utils.formatUnits(
          amountToApprove,
          lpToken.decimals
        )} ${lpToken.symbol}`,
        color: "blue",
        loading: true,
      });

      const receipt = await tx.wait();
      console.debug("Transaction approuvée:", receipt);

      // Vérifier la nouvelle allowance
      const newAllowance = await contract.allowance(
        account,
        LEVINSWAP_CONFIG.ROUTER_ADDRESS
      );
      console.debug("Vérification finale post-approbation:", {
        newAllowance: newAllowance.toString(),
        amountToApprove: amountToApprove.toString(),
        isApproved: newAllowance.gte(amountToApprove),
      });

      if (newAllowance.lt(amountToApprove)) {
        throw new Error(
          "L'approbation n'a pas été effectuée avec le bon montant"
        );
      }

      setTransactionState("success");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation réussie",
        message: `L'approbation pour ${ethers.utils.formatUnits(
          amountToApprove,
          lpToken.decimals
        )} ${lpToken.symbol} a été confirmée`,
        color: "green",
      });

      // Forcer la mise à jour immédiate
      setTransactionState("idle");
      await updateTransactionState("idle");
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      const errorMessage =
        error.reason || error.message || "La transaction a échoué";
      setTransactionError(errorMessage);
      setTransactionState("idle");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur d'approbation",
        message: errorMessage,
        color: "red",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!provider || !account || !lpToken) return;

    const operationId = `withdraw-${lpToken.symbol}-${Date.now()}`;
    setTransactionError(null);
    setTransactionState("waiting_wallet");

    try {
      const router = new ethers.Contract(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        ROUTER_ABI,
        provider.getSigner()
      );

      console.debug("Valeurs avant conversion:", {
        amount0,
        amount1,
        token0Decimals: token0.decimals,
        token1Decimals: token1.decimals,
        lpTokens,
        percentage,
      });

      // 1. Convertir les montants en wei avec les bonnes décimales
      const amount0Wei = ethers.utils.parseUnits(amount0, token0.decimals);
      const amount1Wei = ethers.utils.parseUnits(amount1, token1.decimals);

      // Calculer le montant de LP tokens avec précision
      const lpTokensBN = ethers.utils.parseUnits(lpTokens, lpToken.decimals);
      const percentageBN = ethers.utils.parseUnits(percentage.toString(), 18);
      const lpAmountWei = lpTokensBN
        .mul(percentageBN)
        .div(ethers.utils.parseUnits("100", 18));

      console.debug("Montants convertis:", {
        amount0Wei: amount0Wei.toString(),
        amount1Wei: amount1Wei.toString(),
        lpTokensBN: lpTokensBN.toString(),
        percentageBN: percentageBN.toString(),
        lpAmountWei: lpAmountWei.toString(),
        calcul: `(${lpTokensBN.toString()} * ${percentageBN.toString()}) / ${ethers.utils
          .parseUnits("100", 18)
          .toString()}`,
      });

      // 2. Calculer les montants minimums (1% de slippage)
      const amount0Min = amount0Wei.mul(99).div(100);
      const amount1Min = amount1Wei.mul(99).div(100);

      console.debug("Paramètres de la transaction:", {
        token0Address: token0.address,
        token1Address: token1.address,
        lpAmountWei: lpAmountWei.toString(),
        amount0Min: amount0Min.toString(),
        amount1Min: amount1Min.toString(),
        amount0Wei: amount0Wei.toString(),
        amount1Wei: amount1Wei.toString(),
        formattedValues: {
          lpAmount: ethers.utils.formatUnits(lpAmountWei, lpToken.decimals),
          amount0: ethers.utils.formatUnits(amount0Wei, token0.decimals),
          amount1: ethers.utils.formatUnits(amount1Wei, token1.decimals),
          amount0Min: ethers.utils.formatUnits(amount0Min, token0.decimals),
          amount1Min: ethers.utils.formatUnits(amount1Min, token1.decimals),
        },
      });

      showOperationNotification(operationId, {
        id: operationId,
        title: "Retrait en attente",
        message: `En attente de votre validation pour retirer ${ethers.utils.formatUnits(
          amount0Wei,
          token0.decimals
        )} ${token0.symbol} et ${ethers.utils.formatUnits(
          amount1Wei,
          token1.decimals
        )} ${token1.symbol}`,
        color: "yellow",
        loading: true,
      });

      const tx = await router.removeLiquidity(
        token0.address,
        token1.address,
        lpAmountWei,
        amount0Min,
        amount1Min,
        account,
        Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes deadline
      );

      setTransactionState("pending");
      const txHash = tx.hash;
      const explorerUrl = `https://gnosisscan.io/tx/${txHash}`;

      showOperationNotification(operationId, {
        id: operationId,
        title: "Transaction envoyée",
        message: (
          <Text>
            Transaction de retrait envoyée pour{" "}
            {ethers.utils.formatUnits(amount0Wei, token0.decimals)}{" "}
            {token0.symbol} et{" "}
            {ethers.utils.formatUnits(amount1Wei, token1.decimals)}{" "}
            {token1.symbol}.{" "}
            <Anchor href={explorerUrl} target="_blank">
              Voir sur GnosisScan
            </Anchor>
          </Text>
        ),
        color: "blue",
        loading: true,
      });

      const receipt = await tx.wait();
      console.debug("Retrait confirmé:", receipt);

      showOperationNotification(operationId, {
        id: operationId,
        title: "Retrait réussi",
        message: (
          <Text>
            Le retrait a été confirmé.{" "}
            <Anchor href={explorerUrl} target="_blank">
              Voir sur GnosisScan
            </Anchor>
          </Text>
        ),
        color: "green",
      });

      // Réinitialiser les montants
      handlePercentageChange(0);
      setTransactionState("idle");

      // Informer le parent que le retrait est réussi
      if (onWithdrawSuccess) {
        onWithdrawSuccess();
      }
    } catch (error: any) {
      console.error("Erreur lors du retrait:", error);
      const errorMessage =
        error.reason || error.message || "La transaction a échoué";
      setTransactionError(errorMessage);
      setTransactionState("idle");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur de retrait",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Fonction pour obtenir le texte du bouton selon l'état
  const getButtonText = () => {
    switch (transactionState) {
      case "waiting_wallet":
        return "En attente de validation du Wallet...";
      case "pending":
        return "Transaction en cours de confirmation...";
      default:
        return buttonText;
    }
  };

  // Composant TokenInput avec contexte
  const TokenInput0 = useMemo(
    () => (
      <WithdrawTokenInput
        key={`${instanceId}-token0`}
        label="Token 1"
        value={amount0}
        token={token0}
        onChange={handleAmount0Change}
        loading={transactionState !== "idle"}
        onMaxClick={() => handlePercentageChange(100)}
      />
    ),
    [instanceId, amount0, token0, transactionState, handleAmount0Change]
  );

  const TokenInput1 = useMemo(
    () => (
      <WithdrawTokenInput
        key={`${instanceId}-token1`}
        label="Token 2"
        value={amount1}
        token={token1}
        onChange={handleAmount1Change}
        loading={transactionState !== "idle"}
        onMaxClick={() => handlePercentageChange(100)}
      />
    ),
    [instanceId, amount1, token1, transactionState, handleAmount1Change]
  );

  const percentageButtons = [
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "Max" },
  ];

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size="sm" c="dimmed">
          Mode
        </Text>
        <Switch
          size="lg"
          onLabel="Avancé"
          offLabel="Simple"
          checked={isAdvancedMode}
          onChange={(event) => setIsAdvancedMode(event.currentTarget.checked)}
          className={classes.modeSwitch}
          labelPosition="left"
          thumbIcon={null}
        />
      </div>

      <Card className={classes.positionCard}>
        <Group gap="xs" mb="sm">
          <IconCoins size={20} className={classes.positionIcon} />
          <Text fw={500}>Ma position</Text>
        </Group>

        <Group gap="xs" mb="xs">
          <img
            src={token0.logoURI}
            alt={token0.symbol}
            width={16}
            height={16}
          />
          <img
            src={token1.logoURI}
            alt={token1.symbol}
            width={16}
            height={16}
          />
          <Text size="sm">
            {token0.symbol}/{token1.symbol}
          </Text>
          <Text size="sm" c="dimmed" className={classes.lpAmount}>
            {lpTokens} ({formatPercentage(Number(userShare))}%)
          </Text>
        </Group>

        <div className={classes.tokenAmounts}>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <img
                src={token0.logoURI}
                alt={token0.symbol}
                width={16}
                height={16}
              />
              <Text size="sm">{token0.symbol}</Text>
            </Group>
            <Text size="sm">
              {formatAmount((reserve0Formatted * Number(userShare)) / 100)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Group gap="xs">
              <img
                src={token1.logoURI}
                alt={token1.symbol}
                width={16}
                height={16}
              />
              <Text size="sm">{token1.symbol}</Text>
            </Group>
            <Text size="sm">
              {formatAmount((reserve1Formatted * Number(userShare)) / 100)}
            </Text>
          </Group>
        </div>
      </Card>

      {!isAdvancedMode ? (
        <div className={classes.amountSection}>
          <Text size="sm" c="dimmed">
            Montant
          </Text>

          <Text className={classes.percentage}>{percentage.toFixed(2)}%</Text>

          <Slider
            className={classes.slider}
            value={percentage}
            onChange={handlePercentageChange}
            step={1}
            min={0}
            max={100}
            label={null}
            styles={{
              track: {
                backgroundColor: "rgba(162, 115, 149, 0.2)",
              },
              bar: {
                backgroundColor: "#cab0c2",
              },
              thumb: {
                borderColor: "#cab0c2",
                backgroundColor: "#cab0c2",
              },
            }}
          />

          <Group gap="xs" mt="sm">
            {percentageButtons.map((btn) => (
              <Button
                key={btn.value}
                variant="light"
                size="xs"
                className={classes.percentButton}
                onClick={() => handlePercentageChange(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </Group>

          <div className={classes.positionDetails}>
            <Text
              fw={700}
              size="md"
              c="dimmed"
              mb="sm"
              className={classes.withdrawTitle}
            >
              Montant retiré:
            </Text>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <img
                  src={token0.logoURI}
                  alt={token0.symbol}
                  width={16}
                  height={16}
                />
                <Text size="sm">{token0.symbol}</Text>
              </Group>
              <Text size="sm">
                {formatAmount(
                  (reserve0Formatted * Number(userShare) * percentage) / 10000
                )}
              </Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <img
                  src={token1.logoURI}
                  alt={token1.symbol}
                  width={16}
                  height={16}
                />
                <Text size="sm">{token1.symbol}</Text>
              </Group>
              <Text size="sm">
                {formatAmount(
                  (reserve1Formatted * Number(userShare) * percentage) / 10000
                )}
              </Text>
            </Group>
          </div>
        </div>
      ) : (
        <>
          {TokenInput0}
          <Text
            size="xl"
            fw={700}
            ta="center"
            c="dimmed"
            my={1}
            style={{ userSelect: "none", lineHeight: 0.1 }}
          >
            +
          </Text>
          {TokenInput1}
        </>
      )}

      <Button
        fullWidth
        size="lg"
        color={isApproval ? "pink.5" : "violet.6"}
        disabled={!isValid || transactionState !== "idle"}
        loading={transactionState !== "idle"}
        onClick={isApproval ? handleApprove : handleWithdraw}
      >
        {getButtonText()}
      </Button>

      {(errorMessage || transactionError) && (
        <Text size="sm" ta="center" c={warningStyle ? "pink.4" : "red"} mt="xs">
          {transactionError || errorMessage}
        </Text>
      )}
    </div>
  );
}
