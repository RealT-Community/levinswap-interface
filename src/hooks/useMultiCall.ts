import { LEVINSWAP_CONFIG } from "@/config/constants";
import { useWeb3Store } from "@/hooks/useWeb3Store";
import { ethers } from "ethers";
import { useCallback } from "react";

const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
];

export interface MultiCallResult {
  returnData: string;
  success: boolean;
}

interface Call {
  target: string;
  callData: string;
}

interface MultiCall {
  call: (calls: Call[]) => Promise<MultiCallResult[]>;
}

export function useMultiCall(): MultiCall | null {
  const { provider } = useWeb3Store();

  const call = useCallback(
    async (calls: Call[]): Promise<MultiCallResult[]> => {
      if (!provider || !calls.length) return [];

      try {
        const multicall = new ethers.Contract(
          LEVINSWAP_CONFIG.MULTICALL_ADDRESS,
          MULTICALL_ABI,
          provider
        );

        // Diviser les appels en lots de 500 pour éviter les timeouts
        const batchSize = 500;
        const results: MultiCallResult[] = [];

        for (let i = 0; i < calls.length; i += batchSize) {
          const batch = calls.slice(i, i + batchSize);
          try {
            const [, returnData] = await multicall.aggregate(
              batch.map((call) => [call.target, call.callData])
            );

            results.push(
              ...returnData.map((data: string) => ({
                returnData: data,
                success: true,
              }))
            );
          } catch (error) {
            console.error(`Erreur sur le lot ${i}-${i + batch.length}:`, error);
            // En cas d'erreur sur un lot, on ajoute des résultats vides pour maintenir l'index
            results.push(
              ...Array(batch.length).fill({
                returnData: "0x",
                success: false,
              })
            );
          }
        }

        return results;
      } catch (error) {
        console.error("Erreur lors de l'appel multicall:", error);
        // Retourner un tableau de la même taille que les appels, mais avec des erreurs
        return calls.map(() => ({
          returnData: "0x",
          success: false,
        }));
      }
    },
    [provider]
  );

  if (!provider) return null;

  return { call };
}
