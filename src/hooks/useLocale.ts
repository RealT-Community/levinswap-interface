'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocaleStore {
  locale: string;
  setLocale: (locale: string) => void;
}

export const useLocale = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale: string) => set({ locale }),
    }),
    {
      name: 'locale-storage',
    }
  )
);
