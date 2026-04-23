import { useState, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit2, Code2, Copy, Check, UserCheck, UserX, Clock, ShieldCheck, Shield, Eye, RefreshCw, KeyRound, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BulkActionBar from '@/components/BulkActionBar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const EMBED_PAGES = [
  { name: 'Visão Geral (Dashboard)', path: '/' },
  { name: 'Calendário', path: '/calendario' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-3.5 w-3.5" />,
  editor: <Shield className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
};

export default function UsersPage() {
  const { users, selectedUser, setSelectedUser, updateUser } = useApp();
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { dbUsers, loading: dbUsersLoading } = useDbUsers();
  const { requests, loading: requestsLoading, approveRequest, rejectRequest } = useAccessRequests();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<AppUser | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

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
    selectedUsers.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user) updateUser({ ...user, is_active: false, updated_at: new Date().toISOString() });
    });
    setSelectedUsers(new Set());
    toast({ title: 'Usuários desativados', description: `${selectedUsers.size} usuário(s) desativado(s).` });
  };

  const handleBulkToggleActive = (active: boolean) => {
    selectedUsers.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user) updateUser({ ...user, is_active: active, updated_at: new Date().toISOString() });
    });
    setSelectedUsers(new Set());
    toast({ title: active ? 'Usuários ativados' : 'Usuários desativados', description: `${selectedUsers.size} usuário(s) ${active ? 'ativado(s)' : 'desativado(s)'}.` });
  };

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const publishedUrl = 'https://unit-sync-scheduler.lovable.app';
  const baseUrl = publishedUrl;

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setShowEdit(true);
  };

  const handleSave = () => {
    if (editForm && selectedUser) {
      updateUser({ ...editForm, updated_at: new Date().toISOString() });
      setShowEdit(false);
      setSelectedUser(null);
    }
  };

  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    await approveRequest(req.id, req.user_id, req.requested_role);
    toast({ title: 'Aprovado!', description: `Acesso de ${req.name} foi aprovado como ${ROLE_LABELS[req.requested_role]}.` });
    setProcessingId(null);
  };

  const handleReject = async (req: any) => {
    setProcessingId(req.id);
    await rejectRequest(req.id);
    toast({ title: 'Rejeitado', description: `Solicitação de ${req.name} foi rejeitada.`, variant: 'destructive' });
    setProcessingId(null);
  };

  const getEmbedCode = (path: string) =>
    `<iframe src="${baseUrl}${path}" style="width:100%;height:100vh;border:0;border-radius:8px;" allowfullscreen></iframe>`;

  const getFixedEmbedCode = (path: string) =>
    `<div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;"><iframe src="${baseUrl}${path}" style="width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;

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
    navigator.clipboard.writeText(`${baseUrl}${path}`);
    setCopiedIdx(100 + idx);
    toast({ title: 'Copiado!', description: 'Link copiado.' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const permLabel = (level: string) => PERMISSION_LEVELS.find(p => p.value === level)?.label || level;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          {true && (
            <TabsTrigger value="approvals" className="gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Aprovações
              {requests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5"><Code2 className="h-3.5 w-3.5" />Embed</TabsTrigger>
        </TabsList>

        {/* Approval panel - Admin only */}
        {true && (
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1 gap-1.5"
                              disabled={processingId === req.id}
                              onClick={() => handleApprove(req)}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {true && (
            <BulkActionBar
              type="users"
              count={selectedUsers.size}
              onClearSelection={() => setSelectedUsers(new Set())}
              onDelete={handleBulkDeleteUsers}
              onToggleActive={handleBulkToggleActive}
            />
          )}
          <div className="space-y-2">
            {filtered.map(user => (
              <Card key={user.id}>
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {true && (
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4"
                        />
                      )}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {true && (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Redefinir senha"
                          onClick={() => { setResetTarget({ id: user.id, name: user.name, email: user.email }); setNewPassword(''); setConfirmPassword(''); }}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Entrar como este usuário"
                            onClick={() => setImpersonateTarget({ id: user.id, name: user.name, email: user.email })}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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

          {/* Real registered users from the database */}
          {true && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Usuários do Sistema (Nativos)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Todos os usuários que possuem conta registrada, incluindo administradores.
                </p>
              </CardHeader>
              <CardContent>
                {dbUsersLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : dbUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {dbUsers
                      .filter(u => {
                        if (!search) return true;
                        const q = search.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                      })
                      .map(user => (
                      <div key={user.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.role ? (
                            <Badge variant="outline" className="gap-1">
                              {ROLE_ICONS[user.role]}
                              {ROLE_LABELS[user.role] || user.role}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Sem role</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Redefinir senha"
                            onClick={() => { setResetTarget({ id: user.user_id, name: user.name, email: user.email }); setNewPassword(''); setConfirmPassword(''); }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {user.user_id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Entrar como este usuário"
                              onClick={() => setImpersonateTarget({ id: user.user_id, name: user.name, email: user.email })}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {true && (
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
                {EMBED_PAGES.map((page, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{page.name}</h3>
                      <Badge variant="outline" className="text-xs">{page.path}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Link direto</Label>
                      <div className="flex items-center gap-2">
                        <Input readOnly value={`${baseUrl}${page.path}`} className="font-mono text-xs bg-muted/50" />
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
        )}
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
                <Select value={editForm.unit} onValueChange={v => setEditForm({ ...editForm, unit: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nível de Permissão</Label>
                <Select value={editForm.permission_level} onValueChange={v => setEditForm({ ...editForm, permission_level: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMISSION_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
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
    </div>
  );
}
