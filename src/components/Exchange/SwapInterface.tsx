"use client";

import { Button } from "@/components/Button/Button";
import { LEVINSWAP_CONFIG, NATIVE_TOKEN } from "@/config/constants";
import { usePairPrice } from "@/hooks/usePairPrice";
import { checkAllowance, useSwapValidation } from "@/hooks/useSwapValidation";
import { useTokenLists } from "@/hooks/useTokenLists";
import { useWeb3 } from "@/hooks/useWeb3";
import { selectedTokensAtom } from "@/store/selectedTokens";
import { swapSettingsAtom } from "@/store/swapSettings";
import { Token } from "@/store/tokenLists";
import { computeTradeDetails } from "@/utils/prices";
import { getTokenBalance } from "@/utils/tokenUtils";
import { Anchor, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowDown, IconInfoCircle } from "@tabler/icons-react";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import classes from "./SwapInterface.module.css";
import { CustomRoute, SwapRoute } from "./SwapRoute";
import { TokenInput } from "./TokenInput";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];

const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
];

// Fonction pour vérifier si c'est le token natif
const isNativeToken = (token: Token) => {
  return (
    token.address.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
  );
};

const NOTIFICATION_LIMIT = 5;

interface OperationNotification {
  id: string;
  title: string;
  message: string | React.ReactNode;
  color: string;
  loading?: boolean;
}

const showOperationNotification = (
  operationId: string,
  notification: OperationNotification
) => {
  // Fermer la notification précédente de cette opération
  notifications.hide(operationId);

  // Créer la nouvelle notification
  notifications.show({
    ...notification,
    id: operationId,
    autoClose: notification.loading ? false : 60000,
    withCloseButton: !notification.loading,
  });
};

