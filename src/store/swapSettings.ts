import { atomWithStorage } from 'jotai/utils';

interface SwapSettings {
  slippageTolerance: number;
  slippageMode: string;
  transactionDeadline: number;
  expertMode: boolean;
}

const defaultSettings: SwapSettings = {
  slippageTolerance: 0.5,
  slippageMode: "0.5",
  transactionDeadline: 20,
  expertMode: false,
};

export const swapSettingsAtom = atomWithStorage<SwapSettings>('swapSettings', defaultSettings);
