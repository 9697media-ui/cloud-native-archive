import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, LogIn, UserPlus, Clock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { TestModeTrigger } from '@/components/TestModeBanner';
import { UNITS, Unit } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';


export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'request_sent' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestedRole, setRequestedRole] = useState<string>('viewer');
  const [requestedUnit, setRequestedUnit] = useState<Unit>('Grupo ANA Brasil');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);
  const [emergencyReset, setEmergencyReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Ajusta unidade padrão se mudar o nível solicitado
  useEffect(() => {
    if ((requestedRole === 'editor' || requestedRole === 'criador') && requestedUnit === 'Grupo ANA Brasil') {
      setRequestedUnit('DIC');
    } else if (requestedRole === 'viewer' && requestedUnit !== 'Grupo ANA Brasil') {
      setRequestedUnit('Grupo ANA Brasil');
    }
  }, [requestedRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Fluxo emergencial: Email = Senha
    if (email === password && email.includes('@')) {
      setEmergencyReset(true);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      let message = error.message;
      if (message.includes('Email not confirmed')) {
        message = 'Sua solicitação de acesso ainda está pendente ou seu e-mail não foi confirmado. Verifique sua caixa de entrada ou aguarde a aprovação de um administrador.';
      } else if (message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos. Tente novamente.';
      }
      setPopup({ title: 'Erro', message: message, type: 'error' });
    }
    setLoading(false);
  };

  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPopup({ title: 'Erro', message: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke('emergency-reset-password', {
      body: { email, newPassword }
    });

    if (error || data?.error) {
      setPopup({ title: 'Erro', message: data?.error || 'Não foi possível redefinir sua senha.', type: 'error' });
    } else {
      setPopup({ title: 'Sucesso!', message: 'Sua senha foi redefinida. Agora você já pode fazer login com a nova senha.', type: 'success' });
      setEmergencyReset(false);
      setPassword('');
      setNewPassword('');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setPopup({ title: 'Erro', message: error.message, type: 'error' });
    } else {
      setPopup({ title: 'E-mail enviado!', message: 'Verifique sua caixa de entrada para redefinir a senha.', type: 'success' });
      setMode('login');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);

    const { error } = await signUp(email, password, { 
      name, 
      requested_role: requestedRole,
      requested_unit: requestedUnit 
    });
    
    if (error) {
      setPopup({ title: 'Erro', message: error.message, type: 'error' });
      setLoading(false);
      return;
    }

    setMode('request_sent');
    setLoading(false);
  };

  if (mode === 'request_sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Solicitação Enviada!</CardTitle>
            <CardDescription>
              Sua solicitação de acesso foi enviada com sucesso. Um administrador irá analisar e aprovar seu acesso em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => { setMode('login'); }} className="w-full">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <AlertDialog open={!!popup} onOpenChange={(open) => { if (!open) setPopup(null); }}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: popup?.type === 'error' ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--primary) / 0.1)' }}>
            {popup?.type === 'error' ? <AlertCircle className="h-6 w-6 text-destructive" /> : <CheckCircle2 className="h-6 w-6 text-primary" />}
          </div>
          <AlertDialogTitle className="text-center">{popup?.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">{popup?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={() => setPopup(null)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {emergencyReset && (
        <AlertDialog open={emergencyReset} onOpenChange={setEmergencyReset}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-7 w-7" />
              </div>
              <AlertDialogTitle className="text-center">Redefinição Emergencial</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Você ativou o modo de redefinição emergencial para o e-mail <strong>{email}</strong>.
                Defina sua nova senha abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleEmergencyReset} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Definir Nova Senha'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setEmergencyReset(false)}>
                Cancelar
              </Button>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Calendar className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">ANA Brasil</CardTitle>
          <CardDescription>
            {mode === 'signup'
              ? 'Solicite acesso para gerenciar programações'
              : mode === 'forgot'
              ? 'Informe seu e-mail para redefinir a senha'
              : 'Faça login para editar programações'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'signup' ? handleSignUp : mode === 'forgot' ? handleResetPassword : handleLogin} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {mode !== 'forgot' && (
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <Label>Nível de acesso solicitado</Label>
                <Select value={requestedRole} onValueChange={setRequestedRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor (Apenas Edição)</SelectItem>
                    <SelectItem value="criador">Criador (Cria e Edita)</SelectItem>
                  </SelectContent>
                </Select>
                {(requestedRole === 'editor' || requestedRole === 'criador') && (
                  <div className="mt-4">
                    <Label>Selecione sua unidade</Label>
                    <Select value={requestedUnit} onValueChange={(v) => setRequestedUnit(v as Unit)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.filter(u => u !== 'Grupo ANA Brasil').map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">O acesso será concedido após aprovação de um administrador.</p>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {mode === 'signup' ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'Aguarde...' : mode === 'signup' ? 'Solicitar Acesso' : mode === 'forgot' ? 'Enviar E-mail' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-muted-foreground hover:underline block w-full">
                Esqueceu a senha?
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup')}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'signup' ? 'Já tem uma conta? Faça login' : mode === 'forgot' ? 'Voltar ao login' : 'Não tem conta? Solicite acesso'}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3">
        <TestModeTrigger floating />
        <ThemeToggle />
      </div>

    </div>
    </>
  );
}
