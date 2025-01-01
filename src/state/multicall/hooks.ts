import { Interface } from '@ethersproject/abi';
import { useEffect, useMemo } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { Contract } from '@ethersproject/contracts';

interface CallResult {
  readonly valid: boolean;
  readonly data: string | undefined;
  readonly blockNumber: number | undefined;
}

interface CallState {
  readonly valid: boolean;
  readonly result: any | undefined;
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly error: boolean;
}

export interface Result extends CallState {
  // the result from the ethers call
  result: any;
}

/**
 * Fetches multiple contract data in a single multicall
 */
export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: any[]
): Result[] {
  const { provider } = useWeb3();

  const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName]);

  const calls = useMemo(
    () =>
      fragment && addresses && addresses.length > 0
        ? addresses.map<[string, string]>((address) => {
            return [
              address ?? '',
              contractInterface.encodeFunctionData(fragment, callInputs ?? [])
            ];
          })
        : [],
    [addresses, callInputs, contractInterface, fragment]
  );

  const results = useMemo(() => {
    return calls.map(() => ({
      valid: true,
      loading: true,
      syncing: true,
      result: undefined,
      error: false
    }));
  }, [calls]);

  useEffect(() => {
    if (!provider || !fragment || !calls.length) return;

    let mounted = true;

    const fetchData = async () => {
      try {
        const contracts = calls.map(
          ([address]) => new Contract(address, contractInterface, provider)
        );

        const results = await Promise.all(
          contracts.map((contract) =>
            contract[methodName](...(callInputs ?? []))
          )
        );

        if (!mounted) return;

        return results.map((result) => ({
          valid: true,
          loading: false,
          syncing: false,
          result,
          error: false
        }));
      } catch (error) {
        console.error('Failed to fetch contract data:', error);
        return calls.map(() => ({
          valid: false,
          loading: false,
          syncing: false,
          result: undefined,
          error: true
        }));
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [provider, fragment, calls, methodName, callInputs, contractInterface]);

  return results;
}
