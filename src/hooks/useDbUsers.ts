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
  created_at: string;
}

export function useDbUsers() {
  const { isAdmin } = useUserRole();
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, email, permission_level, unit, created_at, is_active')
        .order('created_at', { ascending: true });

      if (profileError) throw profileError;

      // Fetch all roles
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
        created_at: p.created_at,
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
