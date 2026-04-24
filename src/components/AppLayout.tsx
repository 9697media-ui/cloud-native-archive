import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LogIn, LogOut, Menu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsEmbedded } from '@/hooks/useIsEmbedded';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ImpersonationBanner from '@/components/ImpersonationBanner';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/usuarios', label: 'Transparência', icon: Users },
  // { to: '/settings/mapping', label: 'Mapeamento', icon: Settings, adminOnly: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hideLoginParam = queryParams.get('hideLogin') === 'true';
  const hideFooterParam = queryParams.get('hideFooter') === 'true';
  const [showLoginLocal, setShowLoginLocal] = useState(!hideLoginParam);

  useEffect(() => {
    setShowLoginLocal(!hideLoginParam);
  }, [hideLoginParam]);
  
  const { isAuthenticated, signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const isEmbedded = useIsEmbedded();
  const isMobile = useIsMobile();
  const isCleanView = isEmbedded || hideLoginParam || hideFooterParam;

  if (isCleanView) {
    if (hideFooterParam) {
      return (
        <div className="h-full flex flex-col bg-background">
          <ImpersonationBanner />
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-background">
        <ImpersonationBanner />
        <main className="flex-1 overflow-auto p-4 pb-14">
          {children}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-sm p-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Calendar className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-bold tracking-tight text-foreground uppercase sm:text-xs">
              Central ANA
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-[10px] text-muted-foreground sm:inline truncate max-w-[100px]">
                  {user?.email}
                </span>
                
                {isAdmin && (
                  <Link to={`/usuarios${location.search}`} className="transition-transform active:scale-95">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1.5 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Painel Admin
                    </Button>
                  </Link>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()} 
                  className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {showLoginLocal && (
                  <a 
                    href={`/login?redirect=${encodeURIComponent(location.pathname)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="transition-transform active:scale-95"
                  >
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="h-8 gap-1.5 bg-primary text-xs font-semibold shadow-sm hover:bg-primary/90"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Login Admin
                    </Button>
                  </a>
                )}
                {!hideLoginParam && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLoginLocal(!showLoginLocal)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                    title={showLoginLocal ? "Ocultar login" : "Mostrar login"}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </footer>
      </div>
    );
  }

  const NavContent = () => (
    <>
      {navItems.filter(item => !item.adminOnly || isAdmin).map(item => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={`${item.to}${location.search}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isMobile && "px-4 py-3 text-base"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ImpersonationBanner />
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:px-8">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span>Central ANA</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2">
                  <NavContent />
                </nav>
                <div className="absolute bottom-4 left-0 w-full px-6">
                  {isAuthenticated && (
                    <div className="flex flex-col gap-4 border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      <Button variant="outline" size="sm" onClick={() => signOut()} className="w-full justify-start gap-2">
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link to={`/${location.search}`} className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className={cn("text-sm font-semibold text-foreground", isMobile ? "inline" : "hidden sm:inline")}>
              Central ANA
            </span>
          </Link>

          {!isMobile && (
            <nav className="flex items-center gap-1 flex-1">
              <NavContent />
            </nav>
          )}

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-muted-foreground hidden md:inline">{user?.email}</span>
                {!isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1.5">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                )}
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login Admin</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 lg:p-8 mx-auto w-full max-w-7xl">
        {children}
      </main>

      {!isEmbedded && (
        <footer className="border-t border-border bg-card/50 py-8 mt-auto">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                  <Calendar className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                  Central ANA
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Portal de transparência e agendamentos da Central ANA.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 justify-center md:justify-end">
              <div className="flex items-center gap-6 text-sm font-medium">
                <Link to={`/${location.search}`} className="text-muted-foreground hover:text-foreground transition-colors">Visão Geral</Link>
                <Link to={`/calendario${location.search}`} className="text-muted-foreground hover:text-foreground transition-colors">Calendário</Link>
                <Link to={`/usuarios${location.search}`} className="text-muted-foreground hover:text-foreground transition-colors">Transparência</Link>
              </div>
              
              <div className="flex items-center gap-4 border-l border-border pl-6">
                {!isAuthenticated ? (
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <LogIn className="h-3.5 w-3.5" />
                      Login Admin
                    </Button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{user?.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => signOut()} className="h-8 p-0 px-2 text-muted-foreground hover:text-foreground">
                      Sair
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8 mt-8 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Central ANA. Todos os direitos reservados.</p>
            <p>Desenvolvido para transparência ativa</p>
          </div>
        </footer>
      )}
    </div>
  );
}
