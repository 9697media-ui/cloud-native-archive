import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'editor' | 'viewer' | null;

export interface AccessRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  name: string;
  email: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRole(null);
      setLoading(false);
      setAccessStatus(null);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      
      // Get role from user_roles table
      const { data: roleData } = await (supabase
        .from('user_roles') as any)
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Also check profile for permission_level
      const { data: profileData } = await supabase
        .from('profiles')
        .select('permission_level')
        .eq('user_id', user.id)
        .maybeSingle();

      const effectiveRole = roleData?.role || (profileData?.permission_level === 'admin_geral' ? 'admin' : null);

      if (effectiveRole) {
        setRole(effectiveRole as UserRole);
        setAccessStatus('approved');
      } else {
        // Check if there's a pending access request
        const { data: requestData } = await (supabase
          .from('access_requests') as any)
          .select('status')
          .eq('user_id', user.id)
          .order('requested_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setRole(null);
        setAccessStatus(requestData?.status || null);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user, isAuthenticated]);

  const canEdit = role === 'admin';
  const isAdmin = role === 'admin';
  const canView = role !== null;

  return { role, loading, canEdit, isAdmin, canView, accessStatus };
}

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await (supabase
      .from('access_requests') as any)
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });
    setRequests((data as AccessRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (requestId: string, userId: string, role: string) => {
    // Update the request status
    await (supabase
      .from('access_requests') as any)
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    await (supabase
      .from('user_roles') as any)
      .insert({ user_id: userId, role: role as any });

    await fetchRequests();
  };

  const rejectRequest = async (requestId: string) => {
    await (supabase
      .from('access_requests') as any)
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    await fetchRequests();
  };

  return { requests, loading, approveRequest, rejectRequest, refetch: fetchRequests };
}
