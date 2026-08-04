import { useCallback, useEffect, useState } from 'react';
import type { JournalPaper } from './types';

/**
 * Preferência de papel — global por unidade (decisão aprovada).
 * Persistida localmente para não exigir mudança de schema/RLS.
 */
const KEY = (unitId: string | null) => `journal-paper:${unitId ?? 'geral'}`;

export function readPaper(unitId: string | null): JournalPaper {
  if (typeof window === 'undefined') return 'branco';
  const stored = window.localStorage.getItem(KEY(unitId));
  return stored === 'offwhite' ? 'offwhite' : 'branco';
}

export function useUnitPaper(unitId: string | null) {
  const [paper, setPaperState] = useState<JournalPaper>(() => readPaper(unitId));

  useEffect(() => {
    setPaperState(readPaper(unitId));
  }, [unitId]);

  const setPaper = useCallback(
    (next: JournalPaper) => {
      window.localStorage.setItem(KEY(unitId), next);
      setPaperState(next);
    },
    [unitId],
  );

  return { paper, setPaper };
}
