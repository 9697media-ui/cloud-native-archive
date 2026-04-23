import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      const impersonatorId = sessionStorage.getItem('impersonator_id');
      const email = sessionStorage.getItem('impersonation_target_email');
      setActive(!!impersonatorId);
      setTargetEmail(email);
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  if (!active) return null;

  const handleExit = async () => {
    sessionStorage.removeItem('impersonator_id');
    sessionStorage.removeItem('impersonation_target_email');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-destructive text-destructive-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Modo de impersonação ativo — você está logado como <strong>{targetEmail || 'outro usuário'}</strong>.
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExit}
          className="gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair da impersonação
        </Button>
      </div>
    </div>
  );
}
