import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaPreference } from '@/hooks/useBetaPreference';
import { APP_VERSION, APP_ENV } from '@/lib/version';

export interface UIVersion {
  id: string;
  name: string;
  description: string;
  config_json: any;
  created_at: string;
  created_by: string;
  commit_sha?: string | null;
  environment?: string | null;
  is_active_beta?: boolean | null;
  is_active_production?: boolean | null;
  deployed_at?: string | null;
  deployed_by?: string | null;
}

export function useUIVersions() {
  const { user } = useAuth();
  const { isAdmin, isBetaTester } = useUserRole();
  const { betaEnabled, eligible: betaEligible, toggleBeta } = useBetaPreference();
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

    // 1. Create new version entry — tag with current commit/env, mark as active prod + beta
    const { data: newVersion, error: vError } = await supabase
      .from('ui_versions')
      .insert({
        name,
        description,
        config_json: config,
        created_by: user.id,
        commit_sha: APP_VERSION,
        environment: APP_ENV,
        deployed_by: user.email || user.id,
        deployed_at: new Date().toISOString(),
        is_active_beta: true,
        is_active_production: true,
      })
      .select()
      .single();

    if (vError) throw vError;

    // 2. Update current version in system_configs (legacy compat)
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

    // Also mark as active production (trigger clears others)
    await supabase
      .from('ui_versions')
      .update({ is_active_production: true })
      .eq('id', version.id);

    await fetchConfig();
    await fetchVersions();
  };

  const setActiveBeta = async (version: UIVersion) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from('ui_versions')
      .update({ is_active_beta: true })
      .eq('id', version.id);
    if (error) throw error;
    await fetchVersions();
  };

  const promoteVersionToProduction = async (version: UIVersion) => {
    if (!isAdmin || !user) return;
    const { error } = await supabase
      .from('ui_versions')
      .update({ is_active_production: true, is_active_beta: true })
      .eq('id', version.id);
    if (error) throw error;
    await supabase
      .from('system_configs')
      .upsert({
        key: 'current_ui_version',
        value: { id: version.id, name: version.name, config: version.config_json },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
    await fetchConfig();
    await fetchVersions();
  };

  // Determine if the user should see the Beta UI
  const showBetaUI = betaEnabled;

  return {
    currentVersion,
    versions,
    loading,
    promoteToProduction,
    rollback,
    setActiveBeta,
    promoteVersionToProduction,
    showBetaUI,
    betaEligible,
    toggleBeta,
    refresh: fetchConfig,
  };
}
