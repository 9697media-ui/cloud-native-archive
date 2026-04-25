import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTestView } from '@/contexts/TestViewContext';

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
  const { activePersona } = useTestView();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    // If a test persona is active, use it instead of real DB role
    if (activePersona) {
      setRole(activePersona.role);
      setUserName(activePersona.name);
      setIsActive(activePersona.is_active);
      setAccessStatus(activePersona.role ? 'approved' : 'pending');
      setLoading(false);
      return;
    }

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

      // Also check profile for permission_level and name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('permission_level, name, is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setUserName(profileData.name);
        setIsActive(profileData.is_active !== false);
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else {
        setUserName(user.email || 'Usuário');
      }

      let effectiveRole = roleData?.role;
      
      if (!effectiveRole && profileData?.permission_level) {
        if (profileData.permission_level === 'admin_geral') effectiveRole = 'admin';
        else if (profileData.permission_level === 'gestor_unidade') effectiveRole = 'editor';
        else effectiveRole = 'viewer';
      }

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

  const isAdmin = role === 'admin';
  const isManager = role === 'editor' || role === 'admin';
  const canEdit = isAdmin || isManager;
  const canView = role !== null;

  return { role, loading, canEdit, isAdmin, isManager, canView, accessStatus, userName, isActive };
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

  const approveRequest = async (requestId: string, userId: string, role: string, permissionLevel?: string, unit?: string) => {
    // Use edge function to approve, assign role AND confirm email
    const { data, error } = await supabase.functions.invoke('admin-approve-user', {
      body: { requestId, userId, role, permissionLevel, unit }
    });

    if (error) {
      console.error('Erro ao aprovar solicitação:', error);
      throw error;
    }

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
