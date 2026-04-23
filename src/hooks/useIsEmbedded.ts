import { useMemo } from 'react';

export function useIsEmbedded() {
  return useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);
}
