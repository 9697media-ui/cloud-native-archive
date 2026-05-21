import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { APP_VERSION, APP_ENV } from "@/lib/version";

export interface ActiveVersion {
  id: string;
  name: string;
  commit_sha: string | null;
  environment: string | null;
  is_active_beta: boolean | null;
  is_active_production: boolean | null;
  deployed_at: string | null;
}

/**
 * Determines which version the current user should be seeing
 * (beta tester -> active beta version, otherwise active production).
 * Returns a mismatch flag when the currently-loaded bundle is older.
 */
export function useActiveVersion() {
  const { isBetaTester, isAdmin } = useUserRole();
  const [active, setActive] = useState<ActiveVersion | null>(null);
  const [loading, setLoading] = useState(true);

  const shouldSeeBeta = isBetaTester || isAdmin;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const column = shouldSeeBeta ? "is_active_beta" : "is_active_production";
      const { data } = await supabase
        .from("ui_versions")
        .select("id,name,commit_sha,environment,is_active_beta,is_active_production,deployed_at")
        .eq(column, true)
        .order("deployed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setActive((data as any) || null);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [shouldSeeBeta]);

  const hasMismatch =
    !!active?.commit_sha && active.commit_sha !== APP_VERSION;

  return {
    active,
    loading,
    hasMismatch,
    currentCommit: APP_VERSION,
    currentEnv: APP_ENV,
  };
}
