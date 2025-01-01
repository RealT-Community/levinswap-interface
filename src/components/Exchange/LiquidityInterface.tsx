"use client";

import { LEVINSWAP_CONFIG } from "@/config/constants";
import { useLiquidityOperations } from "@/hooks/useLiquidityOperations";
import { useLiquidityValidation } from "@/hooks/useLiquidityValidation";
import { usePairReserves } from "@/hooks/usePairReserves";
import { useTokenLists } from "@/hooks/useTokenLists";
import { useWeb3Store } from "@/hooks/useWeb3Store";
import { selectedTokensAtom } from "@/store/selectedTokens";
import { Token } from "@/store/tokenLists";
import { getTokenBalance } from "@/utils/tokenUtils";
import { Button, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ethers } from "ethers";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { CombinedInfo } from "./Liquidity/CombinedInfo";
import classes from "./LiquidityInterface.module.css";
import { TokenInput } from "./TokenInput";

type LiquidityMode = "add" | "remove";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];

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
  notifications.hide(operationId);
  notifications.show({
    ...notification,
    id: operationId,
    autoClose: notification.loading ? false : 60000,
    withCloseButton: !notification.loading,
  });
};

interface LiquidityInterfaceProps {
  mode: "add" | "withdraw";
}

interface ValidationState {
  isValid: boolean;
  buttonText: string;
  error: string;
  isApproval: boolean;
  tokenToApprove?: Token;
  warningStyle?: boolean;
}

