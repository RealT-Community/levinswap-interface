import { REALT_TOKEN_LIST_URL } from "@/config/constants";
import { Token } from "@/store/tokenLists";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useWeb3Store } from "./useWeb3Store";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function canTransfer(address _from, address _to, uint256 _amount) view returns (bool, uint256, uint256)",
];

interface ValidationState {
  isValid: boolean;
  buttonText: string;
  errorMessage: string;
  isApproval?: boolean;
  warningStyle?: boolean;
}

type TransactionState =
  | "idle"
  | "waiting_wallet"
  | "pending"
  | "success"
  | "error";

export function useWithdrawValidation(
  token0: Token,
  token1: Token,
  lpToken: Token,
  percentage: number,
  routerAddress: string,
  lpTokens: string
) {
  const { provider, account } = useWeb3Store();
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    buttonText: "Entrez un montant",
    errorMessage: "",
    isApproval: false,
    warningStyle: false,
  });
  const [transactionState, setTransactionState] =
    useState<TransactionState>("idle");
  const [shouldCheckAllowance, setShouldCheckAllowance] = useState(0);
  const [realTokenList, setRealTokenList] = useState<Token[]>([]);

  // Charger la liste des RealTokens
  useEffect(() => {
    const fetchRealTokenList = async () => {
      try {
        const response = await fetch(REALT_TOKEN_LIST_URL);
        const data = await response.json();
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

  // Vérifier si c'est un RealToken
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

  // Vérifier si le token peut être transféré (pour les RealTokens)
  const checkCanTransfer = useCallback(
    async (token: Token, amount: string): Promise<[boolean, string?]> => {
      if (!provider || !account || !isRealToken(token)) {
        return [true, undefined];
      }

      try {
        const contract = new ethers.Contract(
          token.address,
          ERC20_ABI,
          provider
        );
        const amountBN = ethers.utils.parseUnits(amount, token.decimals);

        // Vérifier si le routeur peut transférer au compte
        const [isValidRouter, ruleIdRouter, reasonRouter] =
          await contract.canTransfer(routerAddress, account, amountBN);

        if (!isValidRouter) {
          return [
            false,
            `Transfert non autorisé vers votre compte - Règle #${ruleIdRouter} - Code ${reasonRouter}`,
          ];
        }

        // Vérifier si le compte peut transférer au routeur
        const [isValidAccount, ruleIdAccount, reasonAccount] =
          await contract.canTransfer(account, routerAddress, amountBN);

        if (!isValidAccount) {
          return [
            false,
            `Transfert non autorisé vers le routeur - Règle #${ruleIdAccount} - Code ${reasonAccount}`,
          ];
        }

        return [true, undefined];
      } catch (error: any) {
        console.error("Erreur lors de la vérification de canTransfer:", error);
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

  const checkLPTokenAllowance = useCallback(async () => {
    if (!provider || !account || !lpToken.address || !routerAddress) {
      console.debug("Données manquantes pour vérifier l'allowance:", {
        provider: !!provider,
        account,
        lpTokenAddress: lpToken.address,
        routerAddress,
      });
      return ethers.constants.Zero;
    }

    try {
      const lpContract = new ethers.Contract(
        lpToken.address,
        ERC20_ABI,
        provider
      );
      const allowance = await lpContract.allowance(account, routerAddress);
      console.debug("Allowance LP récupérée:", {
        allowance: allowance.toString(),
        lpToken: lpToken.symbol,
      });
      return allowance;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'allowance LP:", error);
      return ethers.constants.Zero;
    }
  }, [provider, account, lpToken.address, routerAddress]);

  useEffect(() => {
    const validateWithdraw = async () => {
      try {
        if (!provider || !account) {
          setValidationState({
            isValid: false,
            buttonText: "Connectez votre wallet",
            errorMessage: "",
            warningStyle: false,
          });
          return;
        }

        if (percentage === 0) {
          setValidationState({
            isValid: false,
            buttonText: "Entrez un montant",
            errorMessage: "",
            warningStyle: false,
          });
          return;
        }

        // Vérifier les transferts pour les RealTokens
        const amount0 = ((Number(lpTokens) * percentage) / 100).toFixed(
          token0.decimals
        );
        const amount1 = ((Number(lpTokens) * percentage) / 100).toFixed(
          token1.decimals
        );

        const [canTransfer0, error0] = await checkCanTransfer(token0, amount0);
        if (!canTransfer0) {
          setValidationState({
            isValid: false,
            buttonText: "Transfert non autorisé",
            errorMessage:
              error0 || "Transfert non autorisé pour " + token0.symbol,
            warningStyle: true,
          });
          return;
        }

        const [canTransfer1, error1] = await checkCanTransfer(token1, amount1);
        if (!canTransfer1) {
          setValidationState({
            isValid: false,
            buttonText: "Transfert non autorisé",
            errorMessage:
              error1 || "Transfert non autorisé pour " + token1.symbol,
            warningStyle: true,
          });
          return;
        }

        // Vérifier l'allowance LP
        const lpAllowance = await checkLPTokenAllowance();
        const lpTokenAmount = ethers.utils.parseUnits(
          ((Number(lpTokens) * percentage) / 100).toFixed(lpToken.decimals),
          lpToken.decimals
        );

        if (lpAllowance.lt(lpTokenAmount)) {
          const formattedAmount = ethers.utils.formatUnits(
            lpTokenAmount,
            lpToken.decimals
          );
          setValidationState({
            isValid: true,
            buttonText: "Approuver LP",
            errorMessage: `Approbation requise pour ${formattedAmount} ${lpToken.symbol}`,
            isApproval: true,
            warningStyle: true,
          });
          return;
        }

        setValidationState({
          isValid: true,
          buttonText: "Retirer",
          errorMessage: "",
          isApproval: false,
          warningStyle: false,
        });
      } catch (error) {
        console.error("Erreur lors de la validation:", error);
        setValidationState({
          isValid: false,
          buttonText: "Erreur de validation",
          errorMessage: "Une erreur est survenue lors de la validation",
          warningStyle: true,
        });
      }
    };

    validateWithdraw();
  }, [
    provider,
    account,
    percentage,
    lpTokens,
    lpToken,
    token0,
    token1,
    checkLPTokenAllowance,
    checkCanTransfer,
  ]);

  const updateTransactionState = useCallback((newState: TransactionState) => {
    setTransactionState(newState);
    if (newState === "idle") {
      setShouldCheckAllowance((prev) => prev + 1);
    }
  }, []);

  // Effet pour vérifier l'allowance
  useEffect(() => {
    const checkAllowance = async () => {
      if (!provider || !account || !lpToken || percentage === 0) return;

      try {
        const contract = new ethers.Contract(
          lpToken.address,
          ERC20_ABI,
          provider
        );
        const lpTokensBN = ethers.utils.parseUnits(lpTokens, lpToken.decimals);
        const percentageBN = ethers.utils.parseUnits(percentage.toString(), 18);
        const requiredAmount = lpTokensBN
          .mul(percentageBN)
          .div(ethers.utils.parseUnits("100", 18));

        const allowance = await contract.allowance(account, routerAddress);
        console.debug("Vérification allowance:", {
          allowance: allowance.toString(),
          requiredAmount: requiredAmount.toString(),
          isApproved: allowance.gte(requiredAmount),
        });

        if (allowance.lt(requiredAmount)) {
          setValidationState((prev) => ({
            ...prev,
            isValid: true,
            buttonText: "Approuver LP",
            errorMessage: `Approbation requise pour ${lpToken.symbol}`,
            isApproval: true,
            warningStyle: true,
          }));
        } else {
          setValidationState((prev) => ({
            ...prev,
            isValid: true,
            buttonText: "Retirer la liquidité",
            errorMessage: "",
            isApproval: false,
            warningStyle: false,
          }));
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'allowance:", error);
      }
    };

    checkAllowance();
  }, [
    provider,
    account,
    lpToken,
    lpTokens,
    percentage,
    routerAddress,
    shouldCheckAllowance,
  ]);

  return {
    ...validationState,
    transactionState,
    updateTransactionState,
  };
}
