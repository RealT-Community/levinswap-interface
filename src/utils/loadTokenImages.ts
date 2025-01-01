import { updateTokenImagesCache } from "@/constants/tokenImages";

// Fonction pour charger les images des tokens depuis l'API
export async function loadTokenImages(): Promise<void> {
  try {
    const response = await fetch("/api/load-token-images");
    const data = await response.json();
    console.log("loadTokenImages", data);
    if ("error" in data) {
      console.error("Erreur API:", data.error);
      return;
    }

    // Mettre à jour le cache avec les URLs des images
    updateTokenImagesCache(data);
  } catch (error) {
    console.error("Erreur lors du chargement des images de tokens:", error);
  }
}
