const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

// Fonction utilitaire pour attendre un délai
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fonction utilitaire pour retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(
        `Tentative échouée, reste ${retries} essais. Attente de ${delay}ms...`
      );
      await wait(delay);
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}
