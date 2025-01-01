'use client';

import { useInitTokenLists } from '@/hooks/useInitTokenLists';
import { PropsWithChildren } from 'react';

export function TokenListsProvider({ children }: PropsWithChildren) {
  // Initialiser les token lists
  useInitTokenLists();

  return <>{children}</>;
}