export function LiquidityInterface({ mode }: LiquidityInterfaceProps) {
  const { lists } = useTokenLists();
  const { chainId, account, provider } = useWeb3Store();
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const { getReserves } = usePairReserves();
  const { getUserShare } = useLiquidityOperations();

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
  const [reserves, setReserves] = useState<{
    reserve0: string;
    reserve1: string;
  }>();
  const [userShare, setUserShare] = useState<string>();
  const [lpTokens, setLpTokens] = useState<string>("0");
  const [lpToken, setLpToken] = useState<Token>();
  const [transactionState, setTransactionState] = useState<
    "idle" | "waiting_wallet" | "pending" | "success" | "error"
  >("idle");
  const [selectedPool, setSelectedPool] = useState<{
    token0: Token;
    token1: Token;
  } | null>(null);
  const [withdrawPercentage, setWithdrawPercentage] = useState(0);

  // Trouver les tokens par défaut
  const defaultTokens =
    lists.find((list) => list.url === "levinswap-default")?.tokens || [];

  // Initialiser les tokens par défaut si nécessaire
  useEffect(() => {
    if (!chainId) return;

    if (!fromToken && defaultTokens.length > 0) {
      setFromToken(defaultTokens[0]);
    }
    if (!toToken && defaultTokens.length > 1) {
      setToToken(defaultTokens[1]);
    }
  }, [chainId, defaultTokens, fromToken, toToken]);

  // Sauvegarder les tokens sélectionnés
  const saveSelectedTokens = useCallback(() => {
    if (!chainId || !fromToken || !toToken) return;

    setSelectedTokens((prev) => ({
      ...prev,
      [chainId]: {
        fromToken,
        toToken,
      },
    }));
  }, [chainId, fromToken, toToken, setSelectedTokens]);

  // Mettre à jour les tokens sélectionnés
  useEffect(() => {
    saveSelectedTokens();
  }, [saveSelectedTokens]);

  // Récupérer les balances des tokens
  const fetchBalances = useCallback(async () => {
    if (!account || !chainId || !provider) return;

    try {
      if (fromToken) {
        const balance = await getTokenBalance(
          fromToken.address,
          account,
          provider
        );
        // S'assurer que la balance est en wei
        if (balance.includes(".")) {
          // Si c'est un nombre décimal, le convertir en wei
          try {
            const balanceWei = ethers.utils.parseUnits(
              balance,
              fromToken.decimals
            );
            setFromBalance(balanceWei.toString());
          } catch (error) {
            console.error("Erreur de conversion de la balance en wei:", error);
            setFromBalance("0");
          }
        } else {
          // Si c'est déjà en wei, l'utiliser tel quel
          setFromBalance(balance);
        }
      }
      if (toToken) {
        const balance = await getTokenBalance(
          toToken.address,
          account,
          provider
        );
        // S'assurer que la balance est en wei
        if (balance.includes(".")) {
          // Si c'est un nombre décimal, le convertir en wei
          try {
            const balanceWei = ethers.utils.parseUnits(
              balance,
              toToken.decimals
            );
            setToBalance(balanceWei.toString());
          } catch (error) {
            console.error("Erreur de conversion de la balance en wei:", error);
            setToBalance("0");
          }
        } else {
          // Si c'est déjà en wei, l'utiliser tel quel
          setToBalance(balance);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des balances:", error);
    }
  }, [account, chainId, fromToken, toToken, provider]);

  // Mettre à jour les balances lorsque les tokens ou le compte changent
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Récupérer les réserves de la pool
  useEffect(() => {
    const fetchReserves = async () => {
      if (!fromToken || !toToken) return;

      try {
        const pairReserves = await getReserves(
          fromToken.address,
          toToken.address
        );
        if (pairReserves) {
          setReserves(pairReserves);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des réserves:", error);
      }
    };

    fetchReserves();
  }, [fromToken, toToken, getReserves]);

  // Récupérer la part utilisateur et les tokens LP
  useEffect(() => {
    const fetchUserShare = async () => {
      if (!fromToken || !toToken || !account || !provider) return;

      try {
        const share = await getUserShare(fromToken, toToken);
        setUserShare(share || "0.00");

        // Récupérer l'adresse de la paire
        const pairAddress = await new ethers.Contract(
          LEVINSWAP_CONFIG.FACTORY_ADDRESS,
          ["function getPair(address, address) view returns (address)"],
          provider
        ).getPair(fromToken.address, toToken.address);

        if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
          // Créer le token LP
          setLpToken({
            chainId: fromToken.chainId,
            address: pairAddress,
            name: `${fromToken.symbol}-${toToken.symbol} LP`,
            symbol: `${fromToken.symbol}-${toToken.symbol}-LP`,
            decimals: 18,
            logoURI: "",
          });

          // Récupérer la balance de tokens LP
          const pairContract = new ethers.Contract(
            pairAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );
          const lpBalance = await pairContract.balanceOf(account);
          const formattedLpBalance = ethers.utils.formatUnits(lpBalance, 18);
          setLpTokens(formattedLpBalance);
        } else {
          setLpTokens("0");
          setLpToken(undefined);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de la part utilisateur:",
          error
        );
        setUserShare("0.00");
        setLpTokens("0");
        setLpToken(undefined);
      }
    };

    fetchUserShare();
  }, [fromToken, toToken, account, provider, getUserShare]);

  // Gérer le changement de token "From"
  const handleFromTokenSelect = useCallback(
    async (token: Token) => {
      if (token.address === toToken?.address) {
        setFromToken(token);
        setToToken(fromToken);
        setFromAmount("0");
        setToAmount("0");
        const tempBalance = fromBalance;
        setFromBalance(toBalance);
        setToBalance(tempBalance);
        // Mettre à jour les réserves après l'échange
        if (fromToken) {
          const pairReserves = await getReserves(
            token.address,
            fromToken.address
          );
          if (pairReserves) {
            setReserves({
              reserve0: pairReserves.reserve0.toString(),
              reserve1: pairReserves.reserve1.toString(),
            });
          } else {
            setReserves(undefined);
          }
        }
      } else {
        setFromToken(token);
        setFromAmount("0");
        setToAmount("0");
        if (account && provider) {
          try {
            const balance = await getTokenBalance(
              token.address,
              account,
              provider
            );
            setFromBalance(balance);
            // Mettre à jour les réserves avec le nouveau token
            if (toToken) {
              const pairReserves = await getReserves(
                token.address,
                toToken.address
              );
              if (pairReserves) {
                setReserves({
                  reserve0: pairReserves.reserve0.toString(),
                  reserve1: pairReserves.reserve1.toString(),
                });
              } else {
                setReserves(undefined);
              }
            }
          } catch (error) {
            console.error(
              "Erreur lors de la récupération de la balance:",
              error
            );
          }
        }
      }
    },
    [toToken, fromToken, fromBalance, toBalance, account, provider, getReserves]
  );

  // Gérer le changement de token "To"
  const handleToTokenSelect = useCallback(
    async (token: Token) => {
      if (token.address === fromToken?.address) {
        setToToken(token);
        setFromToken(toToken);
        setFromAmount("0");
        setToAmount("0");
        const tempBalance = toBalance;
        setToBalance(fromBalance);
        setFromBalance(tempBalance);
        // Mettre à jour les réserves après l'échange
        if (toToken) {
          const pairReserves = await getReserves(
            token.address,
            toToken.address
          );
          if (pairReserves) {
            setReserves({
              reserve0: pairReserves.reserve0.toString(),
              reserve1: pairReserves.reserve1.toString(),
            });
          } else {
            setReserves(undefined);
          }
        }
      } else {
        setToToken(token);
        setFromAmount("0");
        setToAmount("0");
        if (account && provider) {
          try {
            const balance = await getTokenBalance(
              token.address,
              account,
              provider
            );
            setToBalance(balance);
            // Mettre à jour les réserves avec le nouveau token
            if (fromToken) {
              const pairReserves = await getReserves(
                fromToken.address,
                token.address
              );
              if (pairReserves) {
                setReserves({
                  reserve0: pairReserves.reserve0.toString(),
                  reserve1: pairReserves.reserve1.toString(),
                });
              } else {
                setReserves(undefined);
              }
            }
          } catch (error) {
            console.error(
              "Erreur lors de la récupération de la balance:",
              error
            );
          }
        }
      }
    },
    [fromToken, toToken, fromBalance, toBalance, account, provider, getReserves]
  );

  const handleMaxClick = async (
    tokenBalance: string,
    tokenType: "from" | "to"
  ) => {
    if (tokenType === "from" && fromToken) {
      try {
        // Convertir la balance en wei si ce n'est pas déjà le cas
        let balanceInWei;
        try {
          // Essayer de voir si c'est déjà en wei
          balanceInWei = ethers.BigNumber.from(tokenBalance);
        } catch {
          // Si non, convertir en wei
          balanceInWei = ethers.utils.parseUnits(
            tokenBalance,
            fromToken.decimals
          );
        }
        // Convertir en format décimal pour l'affichage
        setFromAmount(
          ethers.utils.formatUnits(balanceInWei, fromToken.decimals)
        );

        if (toToken && reserves) {
          const reserve0 = ethers.BigNumber.from(reserves.reserve0);
          const reserve1 = ethers.BigNumber.from(reserves.reserve1);

          // (balanceInWei * reserve1) / reserve0
          const newToAmount = balanceInWei.mul(reserve1).div(reserve0);
          // Convertir en format décimal pour l'affichage
          setToAmount(ethers.utils.formatUnits(newToAmount, toToken.decimals));
        }
      } catch (error) {
        console.error("Erreur lors du calcul du montant maximum:", error);
      }
    } else if (tokenType === "to" && toToken) {
      try {
        // Convertir la balance en wei si ce n'est pas déjà le cas
        let balanceInWei;
        try {
          // Essayer de voir si c'est déjà en wei
          balanceInWei = ethers.BigNumber.from(tokenBalance);
        } catch {
          // Si non, convertir en wei
          balanceInWei = ethers.utils.parseUnits(
            tokenBalance,
            toToken.decimals
          );
        }
        // Convertir en format décimal pour l'affichage
        setToAmount(ethers.utils.formatUnits(balanceInWei, toToken.decimals));

        if (fromToken && reserves) {
          const reserve0 = ethers.BigNumber.from(reserves.reserve0);
          const reserve1 = ethers.BigNumber.from(reserves.reserve1);

          // (balanceInWei * reserve0) / reserve1
          const newFromAmount = balanceInWei.mul(reserve0).div(reserve1);
          // Convertir en format décimal pour l'affichage
          setFromAmount(
            ethers.utils.formatUnits(newFromAmount, fromToken.decimals)
          );
        }
      } catch (error) {
        console.error("Erreur lors du calcul du montant maximum:", error);
      }
    }
  };

  // Validation des montants
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    buttonText: "Entrez un montant",
    error: "",
    isApproval: false,
    warningStyle: false,
  });

  useEffect(() => {
    const validateAmounts = async () => {
      if (!fromToken || !toToken) return;

      // Vérifier si le pool n'est pas initialisé
      const isPoolUninitialized =
        !reserves || (reserves.reserve0 === "0" && reserves.reserve1 === "0");

      // Si le pool n'est pas initialisé, vérifier que les deux montants sont renseignés
      if (isPoolUninitialized) {
        const fromAmountNum = Number(fromAmount);
        const toAmountNum = Number(toAmount);

        if (fromAmountNum <= 0 || toAmountNum <= 0) {
          setValidationState({
            isValid: false,
            buttonText: "Entrez les montants",
            error: "Définissez le taux initial en entrant les deux montants",
            isApproval: false,
            warningStyle: true,
          });
          return;
        }

        // Vérifier les balances
        const fromAmountBN = ethers.utils.parseUnits(
          fromAmount,
          fromToken.decimals
        );
        const toAmountBN = ethers.utils.parseUnits(toAmount, toToken.decimals);
        const fromBalanceBN = ethers.BigNumber.from(fromBalance);
        const toBalanceBN = ethers.BigNumber.from(toBalance);

        if (fromAmountBN.gt(fromBalanceBN) || toAmountBN.gt(toBalanceBN)) {
          setValidationState({
            isValid: false,
            buttonText: "Solde insuffisant",
            error: "Solde insuffisant pour initialiser le pool",
            isApproval: false,
            warningStyle: false,
          });
          return;
        }

        // Si tout est bon, procéder à la validation des approbations
        const validation = await useLiquidityValidation(
          fromAmount,
          fromToken,
          fromBalance,
          toAmount,
          toToken,
          toBalance,
          false, // hasReserves est false car pool non initialisé
          provider,
          account,
          LEVINSWAP_CONFIG.ROUTER_ADDRESS
        );

        setValidationState({
          ...validation,
          buttonText: validation.isApproval
            ? "Approuver"
            : "Initialiser le pool",
          error:
            validation.error || "Vous allez définir le taux initial du pool",
          warningStyle: true,
        });
        return;
      }

      // Si le pool est initialisé, utiliser la validation normale
      const validation = await useLiquidityValidation(
        fromAmount,
        fromToken,
        fromBalance,
        toAmount,
        toToken,
        toBalance,
        true,
        provider,
        account,
        LEVINSWAP_CONFIG.ROUTER_ADDRESS
      );

      setValidationState({
        ...validation,
        warningStyle: validation.isApproval,
      });
    };

    validateAmounts();
  }, [
    fromAmount,
    fromToken,
    fromBalance,
    toAmount,
    toToken,
    toBalance,
    reserves,
    provider,
    account,
  ]);

  const {
    isValid,
    buttonText,
    error: validationError,
    isApproval,
    tokenToApprove,
    warningStyle,
  } = validationState;

  // Gérer le changement de montant "From"
  const handleFromAmountChange = (value: string) => {
    // Stocker la valeur en format décimal pour l'affichage
    setFromAmount(value);

    if (!fromToken || !toToken) return;

    try {
      if (!value || value === "0" || value === "0.0") {
        setToAmount("0");
        return;
      }

      // Si le pool n'est pas initialisé (réserves à 0), ne pas calculer le montant de sortie
      if (
        !reserves ||
        (reserves.reserve0 === "0" && reserves.reserve1 === "0")
      ) {
        return;
      }

      // Calculer le montant de sortie
      const amountIn = ethers.utils.parseUnits(value, fromToken.decimals);
      const reserve0 = ethers.BigNumber.from(reserves.reserve0);
      const reserve1 = ethers.BigNumber.from(reserves.reserve1);

      const amountOut = amountIn.mul(reserve1).div(reserve0);
      // Convertir le montant de sortie en format décimal
      setToAmount(ethers.utils.formatUnits(amountOut, toToken.decimals));
    } catch (error) {
      console.error("Erreur de calcul du montant:", error);
      setToAmount("0");
    }
  };

  // Gérer le changement de montant "To"
  const handleToAmountChange = (value: string) => {
    // Stocker la valeur en format décimal pour l'affichage
    setToAmount(value);

    if (!fromToken || !toToken) return;

    try {
      if (!value || value === "0" || value === "0.0") {
        setFromAmount("0");
        return;
      }

      // Si le pool n'est pas initialisé (réserves à 0), ne pas calculer le montant de sortie
      if (
        !reserves ||
        (reserves.reserve0 === "0" && reserves.reserve1 === "0")
      ) {
        return;
      }

      // Calculer le montant de sortie
      const amountIn = ethers.utils.parseUnits(value, toToken.decimals);
      const reserve0 = ethers.BigNumber.from(reserves.reserve0);
      const reserve1 = ethers.BigNumber.from(reserves.reserve1);

      const amountOut = amountIn.mul(reserve0).div(reserve1);
      // Convertir le montant de sortie en format décimal
      setFromAmount(ethers.utils.formatUnits(amountOut, fromToken.decimals));
    } catch (error) {
      console.error("Erreur de calcul du montant:", error);
      setFromAmount("0");
    }
  };

  // Gérer l'approbation
  const handleApprove = async () => {
    if (!provider || !account || !validationState.tokenToApprove) return;

    const operationId = `approve-${Date.now()}`;
    setTransactionState("waiting_wallet");

    try {
      const tokenToApprove = validationState.tokenToApprove;
      const contract = new ethers.Contract(
        tokenToApprove.address,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        provider.getSigner()
      );

      const amountToApprove = ethers.utils.parseUnits(
        tokenToApprove.address === fromToken?.address ? fromAmount : toAmount,
        tokenToApprove.decimals
      );

      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation en attente",
        message: `Veuillez confirmer l'approbation pour ${tokenToApprove.symbol}...`,
        color: "blue",
        loading: true,
      });

      const tx = await contract.approve(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        amountToApprove
      );

      setTransactionState("pending");

      showOperationNotification(operationId, {
        id: operationId,
        title: "Approbation en cours",
        message: `L'approbation pour ${tokenToApprove.symbol} est en cours...`,
        color: "blue",
        loading: true,
      });

      await tx.wait();

      showOperationNotification(operationId, {
        id: operationId,
        title: "Succès !",
        message: `L'approbation pour ${tokenToApprove.symbol} a été effectuée avec succès !`,
        color: "green",
      });

      setTransactionState("success");

      // Forcer une nouvelle validation après l'approbation
      const validation = await useLiquidityValidation(
        fromAmount,
        fromToken,
        fromBalance,
        toAmount,
        toToken,
        toBalance,
        !!reserves,
        provider,
        account,
        LEVINSWAP_CONFIG.ROUTER_ADDRESS
      );
      setValidationState(validation);
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      setTransactionState("error");

      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur",
        message: "Une erreur est survenue lors de l'approbation",
        color: "red",
      });
    } finally {
      setTransactionState("idle");
    }
  };

  // Gérer l'ajout de liquidité
  const handleAddLiquidity = async () => {
    if (!isValid || !fromToken || !toToken || !provider || !account) return;

    const operationId = `add-liquidity-${Date.now()}`;
    setTransactionState("waiting_wallet");

    try {
      const signer = provider.getSigner();
      const router = new ethers.Contract(
        LEVINSWAP_CONFIG.ROUTER_ADDRESS,
        [
          "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
        ],
        signer
      );

      // Convertir les montants en wei
      const amount0Desired = ethers.utils.parseUnits(
        fromAmount,
        fromToken.decimals
      );
      const amount1Desired = ethers.utils.parseUnits(
        toAmount,
        toToken.decimals
      );

      // Calculer les montants minimums (avec 1% de slippage)
      const amount0Min = amount0Desired.mul(99).div(100);
      const amount1Min = amount1Desired.mul(99).div(100);

      // Deadline de 20 minutes
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      showOperationNotification(operationId, {
        id: operationId,
        title: "Transaction en attente",
        message: "Veuillez confirmer la transaction dans votre portefeuille...",
        color: "blue",
        loading: true,
      });

      const tx = await router.addLiquidity(
        fromToken.address,
        toToken.address,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        account,
        deadline
      );

      setTransactionState("pending");

      showOperationNotification(operationId, {
        id: operationId,
        title: "Transaction en cours",
        message: "La transaction est en cours de traitement...",
        color: "blue",
        loading: true,
      });

      await tx.wait();

      showOperationNotification(operationId, {
        id: operationId,
        title: "Succès !",
        message: "La liquidité a été ajoutée avec succès !",
        color: "green",
      });

      setTransactionState("success");

      // Réinitialiser les montants
      setFromAmount("0");
      setToAmount("0");

      // Rafraîchir toutes les informations
      const updatePromises = [
        // Mettre à jour les balances
        fetchBalances(),

        // Mettre à jour les réserves
        (async () => {
          const pairReserves = await getReserves(
            fromToken.address,
            toToken.address
          );
          if (pairReserves) {
            setReserves(pairReserves);
          }
        })(),

        // Mettre à jour la part utilisateur et les tokens LP
        (async () => {
          try {
            // Récupérer la part utilisateur
            const share = await getUserShare(fromToken, toToken);
            setUserShare(share || "0.00");

            // Récupérer l'adresse de la paire
            const pairAddress = await new ethers.Contract(
              LEVINSWAP_CONFIG.FACTORY_ADDRESS,
              ["function getPair(address, address) view returns (address)"],
              provider
            ).getPair(fromToken.address, toToken.address);

            if (pairAddress && pairAddress !== ethers.constants.AddressZero) {
              // Mettre à jour le token LP
              setLpToken({
                chainId: fromToken.chainId,
                address: pairAddress,
                name: `${fromToken.symbol}-${toToken.symbol} LP`,
                symbol: `${fromToken.symbol}-${toToken.symbol}-LP`,
                decimals: 18,
                logoURI: "",
              });

              // Mettre à jour la balance de tokens LP
              const pairContract = new ethers.Contract(
                pairAddress,
                ["function balanceOf(address) view returns (uint256)"],
                provider
              );
              const lpBalance = await pairContract.balanceOf(account);
              const formattedLpBalance = ethers.utils.formatUnits(
                lpBalance,
                18
              );
              setLpTokens(formattedLpBalance);
            }
          } catch (error) {
            console.error(
              "Erreur lors de la mise à jour des informations de la pool:",
              error
            );
          }
        })(),
      ];

      // Attendre que toutes les mises à jour soient terminées
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Erreur lors de l'ajout de liquidité:", error);
      setTransactionState("error");

      showOperationNotification(operationId, {
        id: operationId,
        title: "Erreur",
        message: "Une erreur est survenue lors de l'ajout de liquidité",
        color: "red",
      });
    } finally {
      setTransactionState("idle");
    }
  };

  // Formater les balances pour l'affichage
  const formatBalance = (balance: string, decimals: number): string => {
    try {
      // Si la balance est déjà en wei
      if (balance.includes(".")) {
        return balance;
      }
      // Sinon, on la formate depuis wei
      return ethers.utils.formatUnits(balance || "0", decimals);
    } catch (error) {
      console.error("Erreur de formatage de la balance:", error);
      return "0";
    }
  };

  // Formater les balances pour l'affichage
  const formattedFromBalance = fromToken
    ? `Balance: ${formatBalance(fromBalance, fromToken.decimals)}`
    : "Balance: 0";

  const formattedToBalance = toToken
    ? `Balance: ${formatBalance(toBalance, toToken.decimals)}`
    : "Balance: 0";

  return (
    <Stack gap="xs">
      <div className={classes.tokenInputWrapper}>
        <TokenInput
          label="Token 1"
          value={fromAmount}
          balance={
            <div
              onClick={() => handleMaxClick(fromBalance, "from")}
              className={classes.cursorPointer}
            >
              Balance: {formatBalance(fromBalance, fromToken?.decimals || 18)}
            </div>
          }
          token={fromToken}
          onChange={handleFromAmountChange}
          onSelectToken={handleFromTokenSelect}
        />
      </div>

      <div className={classes.plusIcon}>+</div>

      <div className={classes.tokenInputWrapper}>
        <TokenInput
          label="Token 2"
          value={toAmount}
          balance={
            <div
              onClick={() => handleMaxClick(toBalance, "to")}
              className={classes.cursorPointer}
            >
              Balance: {formatBalance(toBalance, toToken?.decimals || 18)}
            </div>
          }
          token={toToken}
          onChange={handleToAmountChange}
          onSelectToken={handleToTokenSelect}
        />
      </div>

      {fromToken && toToken && (
        <CombinedInfo
          token0={fromToken}
          token1={toToken}
          reserves={reserves}
          userShare={userShare}
          amount0={fromAmount}
          amount1={toAmount}
          lpTokens={lpTokens}
        />
      )}

      <Button
        fullWidth
        size="lg"
        color={isApproval ? "#cbb1c4" : !!reserves ? "#621a6f" : "red"}
        disabled={!isValid || transactionState !== "idle"}
        loading={transactionState !== "idle"}
        onClick={isApproval ? handleApprove : handleAddLiquidity}
        className={classes.actionButton}
      >
        {buttonText}
      </Button>

      {validationError && (
        <Text size="sm" ta="center" c={warningStyle ? "yellow.6" : "red"}>
          {validationError}
        </Text>
      )}
    </Stack>
  );
}
