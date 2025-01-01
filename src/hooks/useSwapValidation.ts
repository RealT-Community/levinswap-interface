import { NATIVE_TOKEN } from "@/config/constants";
import { Token } from "@/store/tokenLists";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useWeb3 } from "./useWeb3";

const REALT_TOKEN_LIST_URL = "https://api.realtoken.community/v1/tokenList";
const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function canTransfer(address _from, address _to, uint256 _amount) view returns (bool, uint256, uint256)",
];

interface SwapValidationState {
  isValid: boolean;
  buttonText: string;
  errorMessage?: string;
  isApproval?: boolean;
  warningStyle?: boolean;
}

// Fonction pour vérifier si c'est le token natif
const isNativeToken = (token: Token) => {
  return (
    token.address.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
  );
};

// Vérifier l'allowance
export const checkAllowance = async (
  provider: ethers.providers.Provider | undefined,
  account: string | undefined,
  token: Token,
  amount: string,
  routerAddress: string
): Promise<boolean> => {
  if (!provider || !account) return false;
  if (isNativeToken(token)) return true;

  try {
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const allowance = await contract.allowance(account, routerAddress);
    const amountBN = ethers.utils.parseUnits(amount, token.decimals);
    return allowance.gte(amountBN);
  } catch (error) {
    console.error("Erreur lors de la vérification de l'allowance:", error);
    return false;
  }
};

