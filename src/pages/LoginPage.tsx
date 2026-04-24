import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, LogIn, UserPlus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'request_sent' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestedRole, setRequestedRole] = useState<string>('viewer');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setPopup({ title: 'Erro', message: error.message, type: 'error' });
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
      requested_role: requestedRole 
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Calendar className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Central ANA</CardTitle>
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
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
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
    </div>
    </>
  );
}
