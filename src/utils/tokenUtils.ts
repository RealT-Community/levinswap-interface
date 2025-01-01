import { NATIVE_TOKEN } from "@/config/constants";
import { Token } from "@/store/tokenLists";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Cache pour les décimales des tokens
const decimalsCache: { [address: string]: number } = {};

// Fonction pour récupérer les décimales d'un token
export async function getTokenDecimals(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<number> {
  // Si c'est le token natif, retourner ses décimales
  if (
    tokenAddress.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
  ) {
    return NATIVE_TOKEN.DECIMALS;
  }

  // Vérifier le cache
  if (decimalsCache[tokenAddress.toLowerCase()]) {
    return decimalsCache[tokenAddress.toLowerCase()];
  }

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    // Mettre en cache
    decimalsCache[tokenAddress.toLowerCase()] = decimals;
    return decimals;
  } catch (error) {
    console.error("Erreur lors de la récupération des décimales:", error);
    return 18; // Valeur par défaut si erreur
  }
}

// Fonction pour formater un montant en tenant compte des décimales
export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    return ethers.utils.formatUnits(amount, decimals);
  } catch (error) {
    console.error("Erreur lors du formatage du montant:", error);
    return "0";
  }
}

// Fonction pour parser un montant en tenant compte des décimales
export function parseTokenAmount(amount: string, decimals: number): string {
  try {
    return ethers.utils.parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error("Erreur lors du parsing du montant:", error);
    return "0";
  }
}

// Fonction pour obtenir les décimales d'un token (depuis la liste ou le contrat)
export async function getTokenDecimalsFromToken(
  token: Token,
  provider: ethers.providers.Provider
): Promise<number> {
  // Si les décimales sont définies dans le token, les utiliser
  if (typeof token.decimals === "number") {
    return token.decimals;
  }

  // Sinon, les récupérer depuis le contrat
  return getTokenDecimals(token.address, provider);
}

// Fonction pour récupérer la balance d'un token
export async function getTokenBalance(
  tokenAddress: string,
  account: string,
  provider: ethers.providers.Provider
): Promise<string> {
  try {
    // Si c'est le token natif (xDAI)
    if (
      tokenAddress.toLowerCase() === NATIVE_TOKEN.NATIVE_ADDRESS.toLowerCase()
    ) {
      const balance = await provider.getBalance(account);
      return ethers.utils.formatUnits(balance, NATIVE_TOKEN.DECIMALS);
    }

    // Pour les autres tokens ERC20
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    try {
      // Utiliser le cache des décimales si disponible
      let decimals = decimalsCache[tokenAddress.toLowerCase()];
      if (!decimals) {
        decimals = await contract.decimals();
        decimalsCache[tokenAddress.toLowerCase()] = decimals;
      }

      const balance = await contract.balanceOf(account);
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations du token:",
        error
      );
      return "0.0";
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la balance:", error);
    return "0.0";
  }
}
