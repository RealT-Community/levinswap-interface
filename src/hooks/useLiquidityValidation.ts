"use client";

import { ethers } from "ethers";

interface ValidationState {
  isValid: boolean;
  buttonText: string;
  error?: string;
  isApproval: boolean;
  tokenToApprove?: any;
}

export async function useLiquidityValidation(
  fromAmount: string,
  fromToken: any,
  fromBalance: string,
  toAmount: string,
  toToken: any,
  toBalance: string,
  hasReserves: boolean,
  provider: any,
  account: string | undefined,
  routerAddress: string
) {
  if (!account) {
    return {
      isValid: false,
      buttonText: "Connectez votre portefeuille",
      error: "Veuillez connecter votre portefeuille",
      isApproval: false,
      tokenToApprove: undefined,
    };
  }

  if (!fromToken || !toToken) {
    return {
      isValid: false,
      buttonText: "Sélectionnez les tokens",
      error: "Veuillez sélectionner les deux tokens",
      isApproval: false,
      tokenToApprove: undefined,
    };
  }

  try {
    // Convertir les montants en BigNumber pour la comparaison
    const fromAmountBN = ethers.utils.parseUnits(
      fromAmount || "0",
      fromToken.decimals
    );
    const toAmountBN = ethers.utils.parseUnits(
      toAmount || "0",
      toToken.decimals
    );
    const fromBalanceBN = ethers.utils.parseUnits(
      ethers.utils.formatUnits(fromBalance || "0", fromToken.decimals),
      fromToken.decimals
    );
    const toBalanceBN = ethers.utils.parseUnits(
      ethers.utils.formatUnits(toBalance || "0", toToken.decimals),
      toToken.decimals
    );

    // Vérifier si les montants sont valides (non nuls et non négatifs)
    if (fromAmountBN.lte(0) || toAmountBN.lte(0)) {
      return {
        isValid: false,
        buttonText: "Entrez un montant",
        error: "Les montants doivent être supérieurs à 0",
        isApproval: false,
        tokenToApprove: undefined,
      };
    }

    // Vérifier si les montants ne dépassent pas les balances
    if (fromAmountBN.gt(fromBalanceBN)) {
      return {
        isValid: false,
        buttonText: "Montant insuffisant",
        error: `Solde ${fromToken.symbol} insuffisant`,
        isApproval: false,
        tokenToApprove: undefined,
      };
    }

    if (toAmountBN.gt(toBalanceBN)) {
      return {
        isValid: false,
        buttonText: "Montant insuffisant",
        error: `Solde ${toToken.symbol} insuffisant`,
        isApproval: false,
        tokenToApprove: undefined,
      };
    }

    // Vérifier l'approbation pour les deux tokens
    const fromContract = new ethers.Contract(
      fromToken.address,
      [
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      provider
    );

    const toContract = new ethers.Contract(
      toToken.address,
      [
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      provider
    );

    const [fromAllowance, toAllowance] = await Promise.all([
      fromContract.allowance(account, routerAddress),
      toContract.allowance(account, routerAddress),
    ]);

    const needsFromApproval = fromAmountBN.gt(fromAllowance);
    const needsToApproval = toAmountBN.gt(toAllowance);

    if (needsFromApproval) {
      return {
        isValid: true,
        buttonText: "Approuver",
        error: `Approbation requise pour ${fromToken.symbol}`,
        isApproval: true,
        tokenToApprove: fromToken,
      };
    }

    if (needsToApproval) {
      return {
        isValid: true,
        buttonText: "Approuver",
        error: `Approbation requise pour ${toToken.symbol}`,
        isApproval: true,
        tokenToApprove: toToken,
      };
    }

    return {
      isValid: true,
      buttonText: "Ajouter de la liquidité",
      error: "",
      isApproval: false,
      tokenToApprove: undefined,
    };
  } catch (error) {
    console.error("Erreur de validation:", error);
    return {
      isValid: false,
      buttonText: "Montant invalide",
      error: "Format de montant invalide",
      isApproval: false,
      tokenToApprove: undefined,
    };
  }
}
