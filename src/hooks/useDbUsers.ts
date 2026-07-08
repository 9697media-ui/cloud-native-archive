import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export interface DbUser {
  user_id: string;
  name: string;
  email: string;
  role: string | null;
  permission_level: string | null;
  unit: string | null;
  is_active: boolean;
  is_beta_tester: boolean;
  created_at: string;
  view_restrictions?: any;
  bond_type?: string | null;
  partner_category?: string | null;
}

export function useDbUsers() {
  const { isAdmin } = useUserRole();
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, email, permission_level, unit, created_at, is_active, view_restrictions, is_beta_tester, bond_type')
        .order('created_at', { ascending: true });

      if (profileError) throw profileError;

      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      const roleMap = new Map<string, string>();
      if (roles) {
        for (const r of roles) {
          roleMap.set(r.user_id, r.role);
        }
      }

      const users: DbUser[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        name: p.name || p.email || 'Sem nome',
        email: p.email || '',
        role: roleMap.get(p.user_id) || null,
        permission_level: p.permission_level,
        unit: p.unit,
        is_active: (p as any).is_active !== false,
        is_beta_tester: (p as any).is_beta_tester === true,
        created_at: p.created_at,
        view_restrictions: (p as any).view_restrictions,
        bond_type: (p as any).bond_type ?? null,
      }));

      setDbUsers(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return { dbUsers, loading, refetch: fetchUsers };
}