export function SwapInterface() {
  const { lists } = useTokenLists();
  const { chainId, account, provider } = useWeb3();
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const [settings] = useAtom(swapSettingsAtom);
  const { calculatePrice, currentRoute, getBestRoute } = usePairPrice();

  // États locaux pour les tokens et montants
  const [fromToken, setFromToken] = useState<Token | undefined>(
    chainId ? selectedTokens[chainId]?.fromToken : undefined
  );
  const [toToken, setToToken] = useState<Token | undefined>(
    chainId ? selectedTokens[chainId]?.toToken : undefined
  );
  const [fromAmount, setFromAmount] = useState("0.0");
  const [toAmount, setToAmount] = useState("0.0");
  const [fromBalance, setFromBalance] = useState("0.0");
  const [toBalance, setToBalance] = useState("0.0");

  const [userInput, setUserInput] = useState<"from" | "to" | null>(null);
  const [priceImpact, setPriceImpact] = useState("0.00");
  const [liquidityProviderFee, setLiquidityProviderFee] = useState("0.00");
  const [minimumReceived, setMinimumReceived] = useState("0.00");
  const [loadingFrom, setLoadingFrom] = useState(false);
  const [loadingTo, setLoadingTo] = useState(false);

  // État pour le taux de conversion
  const [conversionRate, setConversionRate] = useState<string | null>(null);

  // Trouver les tokens par défaut
  const defaultTokens =
    lists.find((list) => list.url === "levinswap-default")?.tokens || [];

  // Initialiser les tokens par défaut si nécessaire
  useEffect(() => {
    if (!chainId) return;

    const savedTokens = selectedTokens[chainId];
    if (savedTokens) {
      if (savedTokens.fromToken && !fromToken)
        setFromToken(savedTokens.fromToken);
      if (savedTokens.toToken && !toToken) setToToken(savedTokens.toToken);
    }
  }, [chainId]);

  // Sauvegarder les tokens sélectionnés
  useEffect(() => {
    if (!chainId) return;

    setSelectedTokens((prev) => ({
      ...prev,
      [chainId]: {
        fromToken,
        toToken,
      },
    }));
  }, [chainId, fromToken, toToken, setSelectedTokens]);

  // Récupérer la balance des tokens
  useEffect(() => {
    if (!chainId || !fromToken || !toToken || !account || !provider) return;

    const fetchBalances = async () => {
      try {
        const fromBalance = await getTokenBalance(
          fromToken.address,
          account,
          provider
        );
        const toBalance = await getTokenBalance(
          toToken.address,
          account,
          provider
        );
        setFromBalance(fromBalance);
        setToBalance(toBalance);
      } catch (error) {
        console.error("Erreur lors de la récupération des balances:", error);
      }
    };

    fetchBalances();
  }, [chainId, fromToken, toToken, account, provider]);

  // Effet pour le taux de conversion
  useEffect(() => {
    if (!fromToken || !toToken) {
      setConversionRate(null);
      return;
    }

    const fetchConversionRate = async () => {
      try {
        const price = await calculatePrice("1", fromToken, toToken);
        setConversionRate(price);
      } catch (error) {
        console.error("Erreur lors du calcul du taux de conversion:", error);
        setConversionRate(null);
      }
    };

    fetchConversionRate();
  }, [fromToken, toToken, calculatePrice]);

  // Effet pour mettre à jour la route quand les tokens changent
  useEffect(() => {
    if (!fromToken || !toToken) return;

    const updateRoute = async () => {
      await getBestRoute(fromToken, toToken);
    };

    updateRoute();
  }, [fromToken, toToken, getBestRoute]);

  // Mettre à jour les montants et l'impact sur le prix
  useEffect(() => {
    if (!fromToken || !toToken || !userInput) {
      console.debug("Mise à jour des prix annulée:", {
        fromToken: !!fromToken,
        toToken: !!toToken,
        userInput,
      });
      return;
    }

    console.debug("=== Début de la mise à jour des prix ===", {
      fromToken: {
        symbol: fromToken.symbol,
        decimals: fromToken.decimals,
      },
      toToken: {
        symbol: toToken.symbol,
        decimals: toToken.decimals,
      },
      userInput,
      fromAmount,
      toAmount,
    });

    let isSubscribed = true;

    const updatePriceAndInfo = async () => {
      try {
        const isFromInput = userInput === "from";
        const inputAmount = isFromInput ? fromAmount : toAmount;

        console.debug("Calcul des prix avec:", {
          isFromInput,
          inputAmount,
          parsedAmount: parseFloat(inputAmount),
        });

        if (!inputAmount || parseFloat(inputAmount) === 0) {
          console.debug("Montant nul détecté, réinitialisation des valeurs");
          if (isFromInput) {
            setToAmount("0");
          } else {
            setFromAmount("0");
          }
          setPriceImpact("0");
          setLiquidityProviderFee("0");
          setMinimumReceived("0");
          return;
        }

        if (isFromInput) {
          setLoadingTo(true);
          try {
            console.debug("Calcul du montant de sortie pour:", {
              inputAmount,
              fromToken: fromToken.symbol,
              toToken: toToken.symbol,
            });
            const calculatedAmount = await calculatePrice(
              inputAmount,
              fromToken,
              toToken,
              true
            );
            console.debug("Montant de sortie calculé:", calculatedAmount);

            if (isSubscribed) {
              setToAmount(calculatedAmount);
              const minReceived = new BigNumber(calculatedAmount)
                .multipliedBy(1 - settings.slippageTolerance / 100)
                .toFixed(6);
              setMinimumReceived(minReceived);
              console.debug("Valeurs mises à jour:", {
                calculatedAmount,
                minReceived,
                slippage: settings.slippageTolerance,
              });
            }
          } finally {
            if (isSubscribed) setLoadingTo(false);
          }
        } else {
          setLoadingFrom(true);
          try {
            console.debug("Calcul du montant d'entrée pour:", {
              inputAmount,
              fromToken: fromToken.symbol,
              toToken: toToken.symbol,
            });
            const calculatedAmount = await calculatePrice(
              inputAmount,
              fromToken,
              toToken,
              false
            );
            console.debug("Montant d'entrée calculé:", calculatedAmount);

            if (isSubscribed) {
              setFromAmount(calculatedAmount);
              const minReceived = new BigNumber(inputAmount)
                .multipliedBy(1 - settings.slippageTolerance / 100)
                .toFixed(6);
              setMinimumReceived(minReceived);
              console.debug("Valeurs mises à jour:", {
                calculatedAmount,
                minReceived,
                slippage: settings.slippageTolerance,
              });
            }
          } finally {
            if (isSubscribed) setLoadingFrom(false);
          }
        }

        // Calculer l'impact sur le prix et les frais
        if (currentRoute) {
          console.debug(
            "Calcul des détails du trade avec la route:",
            currentRoute
          );
          const tradeDetails = computeTradeDetails(
            currentRoute,
            isFromInput ? inputAmount : fromAmount,
            isFromInput
          );
          if (tradeDetails && isSubscribed) {
            console.debug("Détails du trade calculés:", tradeDetails);
            setPriceImpact(tradeDetails.priceImpact);
            setLiquidityProviderFee(tradeDetails.lpFee);
          }
        } else {
          console.debug(
            "Pas de route disponible pour calculer les détails du trade"
          );
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour des prix:", error);
        if (isSubscribed) {
          if (userInput === "from") {
            setToAmount("0");
          } else {
            setFromAmount("0");
          }
          setPriceImpact("0");
          setLiquidityProviderFee("0");
          setMinimumReceived("0");
        }
      }
    };

    const timeoutId = setTimeout(updatePriceAndInfo, 500);

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, [
    fromAmount,
    toAmount,
    fromToken,
    toToken,
    userInput,
    settings.slippageTolerance,
    calculatePrice,
    currentRoute,
  ]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setUserInput("from");
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    setUserInput("to");
  };

  const handleFromTokenSelect = async (token: Token) => {
    if (token.address === toToken?.address) {
      setFromToken(token);
      setToToken(fromToken);
    } else {
      setFromToken(token);
      if (account && provider) {
        try {
          const balance = await getTokenBalance(
            token.address,
            account,
            provider
          );
          setFromBalance(balance);
        } catch (error) {
          console.error("Erreur lors de la récupération de la balance:", error);
        }
      }
    }
  };

  const handleToTokenSelect = async (token: Token) => {
    if (token.address === fromToken?.address) {
      setToToken(token);
      setFromToken(toToken);
    } else {
      setToToken(token);
      if (account && provider) {
        try {
          const balance = await getTokenBalance(
            token.address,
            account,
            provider
          );
          setToBalance(balance);
        } catch (error) {
          console.error("Erreur lors de la récupération de la balance:", error);
        }
      }
    }
  };

  const handleMaxClick = async (
    tokenBalance: string,
    tokenType: "from" | "to"
  ) => {
    console.log("=== handleMaxClick ===");
    console.log("Balance reçue:", tokenBalance);

    const hasBalance = new BigNumber(tokenBalance).gt(0);
    if (tokenType === "from") {
      console.log("Setting from amount:", tokenBalance);
      setFromAmount(tokenBalance);
      setUserInput("from");
      if (fromToken && toToken && hasBalance) {
        setLoadingTo(true);
        try {
          const amountOut = await calculatePrice(
            tokenBalance,
            fromToken,
            toToken,
            true
          );
          console.log("Amount out calculated:", amountOut);
          setToAmount(amountOut);
        } finally {
          setLoadingTo(false);
        }
      }
    } else if (tokenType === "to") {
      console.log("Setting to amount:", tokenBalance);
      setToAmount(tokenBalance);
      setUserInput("to");
      if (fromToken && toToken && hasBalance) {
        setLoadingFrom(true);
        try {
          const amountIn = await calculatePrice(
            tokenBalance,
            fromToken,
            toToken,
            false
          );
          console.log("Amount in calculated:", amountIn);
          setFromAmount(amountIn);
        } finally {
          setLoadingFrom(false);
        }
      }
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const [isTransactionPending, setIsTransactionPending] = useState(false);

  const {
    isValid,
    buttonText,
    errorMessage,
    warningStyle,
    isApproval,
    updateTransactionState,
  } = useSwapValidation(
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    fromBalance,
    LEVINSWAP_CONFIG.ROUTER_ADDRESS
  );

  const [transactionState, setTransactionState] = useState<
    "idle" | "waiting_wallet" | "pending" | "success" | "error"
  >("idle");

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

  // Fonction pour gérer l'approbation
  const handleApprove = async () => {
    if (!provider || !account || !fromToken || !fromAmount) return;

    const operationId = `approve-${fromToken.symbol}-${Date.now()}`;

    setTransactionState("waiting_wallet");
    updateTransactionState({
      buttonText: "En attente de validation du Wallet...",
      isValid: false,
    });

    try {
      const contract = new ethers.Contract(
        fromToken.address,
        ERC20_ABI,
        provider.getSigner()
      );

      const amountToApprove = ethers.utils.parseUnits(
        fromAmount,
        fromToken.decimals
      );

      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation en attente",
        message: `En attente de votre validation pour ${fromToken.symbol}`,
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
        message: `Transaction d'approbation envoyée pour ${fromToken.symbol}`,
        color: "blue",
        loading: true,
      });

      const receipt = await tx.wait();
      console.debug("Transaction approuvée:", receipt);

      setTransactionState("success");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation réussie",
        message: `L'approbation pour ${fromToken.symbol} a été confirmée`,
        color: "green",
      });

      // Attendre un peu pour être sûr que la blockchain est à jour
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Revalider l'état après la confirmation
      const hasAllowance = await checkAllowance(
        provider,
        account,
        fromToken,
        fromAmount,
        LEVINSWAP_CONFIG.ROUTER_ADDRESS
      );

      // N'effacer le message d'erreur que si l'allowance est suffisante
      if (hasAllowance) {
        updateTransactionState({
          buttonText: "Swap",
          isValid: true,
          errorMessage: undefined, // Effacer le message seulement ici
          isApproval: false,
          warningStyle: false,
        });
      } else {
        // Si l'allowance n'est toujours pas suffisante, garder le message
        updateTransactionState({
          buttonText: "Approuver",
          isValid: true,
          errorMessage: `Approbation requise pour ${fromToken.symbol} afin de réaliser le transfer`,
          isApproval: true,
          warningStyle: true,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      setTransactionState("error");
      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur d'approbation",
        message: error.reason || "La transaction a échoué",
        color: "red",
      });
      // En cas d'erreur, garder le message d'approbation
      updateTransactionState({
        buttonText: "Approuver",
        isValid: true,
        errorMessage: "La transaction a échoué, veuillez réessayer",
        warningStyle: true,
        isApproval: true,
      });
    } finally {
      setTransactionState("idle");
    }
  };

  // Fonction pour gérer le swap (à implémenter plus tard)
  const handleSwap = async () => {
    console.debug("=== Début du processus de swap ===");
    console.debug("Tokens:", {
      fromToken: {
        symbol: fromToken?.symbol,
        address: fromToken?.address,
        decimals: fromToken?.decimals,
      },
      toToken: {
        symbol: toToken?.symbol,
        address: toToken?.address,
        decimals: toToken?.decimals,
      },
    });
    console.debug("Montants:", {
      fromAmount,
      toAmount,
      fromAmountParsed: parseFloat(fromAmount),
      toAmountParsed: parseFloat(toAmount),
    });
    console.debug("Route actuelle:", currentRoute);

    if (
      !provider ||
      !account ||
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !toAmount ||
      !currentRoute
    ) {
      console.error("Valeurs manquantes:", {
        provider: !!provider,
        account: !!account,
        fromToken: !!fromToken,
        toToken: !!toToken,
        fromAmount: !!fromAmount,
        toAmount: !!toAmount,
        currentRoute: !!currentRoute,
      });
      return;
    }

    // Vérifier que les montants ne sont pas nuls ou trop petits
    if (parseFloat(fromAmount) <= 0 || parseFloat(toAmount) <= 0) {
      console.error("Montants invalides:", {
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
      });
      updateTransactionState({
        buttonText: "Swap",
        isValid: false,
        errorMessage: "Le montant est trop petit pour être échangé",
        warningStyle: true,
      });
      return;
    }

    const operationId = `swap-${fromToken.symbol}-${
      toToken.symbol
    }-${Date.now()}`;

    setTransactionState("waiting_wallet");
    updateTransactionState({
      buttonText: "En attente de validation du Wallet...",
      isValid: false,
    });

    try {
      const router = new ethers.Contract(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        ROUTER_ABI,
        provider.getSigner()
      );

      // Calculer le montant minimum à recevoir avec le slippage
      const amountOutMin = ethers.utils.parseUnits(
        new BigNumber(toAmount)
          .multipliedBy(1 - settings.slippageTolerance / 100)
          .toFixed(toToken.decimals),
        toToken.decimals
      );

      // Calculer le deadline en utilisant le paramètre de settings
      const deadline =
        Math.floor(Date.now() / 1000) + settings.transactionDeadline * 60;

      // Préparer le chemin des tokens
      const path = currentRoute.path.map((token) => {
        // Si c'est un token natif, utiliser le wrapped token
        if (isNativeToken(token)) {
          return LEVINSWAP_CONFIG.WRAPPED_NATIVE_TOKEN;
        }
        // Sinon utiliser l'adresse du token
        return token.address;
      });

      console.debug("Paramètres du swap détaillés:", {
        fromToken: {
          symbol: fromToken.symbol,
          address: fromToken.address,
          decimals: fromToken.decimals,
          isNative: isNativeToken(fromToken),
        },
        toToken: {
          symbol: toToken.symbol,
          address: toToken.address,
          decimals: toToken.decimals,
          isNative: isNativeToken(toToken),
        },
        montants: {
          fromAmount,
          toAmount,
          amountOutMin: amountOutMin.toString(),
          slippage: settings.slippageTolerance,
        },
        path,
        deadline,
        routerAddress: LEVINSWAP_CONFIG.ROUTER_ADDRESS,
      });

      showOperationNotification(operationId, {
        id: operationId,
        title: "Swap en attente",
        message: `En attente de votre validation pour échanger ${fromAmount} ${fromToken.symbol}`,
        color: "yellow",
        loading: true,
      });

      let tx;
      if (isNativeToken(fromToken)) {
        const value = ethers.utils.parseEther(fromAmount);
        console.debug("Swap ETH -> Token:", {
          value: value.toString(),
          amountOutMin: amountOutMin.toString(),
          path,
        });
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          account,
          deadline,
          { value }
        );
      } else if (isNativeToken(toToken)) {
        const amountIn = ethers.utils.parseUnits(
          fromAmount,
          fromToken.decimals
        );
        console.debug("Swap Token -> ETH:", {
          amountIn: amountIn.toString(),
          amountOutMin: amountOutMin.toString(),
          path,
        });
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          account,
          deadline
        );
      } else {
        const amountIn = ethers.utils.parseUnits(
          fromAmount,
          fromToken.decimals
        );
        console.debug("Swap Token -> Token:", {
          amountIn: amountIn.toString(),
          amountOutMin: amountOutMin.toString(),
          path,
        });
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          account,
          deadline
        );
      }

      const txHash = tx.hash;
      const explorerUrl = `https://gnosisscan.io/tx/${txHash}`;

      showOperationNotification(operationId, {
        id: operationId,
        title: "Transaction envoyée",
        message: (
          <Text>
            Transaction de swap envoyée.{" "}
            <Anchor href={explorerUrl} target="_blank">
              Voir sur GnosisScan
            </Anchor>
          </Text>
        ),
        color: "blue",
        loading: true,
      });

      const receipt = await tx.wait();
      console.debug("Swap confirmé:", receipt);

      showOperationNotification(operationId, {
        id: operationId,
        title: "Swap réussi",
        message: (
          <Text>
            Le swap a été confirmé.{" "}
            <Anchor href={explorerUrl} target="_blank">
              Voir sur GnosisScan
            </Anchor>
          </Text>
        ),
        color: "green",
      });

      // Réinitialiser les montants
      setFromAmount("0");
      setToAmount("0");
      setUserInput(null);
    } catch (error: any) {
      console.error("Erreur lors du swap:", error);
      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur de swap",
        message: error.reason || "La transaction a échoué",
        color: "red",
      });
      updateTransactionState({
        buttonText: "Swap",
        isValid: true,
      });
    } finally {
      setTransactionState("idle");
    }
  };

  return (
    <Stack gap="xs">
      <Card className={classes.exchangeCard} padding="md">
        <Stack gap="md">
          <TokenInput
            label="From"
            value={fromAmount}
            token={fromToken}
            onChange={handleFromAmountChange}
            onSelectToken={handleFromTokenSelect}
            balance={
              <div
                onClick={() => handleMaxClick(fromBalance, "from")}
                className={classes.cursorPointer}
              >
                Balance: {fromBalance}
              </div>
            }
            loading={loadingFrom}
          />

          <Group justify="center">
            <IconArrowDown
              style={{ cursor: "pointer" }}
              onClick={handleSwapTokens}
            />
          </Group>

          <TokenInput
            label="To"
            value={toAmount}
            token={toToken}
            onChange={handleToAmountChange}
            onSelectToken={handleToTokenSelect}
            balance={
              <div
                onClick={() => handleMaxClick(toBalance, "to")}
                className={classes.cursorPointer}
              >
                Balance: {toBalance}
              </div>
            }
            loading={loadingTo}
          />

          {/* Taux de conversion */}
          {fromToken && toToken && conversionRate !== null && (
            <Stack gap="xs" mt="md">
              <Text size="sm" c="dimmed" ta="center">
                1 {fromToken.symbol} = {conversionRate} {toToken.symbol}
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                1 {toToken.symbol} ={" "}
                {new BigNumber(1).dividedBy(conversionRate).toFixed(6)}{" "}
                {fromToken.symbol}
              </Text>
            </Stack>
          )}

          {/* Informations sur le swap */}
          {fromToken && toToken && fromAmount !== "0" && fromAmount !== "" && (
            <Stack gap="xs" mt="md">
              <div className={classes.infoRow}>
                <div className={classes.infoLabel}>
                  <Text size="sm" c="dimmed">
                    Impact sur le prix
                  </Text>
                  <Tooltip label="L'impact sur le prix représente la différence entre le prix du marché et le prix que vous payez en raison de la taille de votre transaction.">
                    <IconInfoCircle
                      size={16}
                      style={{ color: "var(--mantine-color-dimmed)" }}
                    />
                  </Tooltip>
                </div>
                {loadingFrom || loadingTo ? (
                  <div className={classes.loadingText} />
                ) : (
                  <Text size="sm" c="dimmed">
                    {priceImpact}%
                  </Text>
                )}
              </div>

              <div className={classes.infoRow}>
                <div className={classes.infoLabel}>
                  <Text size="sm" c="dimmed">
                    Frais de liquidité
                  </Text>
                  <Tooltip label="Les frais de liquidité sont versés aux fournisseurs de liquidité pour chaque échange.">
                    <IconInfoCircle
                      size={16}
                      style={{ color: "var(--mantine-color-dimmed)" }}
                    />
                  </Tooltip>
                </div>
                {loadingFrom || loadingTo ? (
                  <div className={classes.loadingText} />
                ) : (
                  <Text size="sm" c="dimmed">
                    {liquidityProviderFee} {fromToken.symbol}
                  </Text>
                )}
              </div>

              <div className={classes.infoRow}>
                <div className={classes.infoLabel}>
                  <Text size="sm" c="dimmed">
                    Minimum reçu
                  </Text>
                  <Tooltip label="Le montant minimum que vous recevrez après application de la tolérance de glissement.">
                    <IconInfoCircle
                      size={16}
                      style={{ color: "var(--mantine-color-dimmed)" }}
                    />
                  </Tooltip>
                </div>
                {loadingFrom || loadingTo ? (
                  <div className={classes.loadingText} />
                ) : (
                  <Text size="sm" c="dimmed">
                    {minimumReceived} {toToken.symbol}
                  </Text>
                )}
              </div>

              <div className={classes.infoRow}>
                <div className={classes.infoLabel}>
                  <Text size="sm" c="dimmed">
                    Slippage autorisé
                  </Text>
                  <Tooltip label="Le pourcentage de variation de prix autorisé avant l'échec de la transaction">
                    <IconInfoCircle
                      size={16}
                      style={{ color: "var(--mantine-color-dimmed)" }}
                    />
                  </Tooltip>
                </div>
                <Text size="sm" c="dimmed">
                  {settings.slippageTolerance}%
                </Text>
              </div>
            </Stack>
          )}

          {/* Bouton de swap */}
          <Button
            fullWidth
            size="lg"
            color={isApproval ? "yellow" : "blue"}
            disabled={!isValid || transactionState !== "idle"}
            loading={transactionState !== "idle"}
            onClick={isApproval ? handleApprove : handleSwap}
          >
            {getButtonText()}
          </Button>

          {errorMessage && (
            <Text size="sm" ta="center" c={warningStyle ? "pink.4" : "red"}>
              {errorMessage}
            </Text>
          )}
        </Stack>
      </Card>

      {/* Route du swap en dehors de la Card principale */}
      {fromToken &&
        toToken &&
        fromAmount !== "0" &&
        fromAmount !== "" &&
        currentRoute?.path && (
          <Card className={classes.routeCard}>
            <SwapRoute
              route={currentRoute as CustomRoute}
              loading={loadingFrom || loadingTo}
            />
          </Card>
        )}
    </Stack>
  );
}
