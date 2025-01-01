import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const tokenImagesDir = path.join(
      process.cwd(),
      "public",
      "images",
      "tokens"
    );

    if (!fs.existsSync(tokenImagesDir)) {
      console.error("Dossier non trouvé:", tokenImagesDir);
      return NextResponse.json({
        error: "Dossier d'images non trouvé",
        path: tokenImagesDir,
      });
    }

    const files = fs.readdirSync(tokenImagesDir);
    const imageUrls: Record<string, string> = {};

    files.forEach((file) => {
      if (file.endsWith(".png")) {
        // Nettoyer le nom du fichier (enlever " copy" s'il existe)
        const cleanFileName = file.replace(" copy", "");
        // Utiliser le nom du fichier comme clé (sans l'extension)
        const key = cleanFileName.replace(".png", "").toLowerCase();
        // Construire l'URL complète
        imageUrls[key] = `/${file}`;
      }
    });

    // Ajouter l'image par défaut si elle existe
    if (fs.existsSync(path.join(tokenImagesDir, "default.png"))) {
      imageUrls["default"] = "/images/tokens/default.png";
    }

    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error("Erreur détaillée:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
    });

    return NextResponse.json({
      error: "Erreur lors du chargement des images",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
