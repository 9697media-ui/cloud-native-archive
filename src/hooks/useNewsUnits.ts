import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewsUnit, toNewsUnit } from '@/lib/news/units';

/**
 * Lista as unidades institucionais a partir de `transparency_configs`.
 * Somente leitura — não cria nem altera registros.
 */
export function useNewsUnits(includeFinished = false) {
  const [units, setUnits] = useState<NewsUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('transparency_configs')
          .select('id, label, original_folder_name')
          .order('original_folder_name', { ascending: true });

        if (error) throw error;
        if (!active) return;

        const mapped = (data ?? [])
          .map((row: any) => toNewsUnit(row))
          .filter((unit) => (includeFinished ? true : !unit.finished))
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        setUnits(mapped);
      } catch (err) {
        console.error('Falha ao carregar unidades:', err);
        if (active) setUnits([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [includeFinished]);

  return { units, isLoading };
}