export function useSwapValidation(
  fromToken: Token | undefined,
  toToken: Token | undefined,
  fromAmount: string,
  toAmount: string,
  fromBalance: string,
  routerAddress: string
) {
  const { provider, account } = useWeb3();
  const [validationState, setValidationState] = useState<SwapValidationState>({
    isValid: false,
    buttonText: "Connectez votre portefeuille",
  });
  const [realTokenList, setRealTokenList] = useState<Token[]>([]);

  // Charger la liste des RealTokens
  useEffect(() => {
    const fetchRealTokenList = async () => {
      try {
        const response = await fetch(REALT_TOKEN_LIST_URL);
        const data = await response.json();
        // Filtrer pour ne garder que les tokens sur Gnosis Chain (chainId: 100)
        const gnosisTokens = data.tokens.filter(
          (token: Token) => token.chainId === 100
        );
        setRealTokenList(gnosisTokens);
        console.debug(
          "Liste des RealTokens chargée:",
          gnosisTokens.length,
          "tokens"
        );
      } catch (error) {
        console.error(
          "Erreur lors du chargement de la liste RealToken:",
          error
        );
        setRealTokenList([]);
      }
    };

    fetchRealTokenList();
  }, []);

  // Vérifier si un token est un RealToken
  const isRealToken = useCallback(
    (token: Token) => {
      const isReal = realTokenList.some(
        (t) => t.address.toLowerCase() === token.address.toLowerCase()
      );
      console.debug("isRealToken check:", token.symbol, isReal);
      return isReal;
    },
    [realTokenList]
  );

  // Vérifier l'allowance
  const checkTokenAllowance = useCallback(
    async (token: Token, amount: string): Promise<boolean> => {
      return checkAllowance(provider, account, token, amount, routerAddress);
    },
    [provider, account, routerAddress]
  );

  // Vérifier canTransfer pour les RealTokens
  const checkCanTransfer = useCallback(
    async (token: Token, amount: string): Promise<[boolean, string?]> => {
      if (!provider || !account || !isRealToken(token)) {
        console.debug("Pas besoin de vérifier canTransfer:", {
          hasProvider: !!provider,
          hasAccount: !!account,
          isRealToken: isRealToken(token),
        });
        return [true, undefined];
      }

      try {
        console.debug("Vérification canTransfer pour:", token.symbol);
        const contract = new ethers.Contract(
          token.address,
          ERC20_ABI,
          provider
        );
        const amountBN = ethers.utils.parseUnits(amount, token.decimals);
        const [isValid, ruleId, reason] = await contract.canTransfer(
          account,
          routerAddress,
          amountBN
        );
        console.debug("Résultat canTransfer:", {
          isValid,
          ruleId: ruleId.toString(),
          reason: reason.toString(),
          account,
          routerAddress,
          amount: amountBN.toString(),
        });

        if (!isValid) {
          return [
            false,
            `Règle #${ruleId.toString()} - Code ${reason.toString()}`,
          ];
        }
        return [true, undefined];
      } catch (error: any) {
        console.error("Erreur lors de la vérification de canTransfer:", error);
        // Extraire le message d'erreur
        let errorMessage = "Raison inconnue";
        if (error.reason) {
          errorMessage = error.reason;
        } else if (error.message) {
          errorMessage = error.message.split("(")[0].trim();
        }
        return [false, errorMessage];
      }
    },
    [provider, account, routerAddress, isRealToken]
  );

  // Vérifier le gas natif disponible
  const checkNativeBalance = useCallback(async (): Promise<boolean> => {
    if (!provider || !account) return false;
    try {
      const balance = await provider.getBalance(account);
      return balance.gt(ethers.utils.parseEther("0.01"));
    } catch (error) {
      console.error("Erreur lors de la vérification du gas:", error);
      return false;
    }
  }, [provider, account]);

  // Fonction pour mettre à jour l'état pendant la transaction
  const updateTransactionState = useCallback(
    (state: {
      buttonText?: string;
      isValid?: boolean;
      errorMessage?: string;
      warningStyle?: boolean;
      isApproval?: boolean;
    }) => {
      setValidationState((prev) => ({
        ...prev,
        ...state,
      }));
    },
    []
  );

  // Effet principal de validation
  useEffect(() => {
    const validateSwap = async () => {
      if (!account) {
        setValidationState({
          isValid: false,
          buttonText: "Connectez votre portefeuille",
        });
        return;
      }

      if (!fromToken || !toToken) {
        setValidationState({
          isValid: false,
          buttonText: "Sélectionnez les tokens",
        });
        return;
      }

      const fromAmountNum = new BigNumber(fromAmount || "0");
      const toAmountNum = new BigNumber(toAmount || "0");
      if (fromAmountNum.isZero() || toAmountNum.isZero()) {
        setValidationState({
          isValid: false,
          buttonText: "Entrez un montant",
        });
        return;
      }

      const fromBalanceNum = new BigNumber(fromBalance || "0");
      if (fromAmountNum.gt(fromBalanceNum)) {
        setValidationState({
          isValid: false,
          buttonText: "Solde insuffisant",
          errorMessage: `Solde ${fromToken.symbol} insuffisant`,
        });
        return;
      }

      if (isNativeToken(fromToken)) {
        const gasBuffer = ethers.utils.parseEther("0.01");
        const totalNeeded = ethers.utils
          .parseUnits(fromAmount, NATIVE_TOKEN.DECIMALS)
          .add(gasBuffer);
        const currentBalance = await provider?.getBalance(account);

        if (currentBalance && totalNeeded.gt(currentBalance)) {
          setValidationState({
            isValid: false,
            buttonText: "Solde insuffisant",
            errorMessage: `Gardez au moins 0.01 ${NATIVE_TOKEN.SYMBOL} pour le gas`,
          });
          return;
        }
      } else {
        const hasAllowance = await checkTokenAllowance(fromToken, fromAmount);
        if (!hasAllowance) {
          setValidationState({
            isValid: true,
            buttonText: "Approuver",
            errorMessage: `Approbation requise pour ${fromToken.symbol} afin de réaliser le transfer`,
            isApproval: true,
            warningStyle: true,
          });
          return;
        }
      }

      const hasGas = await checkNativeBalance();
      if (!hasGas) {
        setValidationState({
          isValid: false,
          buttonText: "Gas insuffisant",
          errorMessage: `Solde ${NATIVE_TOKEN.SYMBOL} insuffisant pour le gas`,
        });
        return;
      }

      // Vérifier canTransfer pour les RealTokens (from et to)
      if (isRealToken(fromToken)) {
        console.debug(
          "Vérification canTransfer pour RealToken (from):",
          fromToken.symbol
        );
        const [canTransferFrom, errorReason] = await checkCanTransfer(
          fromToken,
          fromAmount
        );
        if (!canTransferFrom) {
          setValidationState({
            isValid: false,
            buttonText: "Transfer échoue",
            errorMessage: `Le transfer de ${fromToken.symbol} échoue${
              errorReason ? ` : ${errorReason}` : ""
            }`,
          });
          return;
        }
      }

      if (isRealToken(toToken)) {
        console.debug(
          "Vérification canTransfer pour RealToken (to):",
          toToken.symbol
        );
        const [canTransferTo, errorReason] = await checkCanTransfer(
          toToken,
          toAmount
        );
        if (!canTransferTo) {
          setValidationState({
            isValid: false,
            buttonText: "Transfer échoue",
            errorMessage: `Le transfer de ${toToken.symbol} échoue${
              errorReason ? ` : ${errorReason}` : ""
            }`,
          });
          return;
        }
      }

      setValidationState({
        isValid: true,
        buttonText: "Swap",
      });
    };

    validateSwap();
  }, [
    account,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    fromBalance,
    checkTokenAllowance,
    checkCanTransfer,
    checkNativeBalance,
    isRealToken,
    provider,
  ]);

  return {
    ...validationState,
    updateTransactionState,
  };
}
