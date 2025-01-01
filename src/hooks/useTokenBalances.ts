import { NATIVE_TOKEN } from "@/config/constants";
import { Token, activeTokensAtom } from "@/store/tokenLists";
import { formatUnits } from "@ethersproject/units";
import { Contract, utils } from "ethers";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useWeb3Store } from "./useWeb3Store";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
];

// Multicall3 sur Gnosis Chain
const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Nombre maximum de tokens à traiter par lot pour éviter les erreurs de gas
const BATCH_SIZE = 200;

// Délai minimum entre deux mises à jour (en ms)
const UPDATE_DELAY = 30000; // 30 secondes

// Configuration des retries
const RETRY_DELAYS = [250, 1000, 2000]; // Délais en ms

// Fonction utilitaire pour attendre
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fonction de retry avec backoff exponentiel
async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= RETRY_DELAYS.length) {
      throw error;
    }

    console.warn(
      `⚠️ [TokenBalances] Tentative ${retryCount + 1}/${
        RETRY_DELAYS.length
      } échouée, nouvelle tentative dans ${RETRY_DELAYS[retryCount]}ms`
    );
    await wait(RETRY_DELAYS[retryCount]);
    return withRetry(operation, retryCount + 1);
  }
}

// Store global unique pour les balances
const BalancesStore = {
  balances: {} as { [address: string]: string },
  loadingStates: {} as { [address: string]: boolean },
  updateInterval: null as NodeJS.Timeout | null,
  isUpdating: false,
  lastUpdate: 0,
  lastChainId: undefined as number | undefined,
  lastTokensHash: undefined as string | undefined,
  listeners: new Set<() => void>(),

  // Réinitialiser les états
  resetStates() {
    this.balances = {};
    this.loadingStates = {};
    this.notify();
  },

  // Notifier tous les listeners d'un changement
  notify() {
    console.debug("📢 [TokenBalances] Notification des listeners", {
      nombreListeners: this.listeners.size,
    });
    this.listeners.forEach((listener) => listener());
  },

  // S'abonner aux changements
  subscribe(listener: () => void) {
    console.debug("👂 [TokenBalances] Nouvel abonnement", {
      nombreListeners: this.listeners.size + 1,
    });
    this.listeners.add(listener);
    return () => {
      console.debug("👋 [TokenBalances] Désabonnement", {
        nombreListeners: this.listeners.size - 1,
      });
      this.listeners.delete(listener);
    };
  },

  // Mettre à jour les balances
  async update(
    provider: any,
    account: string,
    chainId: number,
    tokens: Token[]
  ) {
    if (this.isUpdating) {
      console.debug("⏳ [TokenBalances] Mise à jour déjà en cours");
      return;
    }

    try {
      this.isUpdating = true;
      const currentHash = tokens
        .map((t) => `${t.address.toLowerCase()}-${t.chainId}`)
        .sort()
        .join("|");

      // Vérifier si une mise à jour est nécessaire
      const now = Date.now();
      if (
        this.lastChainId === chainId &&
        this.lastTokensHash === currentHash &&
        now - this.lastUpdate < UPDATE_DELAY
      ) {
        console.debug("⏸️ [TokenBalances] Mise à jour non nécessaire", {
          tempsÉcoulé: now - this.lastUpdate,
          mêmeChaine: this.lastChainId === chainId,
          mêmeTokens: this.lastTokensHash === currentHash,
        });
        return;
      }

      // Si la chaîne a changé, réinitialiser les états
      if (this.lastChainId !== chainId) {
        this.resetStates();
      }

      console.debug("🚀 [TokenBalances] Début de la mise à jour", {
        chainId,
        nombreTokens: tokens.length,
      });

      // Marquer tous les tokens comme en cours de chargement
      tokens.forEach((token) => {
        this.loadingStates[token.address.toLowerCase()] = true;
      });
      this.notify();

      const newBalances: { [address: string]: string } = { ...this.balances };
      const newLoadingStates: { [address: string]: boolean } = {
        ...this.loadingStates,
      };

      // Token natif
      const nativeToken = tokens.find(
        (t) =>
          t.address.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
      );

      if (nativeToken) {
        console.debug("💰 [TokenBalances] Récupération solde natif");
        try {
          const balance = await provider.getBalance(account);
          newBalances[NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()] = formatUnits(
            balance,
            NATIVE_TOKEN.DECIMALS
          );
          newLoadingStates[NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()] = false;
          console.debug("✅ [TokenBalances] Solde natif récupéré");
        } catch (error) {
          console.error("❌ [TokenBalances] Erreur solde natif:", error);
          newBalances[NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()] = "0";
          newLoadingStates[NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()] = false;
        }
      }

      // Tokens ERC20
      const erc20Tokens = tokens.filter(
        (token) =>
          token.address.toLowerCase() !==
            NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase() &&
          token.address.toLowerCase() !==
            "0x0000000000000000000000000000000000000000"
      );

      if (erc20Tokens.length > 0) {
        console.debug("💫 [TokenBalances] Récupération soldes ERC20", {
          nombre: erc20Tokens.length,
          tokens: erc20Tokens.map((t) => t.symbol),
        });
        try {
          const multicall = new Contract(
            MULTICALL_ADDRESS,
            MULTICALL_ABI,
            provider
          );
          const erc20Interface = new utils.Interface(ERC20_ABI);

          const calls = erc20Tokens.map((token) => ({
            target: token.address,
            callData: erc20Interface.encodeFunctionData("balanceOf", [account]),
          }));

          const [, returnData] = await withRetry<[number, string[]]>(() =>
            multicall.aggregate(calls)
          );

          erc20Tokens.forEach((token, i) => {
            const address = token.address.toLowerCase();
            try {
              const balance = erc20Interface.decodeFunctionResult(
                "balanceOf",
                returnData[i]
              )[0];
              newBalances[address] = formatUnits(balance, token.decimals);
              //console.debug("✅ [TokenBalances] Solde ERC20 récupéré", {
              //  token: token.symbol,
              //  balance: newBalances[address],
              //});
              newLoadingStates[address] = false;
            } catch (error) {
              console.warn("⚠️ [TokenBalances] Erreur décodage balance", {
                token: token.symbol,
                error,
              });
              newBalances[address] = "0";
              newLoadingStates[address] = false;
            }
          });
          console.debug("✅ [TokenBalances] Soldes ERC20 récupérés");
        } catch (error) {
          console.error("❌ [TokenBalances] Erreur multicall:", error);
          erc20Tokens.forEach((token) => {
            const address = token.address.toLowerCase();
            newBalances[address] = "0";
            newLoadingStates[address] = false;
          });
        }
      }

      console.debug("✅ [TokenBalances] Mise à jour terminée", {
        nombreBalances: Object.keys(newBalances).length,
        étatChargement: Object.values(newLoadingStates).filter(
          (loading) => loading
        ).length,
      });

      this.balances = newBalances;
      this.loadingStates = newLoadingStates;
      this.lastUpdate = now;
      this.lastChainId = chainId;
      this.lastTokensHash = currentHash;
      this.notify();
    } finally {
      this.isUpdating = false;
    }
  },

  // Démarrer les mises à jour périodiques
  startUpdates(
    provider: any,
    account: string,
    chainId: number,
    tokens: Token[]
  ) {
    if (this.updateInterval) {
      console.debug("⏸️ [TokenBalances] Mises à jour déjà démarrées");
      return;
    }

    console.debug("⏰ [TokenBalances] Démarrage des mises à jour périodiques");
    this.update(provider, account, chainId, tokens);
    this.updateInterval = setInterval(() => {
      this.update(provider, account, chainId, tokens);
    }, UPDATE_DELAY);
  },

  // Arrêter les mises à jour périodiques
  stopUpdates() {
    if (this.updateInterval) {
      console.debug("⏹️ [TokenBalances] Arrêt des mises à jour périodiques");
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  },
};

// Hook pour utiliser le store global
export function useTokenBalances(tokens: Token[], isModalOpen?: boolean) {
  const { account, provider, isActive, chainId } = useWeb3Store();
  const [activeTokens] = useAtom(activeTokensAtom);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (
      !isActive ||
      !chainId ||
      !provider ||
      !account ||
      !activeTokens ||
      !activeTokens[chainId]
    ) {
      console.debug("⏸️ [TokenBalances] Hook inactif", {
        isActive,
        hasChainId: !!chainId,
        hasProvider: !!provider,
        hasAccount: !!account,
        hasTokens: !!activeTokens && !!chainId && !!activeTokens[chainId],
      });
      return;
    }

    console.debug("🔄 [TokenBalances] Configuration du hook", {
      chainId,
      nombreTokens: Object.keys(activeTokens[chainId]).length,
      isModalOpen,
      initialLoadDone,
    });

    // S'abonner aux mises à jour
    const unsubscribe = BalancesStore.subscribe(() => {
      setForceUpdate((prev) => prev + 1);
    });

    // Chargement initial unique
    if (!initialLoadDone) {
      console.debug("🚀 [TokenBalances] Chargement initial");
      BalancesStore.update(
        provider,
        account,
        chainId,
        Object.values(activeTokens[chainId])
      ).then(() => {
        setInitialLoadDone(true);
      });
    }

    // Démarrer les mises à jour périodiques uniquement si la modale est ouverte
    if (isModalOpen) {
      console.debug(
        "⏰ [TokenBalances] Démarrage des mises à jour (modale ouverte)"
      );
      BalancesStore.startUpdates(
        provider,
        account,
        chainId,
        Object.values(activeTokens[chainId])
      );
    } else {
      console.debug(
        "⏹️ [TokenBalances] Arrêt des mises à jour (modale fermée)"
      );
      BalancesStore.stopUpdates();
    }

    return () => {
      console.debug("🧹 [TokenBalances] Nettoyage du hook");
      unsubscribe();
      if (!isModalOpen && BalancesStore.listeners.size === 0) {
        BalancesStore.stopUpdates();
      }
    };
  }, [
    isActive,
    chainId,
    provider,
    account,
    activeTokens,
    isModalOpen,
    initialLoadDone,
  ]);

  return {
    balances: BalancesStore.balances,
    loadingStates: BalancesStore.loadingStates,
  };
}
