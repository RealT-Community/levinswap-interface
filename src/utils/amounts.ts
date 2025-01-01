import { Token } from "@/store/tokenLists";
import { ethers } from "ethers";

interface ValidationResult {
  isValid: boolean;
  error?: string;
  buttonText: string;
}

/**
 * Constantes pour les messages d'erreur et textes des boutons
 */
const MESSAGES = {
  SELECT_TOKENS: "Sélectionnez les tokens",
  ENTER_AMOUNTS: "Entrer les montants",
  INVALID_AMOUNT: "Montant saisi incorrect",
  APPROVE: "Approuver",
  TRANSFER_BLOCKED: "Transfer Bloqué",
  CONNECT_WALLET: "Connectez votre portefeuille",
  ADD_LIQUIDITY: "Ajouter de la liquidité",
  CREATE_POOL: "Créer la pool",
  AMOUNT_REQUIRED: "Montant requis > 0",
} as const;

/**
 * Convertit une chaîne en BigNumber avec gestion des erreurs
 * En tenant compte des décimales du token
 */
export const parseToBigNumber = (
  value: string | undefined,
  decimals: number = 18
): ethers.BigNumber | null => {
  if (!value) return ethers.BigNumber.from(0);
  try {
    // Utiliser parseUnits au lieu de from pour gérer les décimales
    return ethers.utils.parseUnits(value, decimals);
  } catch (error) {
    console.error("Erreur de conversion en BigNumber:", error);
    return null;
  }
};

/**
 * Convertit une valeur décimale en wei
 */
export const parseToWei = (
  value: string | undefined,
  decimals: number
): ethers.BigNumber | null => {
  if (!value) return ethers.BigNumber.from(0);
  try {
    const cleanValue = value.trim();
    return ethers.utils.parseUnits(cleanValue, decimals);
  } catch (error) {
    console.error("Erreur de conversion en wei:", error);
    return null;
  }
};

/**
 * Convertit une valeur wei en décimal
 */
export const formatFromWei = (
  value: ethers.BigNumber | string,
  decimals: number
): string => {
  try {
    const bigNumberValue =
      typeof value === "string" ? ethers.BigNumber.from(value) : value;
    return ethers.utils.formatUnits(bigNumberValue, decimals);
  } catch (error) {
    console.error("Erreur de formatage depuis wei:", error);
    return "0";
  }
};

/**
 * Vérifie si un montant est effectivement zéro
 */
const isZeroAmount = (amount: string | undefined): boolean => {
  if (!amount || amount.trim() === "") return true;
  try {
    const amountWei = ethers.utils.parseUnits(amount.trim(), 18);
    return amountWei.isZero();
  } catch {
    return true;
  }
};

/**
 * Génère un message d'erreur pour les montants nuls
 */
const generateZeroAmountError = (
  token0: Token | undefined,
  token1: Token | undefined
): string => {
  const errors = [];
  if (token0) errors.push(`${token0.symbol}: ${MESSAGES.AMOUNT_REQUIRED}`);
  if (token1) errors.push(`${token1.symbol}: ${MESSAGES.AMOUNT_REQUIRED}`);
  return errors.join(" et ");
};

/**
 * Vérifie la validité d'un montant par rapport à une balance
 */
const validateTokenAmount = (
  amount: string | undefined,
  token: Token | undefined,
  balance: string | undefined
): { isValid: boolean; error?: string } => {
  // Si pas de token, c'est invalide
  if (!token) {
    return { isValid: false };
  }

  // Si pas de montant, c'est invalide
  if (!amount || amount.trim() === "") {
    return { isValid: false };
  }

  try {
    // Conversion du montant en wei
    const amountWei = parseToWei(amount, token.decimals);
    if (!amountWei) {
      return {
        isValid: false,
        error: `Format invalide pour ${token.symbol}`,
      };
    }

    // Si pas de balance, on ne peut pas valider
    if (!balance || balance.trim() === "") {
      return {
        isValid: false,
        error: `Impossible de lire la balance de ${token.symbol}`,
      };
    }

    // Conversion de la balance en wei
    const balanceWei = parseToBigNumber(balance, token.decimals);
    if (!balanceWei) {
      return {
        isValid: false,
        error: `Impossible de lire la balance de ${token.symbol}`,
      };
    }

    // Vérification de la balance
    if (amountWei.gt(balanceWei)) {
      const formattedBalance = formatFromWei(balanceWei, token.decimals);
      return {
        isValid: false,
        error: `${token.symbol}: ${formattedBalance} disponible`,
      };
    }

    // Si tout est OK, pas de message
    return { isValid: true };
  } catch (error) {
    console.error("Erreur de validation:", error);
    return {
      isValid: false,
      error: `Erreur de lecture de la balance de ${token.symbol}`,
    };
  }
};

