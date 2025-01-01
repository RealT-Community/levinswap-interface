/**
 * Formate un nombre pour l'affichage
 * - Si le nombre est inférieur à 0.000001, affiche "< 0.000001"
 * - Si le nombre est inférieur à 1, affiche 6 décimales
 * - Si le nombre est supérieur à 1, affiche 2 décimales
 * - Ajoute des séparateurs de milliers avec des apostrophes
 */
export function formatNumber(value: number): string {
  if (value === 0) return "0";

  if (value < 0.000001) {
    return "< 0.000001";
  }

  if (value < 1) {
    return value.toFixed(6);
  }

  // Formatter avec 2 décimales et séparateurs de milliers
  const parts = value.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return parts.join(".");
}

/**
 * Formate un nombre pour l'affichage avec un nombre spécifique de décimales
 */
export function formatNumberWithDecimals(
  value: number,
  decimals: number = 2
): string {
  if (value === 0) return "0";

  const parts = value.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return parts.join(".");
}

/**
 * Formate un nombre pour l'affichage en notation compacte
 * Exemple : 1'234'567 -> 1.23M
 */
export function formatCompactNumber(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return formatted.replace(/,/g, "'");
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return num.toFixed(2);
}
