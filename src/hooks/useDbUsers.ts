import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export interface DbUser {
  user_id: string;
  name: string;
  email: string;
  role: string | null;
  created_at: string;
}

export function useDbUsers() {
  const { isAdmin } = useUserRole();
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!isAdmin) {
      setDbUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, email, created_at')
      .order('created_at', { ascending: true });

    // Fetch all roles (admin can see all)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

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
      created_at: p.created_at,
    }));

    setDbUsers(users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return { dbUsers, loading, refetch: fetchUsers };
}
