import { useState, useMemo } from 'react';
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
  
  const { isAuthenticated, signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const isEmbedded = useIsEmbedded();
  const isMobile = useIsMobile();

  if (isEmbedded) {
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
              <>
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {user?.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()} 
                  className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {true && (
                  <>
                    {showLoginLocal ? (
                      <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="transition-transform active:scale-95">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 gap-1.5 bg-primary text-xs font-semibold shadow-sm hover:bg-primary/90"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Login do Usuário
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowLoginLocal(!showLoginLocal)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                      title={showLoginLocal ? "Ocultar login" : "Mostrar login"}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </>
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
            to={item.to}
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

          <Link to="/" className="flex items-center gap-2 shrink-0">
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
