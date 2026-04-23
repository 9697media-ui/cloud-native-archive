import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsEmbedded } from '@/hooks/useIsEmbedded';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/usuarios', label: 'Usuários', icon: Users, requiresAdmin: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const isEmbedded = useIsEmbedded();

  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col bg-background">
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground hidden sm:inline">Central ANA</span>
          </Link>

          <nav className="flex items-center gap-1 flex-1">
            {navItems.map(item => {
              if (item.requiresAdmin && !isAdmin) return null;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-muted-foreground hidden md:inline">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 lg:p-8 mx-auto w-full max-w-7xl">
        {children}
      </main>
    </div>
  );
}
