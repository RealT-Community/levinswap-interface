"use client";

import { AvailableConnectors } from "@realtoken/realt-commons";
import { useCallback, useEffect } from "react";
import { useWeb3Store } from "./useWeb3Store";

const LAST_WALLET_KEY = "lastWalletType";
const DISCONNECT_FLAG = "walletDisconnected";

export function useWeb3() {
  const {
    account,
    provider,
    chainId,
    isActive,
    connectorsMap,
    error,
    setError,
    walletType,
    setWalletType,
  } = useWeb3Store();

  // Tentative de reconnexion automatique
  useEffect(() => {
    if (!connectorsMap || isActive) return;

    // Ne pas tenter de reconnexion si l'utilisateur s'est déconnecté explicitement
    if (localStorage.getItem(DISCONNECT_FLAG) === "true") return;

    const lastWallet = localStorage.getItem(
      LAST_WALLET_KEY
    ) as AvailableConnectors | null;
    if (!lastWallet) return;

    const tryReconnect = async () => {
      try {
        const connector = connectorsMap.get(lastWallet);
        if (!connector) return;

        await connector.connector.connectEagerly?.();
        setWalletType(lastWallet);
      } catch (error) {
        console.error("Erreur de reconnexion:", error);
        localStorage.removeItem(LAST_WALLET_KEY);
        localStorage.removeItem(DISCONNECT_FLAG);
      }
    };

    tryReconnect();
  }, [connectorsMap, isActive, setWalletType]);

  const connect = useCallback(
    async (connectorType: AvailableConnectors) => {
      try {
        setError(undefined);

        if (!connectorsMap) {
          throw new Error("Connecteurs non initialisés. Veuillez patienter...");
        }

        const connector = connectorsMap.get(connectorType);
        if (!connector) {
          throw new Error(`Connecteur ${connectorType} non disponible`);
        }

        // Supprimer le flag de déconnexion lors d'une nouvelle tentative de connexion
        localStorage.removeItem(DISCONNECT_FLAG);
        await connector.connector.activate();
        setWalletType(connectorType);
        localStorage.setItem(LAST_WALLET_KEY, connectorType);
      } catch (error) {
        console.error("Erreur de connexion:", error);
        setError(error instanceof Error ? error : new Error("Erreur inconnue"));
        throw error;
      }
    },
    [connectorsMap, setError, setWalletType]
  );

  const disconnect = useCallback(async () => {
    try {
      setError(undefined);

      if (!connectorsMap) {
        throw new Error("Connecteurs non initialisés");
      }

      // Marquer comme déconnecté explicitement
      localStorage.setItem(DISCONNECT_FLAG, "true");

      // Déconnecter tous les connecteurs actifs
      for (const [_, connector] of connectorsMap.entries()) {
        if (connector?.connector.deactivate) {
          await connector.connector.deactivate();
        }
      }
      setWalletType(undefined);

      // Forcer le rechargement pour un nettoyage complet
      window.location.reload();
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      setError(error instanceof Error ? error : new Error("Erreur inconnue"));
      throw error;
    }
  }, [connectorsMap, setError, setWalletType]);

  return {
    account,
    provider,
    chainId,
    active: isActive,
    error,
    connect,
    disconnect,
    isInitialized: !!connectorsMap,
    walletType,
  };
}
