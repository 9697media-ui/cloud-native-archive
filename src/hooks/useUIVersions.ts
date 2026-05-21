import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface UIVersion {
  id: string;
  name: string;
  description: string;
  config_json: any;
  created_at: string;
  created_by: string;
}

export function useUIVersions() {
  const { user } = useAuth();
  const { isAdmin, isBetaTester } = useUserRole();
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [versions, setVersions] = useState<UIVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'current_ui_version')
      .maybeSingle();
    
    if (data) {
      setCurrentVersion(data.value);
    }
  };

  const fetchVersions = async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('ui_versions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setVersions(data as UIVersion[]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchConfig();
      if (isAdmin) await fetchVersions();
      setLoading(false);
    };
    init();
  }, [isAdmin]);

  const promoteToProduction = async (name: string, description: string, config: any) => {
    if (!isAdmin || !user) return;

    // 1. Create new version entry
    const { data: newVersion, error: vError } = await supabase
      .from('ui_versions')
      .insert({
        name,
        description,
        config_json: config,
        created_by: user.id
      })
      .select()
      .single();

    if (vError) throw vError;

    // 2. Update current version in system_configs
    const { error: cError } = await supabase
      .from('system_configs')
      .upsert({
        key: 'current_ui_version',
        value: { id: newVersion.id, name, config },
        updated_by: user.id,
        updated_at: new Date().toISOString()
      });

    if (cError) throw cError;

    await fetchConfig();
    await fetchVersions();
    return newVersion;
  };

  const rollback = async (version: UIVersion) => {
    if (!isAdmin || !user) return;

    const { error } = await supabase
      .from('system_configs')
      .upsert({
        key: 'current_ui_version',
        value: { id: version.id, name: version.name, config: version.config_json },
        updated_by: user.id,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    await fetchConfig();
  };

  // Determine if the user should see the Beta UI
  // User sees Beta if:
  // 1. They are a designated Beta Tester
  // 2. They are an Admin (always see latest or can toggle)
  const showBetaUI = isBetaTester || isAdmin;

  return {
    currentVersion,
    versions,
    loading,
    promoteToProduction,
    rollback,
    showBetaUI,
    refresh: fetchConfig
  };
}
