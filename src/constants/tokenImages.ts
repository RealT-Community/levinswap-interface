// Mapping des adresses de tokens vers leurs images par défaut
export const TOKEN_IMAGES: Record<string, string> = {
  // Images par défaut si nécessaire
  default: "default.png",
};

// Cache des images de tokens
export const tokenImagesCache: Record<string, string> = {
  ...TOKEN_IMAGES,
};

// Fonction pour normaliser une adresse
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

// Fonction pour mettre à jour le cache
export function updateTokenImagesCache(images: { [key: string]: string }) {
  Object.assign(tokenImagesCache, images);
}

// Fonction pour obtenir une image du cache
export function getTokenImageFromCache(address: string): string | undefined {
  const normalizedAddress = normalizeAddress(address);
  return tokenImagesCache[normalizedAddress];
}

// Initialiser le cache au démarrage
if (typeof window !== "undefined") {
  import("../utils/loadTokenImages").then(({ loadTokenImages }) => {
    loadTokenImages().catch((error) => {
      console.error("Erreur lors du chargement initial des images:", error);
    });
  });
}
