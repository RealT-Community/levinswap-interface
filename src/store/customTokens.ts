import { atomWithStorage } from 'jotai/utils';
import { Token } from './tokenLists';

export interface CustomToken extends Token {
  imported: boolean;
  lastUpdated: number;
}

export interface CustomTokensState {
  [chainId: number]: {
    [address: string]: CustomToken;
  };
}

const defaultState: CustomTokensState = {};

export const customTokensAtom = atomWithStorage<CustomTokensState>('customTokens', defaultState);
