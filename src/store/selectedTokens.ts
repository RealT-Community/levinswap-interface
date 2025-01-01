import { atomWithStorage } from 'jotai/utils';
import { Token } from './tokenLists';

interface SelectedTokensState {
  [chainId: number]: {
    fromToken?: Token;
    toToken?: Token;
  };
}

const defaultState: SelectedTokensState = {};

// Atom pour stocker les tokens sélectionnés
export const selectedTokensAtom = atomWithStorage<SelectedTokensState>(
  'selectedTokens_v1',
  defaultState
);
