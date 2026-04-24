import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, useAccessRequests } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDbUsers } from '@/hooks/useDbUsers';
import { AppUser, UNITS, PERMISSION_LEVELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit2, Code2, Copy, Check, UserCheck, UserX, Clock, ShieldCheck, Shield, Eye, RefreshCw, KeyRound, UserCog, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BulkActionBar from '@/components/BulkActionBar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const EMBED_PAGES = [
  { name: 'Visão Geral (Dashboard)', path: '/' },
  { name: 'Calendário', path: '/calendario' },
  { name: 'Transparência', path: '/usuarios' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
  admin_geral: 'Admin Geral',
  gestor_unidade: 'Gestor de Unidade',
  usuario_padrao: 'Usuário Padrão',
  visualizador: 'Visualizador',
  usuario_padrao_admin: 'Admin',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-3.5 w-3.5" />,
  admin_geral: <ShieldCheck className="h-3.5 w-3.5" />,
  editor: <Shield className="h-3.5 w-3.5" />,
  gestor_unidade: <Shield className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
  visualizador: <Eye className="h-3.5 w-3.5" />,
  usuario_padrao: <Shield className="h-3.5 w-3.5 opacity-50" />,
};

export default function UsersPage() {
  const [urlSearchParams] = useSearchParams();
  const hideTitleParam = urlSearchParams.get('hideTitle') === 'true';
  const { users, selectedUser, setSelectedUser, updateUser, deleteUser } = useApp();
  const { user: currentUser } = useAuth();
  const { isAdmin, isManager, canView, loading: roleLoading } = useUserRole();
  const { dbUsers, loading: dbUsersLoading, refetch } = useDbUsers();
  const { requests, loading: requestsLoading, approveRequest, rejectRequest } = useAccessRequests();
  const [showApprovalConfirm, setShowApprovalConfirm] = useState<{ req: any } | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<AppUser | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [hideLogin, setHideLogin] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [hideTitle, setHideTitle] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Impersonation dialog
  const [impersonateTarget, setImpersonateTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [impersonateSubmitting, setImpersonateSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Senhas não coincidem', description: 'Confirme a mesma senha nos dois campos.', variant: 'destructive' });
      return;
    }
    setResetSubmitting(true);
    const { data, error } = await supabase.functions.invoke('admin-reset-user-password', {
      body: { userId: resetTarget.id, newPassword },
    });
    setResetSubmitting(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Erro', description: (data as any)?.error || error?.message || 'Falha ao redefinir senha.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Senha redefinida', description: `Nova senha definida para ${resetTarget.name}.` });
    setResetTarget(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleImpersonate = async () => {
    if (!impersonateTarget || !currentUser) return;
    setImpersonateSubmitting(true);
    const { data, error } = await supabase.functions.invoke('admin-impersonate-user', {
      body: { userId: impersonateTarget.id },
    });
    if (error || (data as any)?.error || !(data as any)?.token_hash) {
      setImpersonateSubmitting(false);
      toast({ title: 'Erro', description: (data as any)?.error || error?.message || 'Falha ao impersonar.', variant: 'destructive' });
      return;
    }
    const { email, token_hash } = data as { email: string; token_hash: string };
    // Save impersonator marker BEFORE signOut
    sessionStorage.setItem('impersonator_id', currentUser.id);
    sessionStorage.setItem('impersonation_target_email', email);
    await supabase.auth.signOut();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash,
    });
    setImpersonateSubmitting(false);
    if (verifyErr) {
      sessionStorage.removeItem('impersonator_id');
      sessionStorage.removeItem('impersonation_target_email');
      toast({ title: 'Erro', description: 'Não foi possível concluir o login.', variant: 'destructive' });
      return;
    }
    setImpersonateTarget(null);
    toast({ title: 'Logado como ' + impersonateTarget.name });
    navigate('/', { replace: true });
    window.location.reload();
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteUsers = () => {
    setBulkDelete(true);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    setProcessingId('deleting');
    try {
      if (bulkDelete) {
        const ids = Array.from(selectedUsers);
        let successCount = 0;
        let hasError = false;
        
        for (const id of ids) {
          const isDbUser = dbUsers.some(u => u.user_id === id);
          if (isDbUser) {
            const { data, error } = await supabase.functions.invoke('admin-delete-user', {
              body: { userId: id }
            });
            if (error || (data as any)?.error) {
              console.error('Erro ao excluir usuário:', id, error || (data as any)?.error);
              hasError = true;
            } else {
              successCount++;
            }
          } else {
            deleteUser(id);
            successCount++;
          }
        }
        
        setSelectedUsers(new Set());
        if (successCount > 0) {
          toast({ 
            title: 'Usuários excluídos', 
            description: `${successCount} usuário(s) excluído(s) permanentemente.` 
          });
          refetch();
        }
        if (hasError) {
          toast({ 
            title: 'Alguns erros ocorreram', 
            description: 'Alguns usuários não puderam ser excluídos. Verifique se você tem permissão ou se o usuário ainda existe.',
            variant: 'destructive'
          });
        }
      } else if (selectedUser) {
        const id = selectedUser.id;
        const isDbUser = dbUsers.some(u => u.user_id === id);
        
        if (isDbUser) {
          const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId: id }
          });
          
          if (error || (data as any)?.error) {
            toast({ 
              title: 'Erro ao excluir', 
              description: (data as any)?.error || error?.message || 'Falha ao excluir usuário.', 
              variant: 'destructive' 
            });
          } else {
            toast({ 
              title: 'Usuário excluído', 
              description: `${selectedUser.name} foi excluído permanentemente.` 
            });
            refetch();
            setSelectedUser(null);
          }
        } else {
          deleteUser(id);
          toast({ 
            title: 'Usuário excluído', 
            description: `${selectedUser.name} foi excluído permanentemente.` 
          });
          setSelectedUser(null);
        }
      }
    } catch (err) {
      console.error('Erro na exclusão:', err);
      toast({ 
        title: 'Erro', 
        description: 'Ocorreu um erro inesperado ao tentar excluir.', 
        variant: 'destructive' 
      });
    } finally {
      setProcessingId(null);
      setShowDeleteConfirm(false);
      setBulkDelete(false);
    }
  };

  const handleBulkToggleActive = (active: boolean) => {
    selectedUsers.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user) updateUser({ ...user, is_active: active, updated_at: new Date().toISOString() });
    });
    setSelectedUsers(new Set());
    toast({ title: active ? 'Usuários ativados' : 'Usuários desativados', description: `${selectedUsers.size} usuário(s) ${active ? 'ativado(s)' : 'desativado(s)'}.` });
  };

  const combinedUsers = useMemo(() => {
    const mappedDbUsers: AppUser[] = dbUsers.map(dbu => ({
      id: dbu.user_id,
      name: dbu.name,
      email: dbu.email,
      unit: (dbu.unit as any) || 'Evento Geral do Grupo',
      permission_level: (dbu.permission_level || 'usuario_padrao') as any,
      is_active: true,
      created_at: dbu.created_at,
      updated_at: dbu.created_at,
    }));

    const dbEmails = new Set(mappedDbUsers.map(u => u.email.toLowerCase()));
    const uniqueMockUsers = users.filter(u => !dbEmails.has(u.email.toLowerCase()));

    return [...mappedDbUsers, ...uniqueMockUsers];
  }, [dbUsers, users]);

  const filtered = useMemo(() => {
    let baseUsers = combinedUsers;
    
    if (!isAdmin) {
      if (isManager) {
        // Gestor pode ver gestores, editores, usuários, visualizadores e viewers
        baseUsers = baseUsers.filter(u => 
          ['gestor_unidade', 'editor', 'usuario_padrao', 'visualizador', 'viewer'].includes(u.permission_level as string)
        );
      } else {
        // Usuário e visualizador podem ver somente o seu próprio perfil
        baseUsers = baseUsers.filter(u => u.email.toLowerCase() === currentUser?.email?.toLowerCase());
      }
    }

    if (!search) return baseUsers;
    const q = search.toLowerCase();
    return baseUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [combinedUsers, search, isAdmin, isManager, currentUser]);

  const groupedUsers = useMemo(() => {
    const admins = filtered.filter(u => (u.permission_level as string) === 'admin' || (u.permission_level as string) === 'admin_geral');
    const gestores = filtered.filter(u => (u.permission_level as string) === 'gestor_unidade');
    const normalUsers = filtered.filter(u => !['admin', 'admin_geral', 'gestor_unidade'].includes(u.permission_level as string));
    
    return [
      { id: 'admins', title: 'Administradores', users: admins, icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
      { id: 'gestores', title: 'Gestores de Unidade', users: gestores, icon: <Shield className="h-5 w-5 text-primary" /> },
      { id: 'normal', title: 'Usuários e Visualizadores', users: normalUsers, icon: <UserCog className="h-5 w-5 text-primary" /> }
    ];
  }, [filtered]);


  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const isPreview = window.location.hostname.includes('preview') || window.location.hostname.includes('lovableproject.com') || window.location.hostname.includes('localhost');
  const PUBLISHED_URL = "https://r2-vault-craft.lovable.app";
  const baseUrl = customBaseUrl || (isPreview ? PUBLISHED_URL : window.location.origin);

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (editForm && selectedUser) {
      setProcessingId(selectedUser.id);
      
      const isDbUser = dbUsers.some(u => u.user_id === selectedUser.id);
      
      if (isDbUser) {
        console.log('Atualizando usuário no banco:', selectedUser.id);
        
        // 1. Atualiza Perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: editForm.name,
            unit: editForm.unit,
            permission_level: editForm.permission_level,
            is_active: editForm.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', selectedUser.id);
          
        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
          toast({ 
            title: 'Erro ao salvar perfil', 
            description: profileError.message, 
            variant: 'destructive' 
          });
          setProcessingId(null);
          return;
        }

        // 2. Sincroniza com a tabela user_roles
        let mappedRole: 'admin' | 'editor' | 'viewer' = 'viewer';
        if (editForm.permission_level === 'admin_geral') mappedRole = 'admin';
        else if (editForm.permission_level === 'gestor_unidade') mappedRole = 'editor';

        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: selectedUser.id, 
            role: mappedRole 
          }, { 
            onConflict: 'user_id' 
          });

        if (roleError) {
          console.error('Erro ao atualizar cargo:', roleError);
          // Apenas aviso, pois o perfil já foi salvo
          toast({ 
            title: 'Aviso', 
            description: 'Perfil salvo, mas houve um erro ao sincronizar permissões de sistema.', 
            variant: 'destructive' 
          });
        } else {
          toast({ title: 'Sucesso', description: 'Usuário e permissões atualizados com sucesso.' });
        }
        
        refetch(); // Recarrega os usuários do banco
      } else {
        // Fallback para usuários mock
        updateUser({ ...editForm, updated_at: new Date().toISOString() });
        toast({ title: 'Sucesso', description: 'Usuário (mock) atualizado localmente.' });
      }
      
      setShowEdit(false);
      setSelectedUser(null);
      setProcessingId(null);
    }
  };

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    await approveRequest(req.id, req.user_id, req.requested_role);
    toast({ title: 'Aprovado!', description: `Acesso de ${req.name} foi aprovado como ${ROLE_LABELS[req.requested_role]}.` });
    setProcessingId(null);
    setShowApprovalConfirm(null);
  };

  const onApproveClick = (req: any) => {
    setShowApprovalConfirm({ req });
  };

  const handleReject = async (req: any) => {
    setProcessingId(req.id);
    await rejectRequest(req.id);
    toast({ title: 'Rejeitado', description: `Solicitação de ${req.name} foi rejeitada.`, variant: 'destructive' });
    setProcessingId(null);
  };

  const getUrl = (path: string) => {
    const params = new URLSearchParams();
    if (hideLogin) params.append('hideLogin', 'true');
    if (hideFooter) params.append('hideFooter', 'true');
    if (hideHeader) params.append('hideHeader', 'true');
    if (hideTitle) params.append('hideTitle', 'true');
    const queryString = params.toString();
    
    // Ensure baseUrl doesn't end with slash if path starts with one
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${normalizedBase}${normalizedPath}${queryString ? `?${queryString}` : ''}`;
  };

  const getEmbedCode = (path: string) =>
    `<iframe src="${getUrl(path)}" style="width:100%;height:100vh;border:0;border-radius:8px;" allowfullscreen></iframe>`;

  const getFixedEmbedCode = (path: string) =>
    `<div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;"><iframe src="${getUrl(path)}" style="width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;

  const handleCopyEmbed = (idx: number, path: string) => {
    navigator.clipboard.writeText(getEmbedCode(path));
    setCopiedIdx(idx);
    toast({ title: 'Copiado!', description: 'Código embed copiado.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyFixedEmbed = (idx: number, path: string) => {
    navigator.clipboard.writeText(getFixedEmbedCode(path));
    setCopiedIdx(200 + idx);
    toast({ title: 'Copiado!', description: 'Embed tela cheia copiado.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyLink = (idx: number, path: string) => {
    navigator.clipboard.writeText(getUrl(path));
    setCopiedIdx(100 + idx);
    toast({ title: 'Copiado!', description: 'Link copiado.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const permLabel = (level: string) => PERMISSION_LEVELS.find(p => p.value === level)?.label || level;

  // Admin restricted actions check
  const renderActions = (user: AppUser) => {
    const dbMatch = dbUsers.find(d => d.email?.toLowerCase() === user.email.toLowerCase());
    const authUserId = dbMatch?.user_id || (user.id.length > 10 ? user.id : undefined);

    const canImpersonate = (() => {
      if (!authUserId) return false;
      
      // Não permitir entrar como si mesmo
      if (authUserId === currentUser?.id) return false;

      // 1. Administrador Geral: Permissão total em todos os outros usuários
      if (isAdmin) return true;
      
      // 2. Gestor de unidade:
      if (isManager) {
        const targetLevel = (user.permission_level as string) || '';
        
        // Pode entrar em perfis de Usuário Padrão e Visualizador
        const isTargetStandardOrViewer = 
          targetLevel === 'usuario_padrao' || 
          targetLevel === 'visualizador' || 
          targetLevel === 'viewer';
          
        if (isTargetStandardOrViewer) return true;
        return false;
      }
      
      return false;
    })();

    const canEdit = isAdmin || (isManager && authUserId === currentUser?.id);

    return (
      <div className="flex items-center gap-1">
        {(isAdmin || canEdit) && (
          <>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon" 
                title={authUserId ? "Redefinir senha" : "Usuário sem conta no sistema"}
                disabled={!authUserId}
                onClick={() => { if (authUserId) { setResetTarget({ id: authUserId, name: user.name, email: user.email }); setNewPassword(''); setConfirmPassword(''); } }}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Editar usuário">
              <Edit2 className="h-4 w-4" />
            </Button>

            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setSelectedUser(user); setBulkDelete(false); setShowDeleteConfirm(true); }} 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Excluir permanentemente"
                disabled={authUserId === currentUser?.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {canImpersonate && (
          <Button
            variant="ghost"
            size="icon"
            title="Entrar como este usuário"
            onClick={() => setImpersonateTarget({ id: authUserId!, name: user.name, email: user.email })}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <UserCog className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  if (roleLoading) return <div className="p-8 text-center">Carregando permissões...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {!hideTitleParam && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">Transparência</h1>
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="approvals" className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Aprovações
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5"><Code2 className="h-3.5 w-3.5" />Embed</TabsTrigger>
        </TabsList>

        {/* Approval panel */}
        <TabsContent value="approvals" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Solicitações de Acesso Pendentes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Novos usuários que solicitaram acesso ao sistema aguardam sua aprovação.
              </p>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {req.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{req.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                          {new Date(req.requested_at).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Badge variant="outline" className="gap-1 w-fit">
                          {ROLE_ICONS[req.requested_role]}
                          {ROLE_LABELS[req.requested_role] || req.requested_role}
                        </Badge>
                        {isManager && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 gap-1.5"
                              disabled={processingId === req.id}
                              onClick={() => onApproveClick(req)}
                            >
                              <UserCheck className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 gap-1.5"
                              disabled={processingId === req.id}
                              onClick={() => handleReject(req)}
                            >
                              <UserX className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {isAdmin && (
            <BulkActionBar
              type="users"
              count={selectedUsers.size}
              onClearSelection={() => setSelectedUsers(new Set())}
              onDelete={handleBulkDeleteUsers}
              onToggleActive={handleBulkToggleActive}
            />
          )}
          {dbUsersLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedUsers.map(group => group.users.length > 0 && (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center gap-2 px-1 border-b pb-2">
                    {group.icon}
                    <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
                    <Badge variant="secondary" className="ml-auto">{group.users.length}</Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {group.users.map(user => (
                      <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="flex flex-col gap-4 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isAdmin && (
                                <Checkbox
                                  checked={selectedUsers.has(user.id)}
                                  onCheckedChange={() => toggleUserSelection(user.id)}
                                  className="h-4 w-4"
                                />
                              )}
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                            {renderActions(user)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{user.unit}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{permLabel(user.permission_level)}</Badge>
                            <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-[10px]">
                              {user.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="embed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code2 className="h-5 w-5 text-primary" />
                Links e Códigos Embed
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Use estes links para incorporar páginas em sites externos.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPreview && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertTitle className="text-sm font-bold text-destructive">Atenção: Ambiente de Pré-visualização</AlertTitle>
                  <AlertDescription className="text-xs text-destructive-foreground">
                    <p className="mb-2">Os links abaixo usam a URL de teste (<strong>{window.location.origin}</strong>) que requer login no Lovable e <strong>NÃO funcionará em seu site externo</strong>.</p>
                    <p>Para o embed funcionar corretamente, use a URL publicada: <strong className="underline">https://r2-vault-craft.lovable.app</strong> ou insira-a no campo abaixo.</p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">URL Base para Links (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ex: https://meusite.com" 
                      value={customBaseUrl} 
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      className="text-xs h-8"
                    />
                    {customBaseUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setCustomBaseUrl('')} className="h-8 px-2 text-xs">
                        Resetar
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Deixe vazio para usar a URL atual: {window.location.origin}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Switch id="hide-login" checked={hideLogin} onCheckedChange={setHideLogin} />
                    <Label htmlFor="hide-login" className="text-sm cursor-pointer">Ocultar botão de login</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="hide-footer" checked={hideFooter} onCheckedChange={setHideFooter} />
                    <Label htmlFor="hide-footer" className="text-sm cursor-pointer">Ocultar rodapé completo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="show-header" checked={!hideHeader} onCheckedChange={(v) => setHideHeader(!v)} />
                    <Label htmlFor="show-header" className="text-sm cursor-pointer">Habilitar cabeçalho</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="show-title" checked={!hideTitle} onCheckedChange={(v) => setHideTitle(!v)} />
                    <Label htmlFor="show-title" className="text-sm cursor-pointer">Habilitar título da página</Label>
                  </div>
                </div>
              </div>
              {EMBED_PAGES.map((page, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{page.name}</h3>
                    <Badge variant="outline" className="text-xs">{page.path}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Link direto</Label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={getUrl(page.path)} className="font-mono text-xs bg-muted/50" />
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleCopyLink(idx, page.path)}>
                        {copiedIdx === 100 + idx ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Código embed (iframe)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={getEmbedCode(page.path)}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleCopyEmbed(idx, page.path)} title="Copiar embed">
                        {copiedIdx === idx ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleCopyFixedEmbed(idx, page.path)} title="Copiar embed tela cheia">
                        {copiedIdx === 200 + idx ? <Check className="h-4 w-4 text-primary" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Use <RefreshCw className="h-3 w-3 inline" /> para gerar embed que ocupa 100% da tela.
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={(v) => { setShowEdit(v); if (!v) setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select 
                  disabled={editForm.permission_level === 'admin_geral'}
                  value={editForm.unit} 
                  onValueChange={v => setEditForm({ ...editForm, unit: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.filter(u => {
                      if (editForm.permission_level === 'gestor_unidade') {
                        return u !== 'Evento Geral do Grupo';
                      }
                      return true;
                    }).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Permissão</Label>
                <Select 
                  value={editForm.permission_level} 
                  onValueChange={v => {
                    const newLevel = v as any;
                    let newUnit = editForm.unit;
                    
                    if (newLevel === 'admin_geral') {
                      newUnit = 'Evento Geral do Grupo';
                    } else if (newLevel === 'gestor_unidade' && newUnit === 'Evento Geral do Grupo') {
                      newUnit = 'DIC'; // Valor padrão para gestores
                    }
                    
                    setEditForm({ ...editForm, permission_level: newLevel, unit: newUnit });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMISSION_LEVELS
                      .filter(p => isAdmin || p.value !== 'admin_geral')
                      .map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm({ ...editForm, is_active: v })} />
                <Label>Usuário ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(v) => { if (!v) { setResetTarget(null); setNewPassword(''); setConfirmPassword(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          {resetTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Definir nova senha para <strong className="text-foreground">{resetTarget.name}</strong> ({resetTarget.email}).
                Anote e entregue ao usuário pelo canal interno.
              </p>
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input type="text" autoComplete="off" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar senha</Label>
                <Input type="text" autoComplete="off" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetSubmitting}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetSubmitting}>
              {resetSubmitting ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate confirm dialog */}
      <Dialog open={!!impersonateTarget} onOpenChange={(v) => { if (!v && !impersonateSubmitting) setImpersonateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar como usuário</DialogTitle>
          </DialogHeader>
          {impersonateTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Você entrará na conta de <strong className="text-foreground">{impersonateTarget.name}</strong> ({impersonateTarget.email}).
              </p>
              <p className="text-sm text-muted-foreground">
                Sua sessão atual será encerrada. Para voltar à sua conta, use o botão "Sair da impersonação" no banner do topo e faça login novamente.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateTarget(null)} disabled={impersonateSubmitting}>Cancelar</Button>
            <Button onClick={handleImpersonate} disabled={impersonateSubmitting}>
              {impersonateSubmitting ? 'Entrando...' : 'Entrar como usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(v) => { setShowDeleteConfirm(v); if (!v) { setBulkDelete(false); if (!showEdit) setSelectedUser(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Permanentemente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {bulkDelete 
                ? `Você está prestes a excluir ${selectedUsers.size} usuários permanentemente. Esta ação não pode ser desfeita.`
                : `Você está prestes a excluir o usuário ${selectedUser?.name} permanentemente. Esta ação não pode ser desfeita.`
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={processingId === 'deleting'}>
              {processingId === 'deleting' ? 'Excluindo...' : 'Excluir Agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Approval confirmation dialog */}
      <Dialog open={!!showApprovalConfirm} onOpenChange={(v) => { if (!v) setShowApprovalConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aprovação</DialogTitle>
          </DialogHeader>
          {showApprovalConfirm && (
            <div className="space-y-4">
              <Alert className="bg-warning/10 border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning-foreground font-semibold">Aviso de Ciência</AlertTitle>
                <AlertDescription className="text-warning-foreground/80">
                  Ao aprovar este usuário, você confirma estar ciente das permissões que serão concedidas a ele no sistema. 
                  Certifique-se de que a unidade e o nível de acesso solicitados estão corretos.
                </AlertDescription>
              </Alert>
              <p className="text-sm">
                Aprovar <strong className="text-foreground">{showApprovalConfirm.req.name}</strong> como <strong>{ROLE_LABELS[showApprovalConfirm.req.requested_role] || showApprovalConfirm.req.requested_role}</strong>?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalConfirm(null)}>Cancelar</Button>
            <Button onClick={() => handleApprove(showApprovalConfirm?.req)}>Confirmar Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}