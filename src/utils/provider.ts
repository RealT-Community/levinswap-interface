import { ethers } from "ethers";

/**
 * Récupère le provider Web3 en fonction de l'environnement.
 * @returns Le provider Web3.
 */
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    // Utiliser le provider de MetaMask ou d'autres wallets
    return new ethers.providers.Web3Provider(window.ethereum);
  } else {
    // Retourner un provider par défaut (par exemple, un provider JSON-RPC)
    const network = "gnosis";
    if (network === "gnosis") {
      return new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_GNOSIS_RPC_URL ?? ""
      ); // URL du RPC pour Gnosis
    }
    throw new Error("Unsupported network");
  }
};
