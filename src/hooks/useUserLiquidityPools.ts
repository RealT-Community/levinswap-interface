import { LEVINSWAP_CONFIG } from "@/config/constants";
import { useMultiCall } from "@/hooks/useMultiCall";
import { useTokenLists } from "@/hooks/useTokenLists";
import { useWeb3Store } from "@/hooks/useWeb3Store";
import { Token } from "@/store/tokenLists";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { useCallback, useEffect, useReducer, useRef } from "react";

// Configure BigNumber pour une précision maximale
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-100, 100],
});

const FACTORY_ABI = [
  "function allPairs(uint) view returns (address)",
  "function allPairsLength() view returns (uint)",
];

const PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function balanceOf(address) view returns (uint)",
  "function totalSupply() view returns (uint)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

interface UserPool {
  token0: Token;
  token1: Token;
  reserves: {
    reserve0: string;
    reserve1: string;
  };
  userShare: string;
  lpTokens: string;
  lpToken: Token;
  pairAddress: string;
}

interface State {
  pools: UserPool[];
  isLoading: boolean;
  progress: number;
  error: string | null;
  lastUpdate: number;
}

type Action =
  | { type: "START_LOADING" }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_POOLS"; payload: UserPool[] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "FINISH_LOADING" };

const initialState: State = {
  pools: [],
  isLoading: false,
  progress: 0,
  error: null,
  lastUpdate: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_LOADING":
      return {
        ...state,
        isLoading: true,
        progress: 0,
        error: null,
      };
    case "SET_PROGRESS":
      return {
        ...state,
        progress: action.payload,
      };
    case "SET_POOLS":
      return {
        ...state,
        pools: action.payload,
        lastUpdate: Date.now(),
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        pools: [],
      };
    case "RESET":
      return {
        ...initialState,
        lastUpdate: state.lastUpdate,
      };
    case "FINISH_LOADING":
      return {
        ...state,
        isLoading: false,
        progress: 100,
      };
    default:
      return state;
  }
}

const BATCH_SIZE = 250;
const CACHE_DURATION = 60 * 60 * 1000; // 5 minutes

// Cache global pour les pools
let globalPoolsCache: {
  pools: UserPool[];
  timestamp: number;
} | null = null;

