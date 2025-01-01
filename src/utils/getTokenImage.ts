import { useTokenLists } from "@/hooks/useTokenLists";
import { Token } from "@/store/tokenLists";

/**
 * Gère l'erreur de chargement d'image en remplaçant par l'image par défaut
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>
) => {
  const img = event.currentTarget;
  img.src = "/images/tokens/default.png";
};

/**
 * Hook pour récupérer l'URL de l'image d'un token
 * @param token Le token dont on veut l'image
 * @returns L'URL de l'image du token
 */
export function useTokenImage(token: Token): string {
  const { lists } = useTokenLists();

  // Fonction pour trouver le token dans les listes
  const findTokenInLists = (address: string) => {
    const normalizedAddress = address.toLowerCase();
    for (const list of lists) {
      const foundToken = list.tokens.find(
        (t) => t.address.toLowerCase() === normalizedAddress
      );
      if (foundToken?.logoURI) {
        return foundToken.logoURI;
      }
    }
    return null;
  };

  // 1. Chercher dans les token lists
  const logoFromLists = findTokenInLists(token.address);
  if (logoFromLists) {
    return logoFromLists;
  }

  // 2. Vérifier si le token a déjà un logoURI
  if (token.logoURI) {
    return token.logoURI;
  }

  // 3. Construire le chemin pour les images locales
  const localPath = `/images/tokens/${token.address.toLowerCase()}.png`;

  // 4. Retourner l'image par défaut si rien n'est trouvé
  return localPath;
}
