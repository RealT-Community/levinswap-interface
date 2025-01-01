'use client';

import { useEffect } from 'react';
import { metaMask } from '@realtoken/realt-commons';

export function useEagerConnect() {
  useEffect(() => {
    const tryConnect = async () => {
      try {
        // Try MetaMask first
        if (metaMask.connectEagerly) {
          await metaMask.connectEagerly();
        }
      } catch (error) {
        // Silent error
      }
    };

    tryConnect();
  }, []);
}