export function useUserLiquidityPools(shouldLoad: boolean) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    // Initialiser l'état directement avec le cache si disponible
    pools: globalPoolsCache?.pools || [],
    lastUpdate: globalPoolsCache?.timestamp || 0,
  });

  const multiCall = useMultiCall();
  const { provider, account } = useWeb3Store();
  const { lists } = useTokenLists();
  const isMounted = useRef(true);
  const fetchingRef = useRef(false);

  const fetchPoolBatch = useCallback(
    async (
      pairAddresses: string[],
      pairInterface: ethers.utils.Interface,
      allTokens: Token[],
      account: string
    ): Promise<UserPool[]> => {
      if (!multiCall) throw new Error("MultiCall not initialized");

      const balanceCalls = pairAddresses.map((pairAddress) => ({
        target: pairAddress,
        callData: pairInterface.encodeFunctionData("balanceOf", [account]),
      }));

      const balanceResults = await multiCall.call(balanceCalls);

      const pairsWithBalanceData = pairAddresses
        .map((address, index) => {
          const balance = balanceResults[index]?.success
            ? pairInterface.decodeFunctionResult(
                "balanceOf",
                balanceResults[index].returnData
              )[0]
            : ethers.BigNumber.from(0);
          return {
            address,
            balance,
            hasBalance: balance.gt(0),
          };
        })
        .filter((pair) => pair.hasBalance);

      if (pairsWithBalanceData.length === 0) return [];

      const pairsWithBalance = pairsWithBalanceData.map((p) => p.address);
      const balances = pairsWithBalanceData.map((p) => p.balance);

      const [
        reservesResults,
        token0Results,
        token1Results,
        totalSupplyResults,
      ] = await Promise.all([
        multiCall.call(
          pairsWithBalance.map((addr) => ({
            target: addr,
            callData: pairInterface.encodeFunctionData("getReserves"),
          }))
        ),
        multiCall.call(
          pairsWithBalance.map((addr) => ({
            target: addr,
            callData: pairInterface.encodeFunctionData("token0"),
          }))
        ),
        multiCall.call(
          pairsWithBalance.map((addr) => ({
            target: addr,
            callData: pairInterface.encodeFunctionData("token1"),
          }))
        ),
        multiCall.call(
          pairsWithBalance.map((addr) => ({
            target: addr,
            callData: pairInterface.encodeFunctionData("totalSupply"),
          }))
        ),
      ]);

      const userPools: UserPool[] = [];

      for (let i = 0; i < pairsWithBalance.length; i++) {
        try {
          const balance = balances[i];
          if (!balance || balance.isZero()) continue;

          const token0Address = token0Results[i]?.success
            ? pairInterface
                .decodeFunctionResult("token0", token0Results[i].returnData)[0]
                .toLowerCase()
            : null;
          const token1Address = token1Results[i]?.success
            ? pairInterface
                .decodeFunctionResult("token1", token1Results[i].returnData)[0]
                .toLowerCase()
            : null;

          const token0 = token0Address
            ? allTokens.find((t) => t.address.toLowerCase() === token0Address)
            : null;
          const token1 = token1Address
            ? allTokens.find((t) => t.address.toLowerCase() === token1Address)
            : null;

          if (!token0 || !token1 || !reservesResults[i]?.success) continue;

          const reserves = pairInterface.decodeFunctionResult(
            "getReserves",
            reservesResults[i].returnData
          );
          const totalSupply = totalSupplyResults[i]?.success
            ? pairInterface.decodeFunctionResult(
                "totalSupply",
                totalSupplyResults[i].returnData
              )[0]
            : ethers.BigNumber.from(0);

          if (totalSupply.isZero()) continue;

          // Utiliser BigNumber.js pour une précision maximale
          const balanceBN = new BigNumber(balance.toString());
          const totalSupplyBN = new BigNumber(totalSupply.toString());

          // Calculer le pourcentage avec précision maximale
          const sharePercentage = balanceBN
            .dividedBy(totalSupplyBN)
            .multipliedBy(100)
            .toFixed(18); // Garder toute la précision

          if (new BigNumber(sharePercentage).isZero()) continue;

          userPools.push({
            token0,
            token1,
            reserves: {
              reserve0: reserves[0].toString(),
              reserve1: reserves[1].toString(),
            },
            userShare: sharePercentage,
            lpTokens: ethers.utils.formatEther(balance),
            lpToken: {
              chainId: token0.chainId,
              address: pairsWithBalance[i],
              name: `${token0.symbol}-${token1.symbol} LP`,
              symbol: `${token0.symbol}-${token1.symbol}-LP`,
              decimals: 18,
              logoURI: "",
            },
            pairAddress: pairsWithBalance[i],
          });
        } catch (error) {
          console.error(`Error processing pair ${pairsWithBalance[i]}:`, error);
        }
      }

      return userPools;
    },
    [multiCall]
  );

  const fetchPools = useCallback(
    async (forceRefresh = false) => {
      if (
        !multiCall ||
        !provider ||
        !account ||
        fetchingRef.current ||
        !isMounted.current
      )
        return;

      // Vérifier si le cache est valide
      if (
        !forceRefresh &&
        globalPoolsCache &&
        globalPoolsCache.pools &&
        globalPoolsCache.pools.length > 0 &&
        Date.now() - (globalPoolsCache?.timestamp || 0) < CACHE_DURATION
      ) {
        return;
      }

      try {
        fetchingRef.current = true;
        dispatch({ type: "START_LOADING" });

        const factory = new ethers.Contract(
          LEVINSWAP_CONFIG.FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );

        const pairInterface = new ethers.utils.Interface(PAIR_ABI);
        const allTokens = lists.flatMap((list) => list.tokens);
        const pairCount = await factory.allPairsLength();
        const totalPairs = pairCount.toNumber();
        let processedPairs = 0;
        let userPools: UserPool[] = [];

        for (let i = 0; i < totalPairs; i += BATCH_SIZE) {
          if (!isMounted.current) return;

          const batch = await Promise.all(
            Array.from(
              { length: Math.min(BATCH_SIZE, totalPairs - i) },
              (_, j) => factory.allPairs(i + j)
            )
          );

          const batchPools = await fetchPoolBatch(
            batch,
            pairInterface,
            allTokens,
            account
          );

          if (!isMounted.current) return;

          userPools = [...userPools, ...batchPools];
          processedPairs += batch.length;

          if (isMounted.current) {
            dispatch({
              type: "SET_PROGRESS",
              payload: Math.floor((processedPairs / totalPairs) * 100),
            });
          }
        }

        if (isMounted.current) {
          // Mettre à jour le cache global
          globalPoolsCache = {
            pools: userPools,
            timestamp: Date.now(),
          };
          dispatch({ type: "SET_POOLS", payload: userPools });
        }
      } catch (error: any) {
        console.error("Error fetching pools:", error);
        if (isMounted.current) {
          dispatch({
            type: "SET_ERROR",
            payload: error?.message || "Erreur lors du chargement des pools",
          });
        }
      } finally {
        if (isMounted.current) {
          dispatch({ type: "FINISH_LOADING" });
        }
        fetchingRef.current = false;
      }
    },
    [multiCall, provider, account, lists, fetchPoolBatch]
  );

  useEffect(() => {
    isMounted.current = true;

    if (shouldLoad) {
      // Vérifier si on doit charger depuis la blockchain
      if (
        !globalPoolsCache?.pools.length ||
        Date.now() - (globalPoolsCache?.timestamp || 0) >= CACHE_DURATION
      ) {
        fetchPools();
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [shouldLoad, fetchPools]);

  return {
    pools: state.pools,
    isLoading: state.isLoading,
    progress: state.progress,
    error: state.error,
    refetch: useCallback(() => fetchPools(true), [fetchPools]),
  };
}