/**
 * Validation des montants pour l'ajout de liquidité
 */
export const validateLiquidityAmounts = (
  amount0: string | undefined,
  token0: Token | undefined,
  balance0: string | undefined,
  amount1: string | undefined,
  token1: Token | undefined,
  balance1: string | undefined,
  poolExists: boolean
): ValidationResult => {
  // Étape 1: Vérification des tokens
  if (!token0 || !token1) {
    return {
      isValid: false,
      buttonText: MESSAGES.SELECT_TOKENS,
    };
  }

  // Étape 2: Vérification des montants non-nuls
  const isZero0 = isZeroAmount(amount0);
  const isZero1 = isZeroAmount(amount1);
  if (isZero0 || isZero1) {
    return {
      isValid: false,
      buttonText: MESSAGES.ENTER_AMOUNTS,
      error: generateZeroAmountError(token0, token1),
    };
  }

  // Étape 3: Validation des montants vs balances
  const validation0 = validateTokenAmount(amount0, token0, balance0);
  const validation1 = validateTokenAmount(amount1, token1, balance1);

  // Si l'une des validations a échoué
  if (!validation0.isValid || !validation1.isValid) {
    const errors: string[] = [];
    if (!validation0.isValid && validation0.error)
      errors.push(validation0.error);
    if (!validation1.isValid && validation1.error)
      errors.push(validation1.error);

    return {
      isValid: false,
      buttonText: MESSAGES.INVALID_AMOUNT,
      error: errors.join(" et "),
    };
  }

  // Si tout est valide, on ne met PAS de message d'erreur
  return {
    isValid: true,
    buttonText: poolExists ? MESSAGES.ADD_LIQUIDITY : MESSAGES.CREATE_POOL,
  };
};

/**
 * Validation complète de l'opération de liquidité
 */
export const validateLiquidityOperation = async (
  amount0: string | undefined,
  token0: Token | undefined,
  balance0: string | undefined,
  amount1: string | undefined,
  token1: Token | undefined,
  balance1: string | undefined,
  poolExists: boolean,
  provider: ethers.providers.Provider | undefined,
  account: string | undefined,
  routerAddress: string,
  checkAllowance: (token: Token, amount: string) => Promise<boolean>,
  checkCanTransfer: (
    token: Token,
    amount: string
  ) => Promise<[boolean, string?]>,
  isRealToken: (token: Token) => boolean
): Promise<ValidationResult> => {
  // Étape 1-3: Validation des montants
  const amountsValidation = validateLiquidityAmounts(
    amount0,
    token0,
    balance0,
    amount1,
    token1,
    balance1,
    poolExists
  );

  if (!amountsValidation.isValid) {
    return amountsValidation;
  }

  // Vérification du wallet connecté
  if (!provider || !account) {
    return {
      isValid: false,
      buttonText: MESSAGES.CONNECT_WALLET,
    };
  }

  // Étape 4: Vérification des allowances
  const isNativeToken = (address: string) =>
    address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

  if (token0 && amount0 && !isNativeToken(token0.address)) {
    const hasAllowance0 = await checkAllowance(token0, amount0);
    if (!hasAllowance0) {
      return {
        isValid: true,
        buttonText: MESSAGES.APPROVE,
        error: `Approbation requise pour ${token0.symbol}`,
      };
    }
  }

  if (token1 && amount1 && !isNativeToken(token1.address)) {
    const hasAllowance1 = await checkAllowance(token1, amount1);
    if (!hasAllowance1) {
      return {
        isValid: true,
        buttonText: MESSAGES.APPROVE,
        error: `Approbation requise pour ${token1.symbol}`,
      };
    }
  }

  // Étape 5: Vérification des RealTokens
  if (token0 && amount0 && isRealToken(token0)) {
    const [canTransfer0, error0] = await checkCanTransfer(token0, amount0);
    if (!canTransfer0) {
      return {
        isValid: false,
        buttonText: MESSAGES.TRANSFER_BLOCKED,
        error: error0 || `Le transfer de ${token0.symbol} est bloqué`,
      };
    }
  }

  if (token1 && amount1 && isRealToken(token1)) {
    const [canTransfer1, error1] = await checkCanTransfer(token1, amount1);
    if (!canTransfer1) {
      return {
        isValid: false,
        buttonText: MESSAGES.TRANSFER_BLOCKED,
        error: error1 || `Le transfer de ${token1.symbol} est bloqué`,
      };
    }
  }

  // Étape 6: Tout est valide, pas de message d'erreur
  return {
    isValid: true,
    buttonText: poolExists ? MESSAGES.ADD_LIQUIDITY : MESSAGES.CREATE_POOL,
  };
};
