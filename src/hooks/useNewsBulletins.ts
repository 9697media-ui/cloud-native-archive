import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NewsBulletin {
  id: string;
  unit_id: string;
  profile_unit: string;
  title: string;
  category: string | null;
  header_data: any;
  blocks: any;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulletinPayload {
  unitId: string;
  profileUnit: string;
  title: string;
  category: string;
  headerData: any;
  modules: any[];
}

/**
 * Persistência dos informativos por unidade.
 * A leitura/escrita é filtrada no banco pelas políticas de RLS — aqui só
 * lidamos com o estado da interface e o autosave.
 */
export function useNewsBulletins() {
  const { user } = useAuth();
  const [bulletins, setBulletins] = useState<NewsBulletin[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const setCurrent = useCallback((id: string | null) => {
    currentIdRef.current = id;
    setCurrentId(id);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('news_bulletins')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (!error && data) setBulletins(data as NewsBulletin[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Cria ou atualiza o informativo em edição. Retorna o id persistido. */
  const persist = useCallback(
    async (payload: BulletinPayload): Promise<string | null> => {
      if (!user || !payload.profileUnit) return null;
      setSaving(true);
      try {
        const row = {
          unit_id: payload.unitId,
          profile_unit: payload.profileUnit,
          title: payload.title || 'Sem título',
          category: payload.category || null,
          header_data: payload.headerData,
          blocks: payload.modules,
        };

        if (currentIdRef.current) {
          const { error } = await supabase
            .from('news_bulletins')
            .update(row)
            .eq('id', currentIdRef.current);
          if (error) return null;
        } else {
          const { data, error } = await supabase
            .from('news_bulletins')
            .insert({ ...row, created_by: user.id })
            .select('id')
            .single();
          if (error || !data) return null;
          setCurrent(data.id);
        }

        setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        refresh();
        return currentIdRef.current;
      } finally {
        setSaving(false);
      }
    },
    [user, refresh, setCurrent],
  );

  const remove = useCallback(
    async (id: string) => {
      await supabase.from('news_bulletins').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (currentIdRef.current === id) setCurrent(null);
      refresh();
    },
    [refresh, setCurrent],
  );

  const duplicate = useCallback(
    async (bulletin: NewsBulletin) => {
      if (!user) return;
      await supabase.from('news_bulletins').insert({
        unit_id: bulletin.unit_id,
        profile_unit: bulletin.profile_unit,
        title: `${bulletin.title} (cópia)`,
        category: bulletin.category,
        header_data: bulletin.header_data,
        blocks: bulletin.blocks,
        created_by: user.id,
      });
      refresh();
    },
    [user, refresh],
  );

  return { bulletins, loading, saving, savedAt, currentId, setCurrent, persist, remove, duplicate, refresh };
}
