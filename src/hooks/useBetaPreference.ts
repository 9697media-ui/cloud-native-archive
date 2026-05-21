import { useEffect, useState, useCallback } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

const STORAGE_KEY = 'beta_ui_enabled';

export function useBetaPreference() {
  const { isBetaTester, isAdmin } = useUserRole();
  const eligible = isBetaTester || isAdmin;

  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEnabled(e.newValue === null ? true : e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = useCallback((value?: boolean) => {
    setEnabled((prev) => {
      const next = typeof value === 'boolean' ? value : !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return {
    eligible,
    betaEnabled: eligible && enabled,
    rawEnabled: enabled,
    toggleBeta: toggle,
  };
}
