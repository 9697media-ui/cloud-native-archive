import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LogIn, LogOut, Menu, Settings, UserCircle, History, Globe, FlaskConical, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaPreference } from '@/hooks/useBetaPreference';
import { useIsEmbedded } from '@/hooks/useIsEmbedded';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import TestModeBanner, { TestModeTrigger } from '@/components/TestModeBanner';
import logoImg from '@/assets/logo.png';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  managerOnly?: boolean;
  auditoriaOnly?: boolean;
  requireAuth?: boolean;
  mktOrAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Eventos', icon: Globe },
  { to: '/visao-geral', label: 'Visão Geral', icon: LayoutDashboard, requireAuth: true },
  { to: '/calendario', label: 'Calendário', icon: Calendar, requireAuth: true },
  { to: '/usuarios', label: 'Painel', icon: Users, requireAuth: true, managerOnly: true },
  { to: '/auditoria', label: 'Auditoria', icon: History, requireAuth: true, auditoriaOnly: true },
  { to: '/design-manual', label: 'Manual Design', icon: BookOpen, requireAuth: true, mktOrAdminOnly: true },
];

export default function AppLayout() {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsFirstRender(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hideLoginParam = queryParams.get('hideLogin') === 'true';
  const hideFooterParam = queryParams.get('hideFooter') === 'true';
  const hideHeaderParam = queryParams.get('hideHeader') === 'true';
  const hideTitleParam = queryParams.get('hideTitle') === 'true';
  const [showLoginLocal, setShowLoginLocal] = useState(!hideLoginParam);

  useEffect(() => {
    setShowLoginLocal(!hideLoginParam);
  }, [hideLoginParam]);
  
  const { isAuthenticated, signOut, user } = useAuth();
  const { isAdmin, isManager, userName, unit, canViewAuditoria } = useUserRole();
  const { eligible: betaEligible, rawEnabled: betaOn, toggleBeta } = useBetaPreference();
  const isEmbedded = useIsEmbedded();
  const isMobile = useIsMobile();
  const isCleanView = isEmbedded || hideLoginParam || hideFooterParam || hideHeaderParam || hideTitleParam;

  const NavContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.filter(item => {
        if (item.adminOnly) return isAdmin;
        if (item.managerOnly) return isAdmin || isManager;
        if (item.mktOrAdminOnly) return isAdmin || user?.email === 'mkt@anabrasil.org';
        if (item.auditoriaOnly) return canViewAuditoria;
        if (item.requireAuth) return isAuthenticated;
        return true;
      }).map(item => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={`${item.to}${location.search}`}
            onClick={onClick}
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
    <div className={cn("flex min-h-screen flex-col bg-background", isCleanView && "h-full")}>
      {!hideHeaderParam && <ImpersonationBanner />}
      {!hideHeaderParam && <TestModeBanner />}
      {!hideHeaderParam && (
        <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 transition-all duration-300">
          <div className="flex h-20 w-full items-center gap-4 px-6 lg:px-12">
            {isMobile && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 hover:bg-slate-100 rounded-xl">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 border-r-0 shadow-2xl">
                  <SheetHeader className="p-8 text-left border-b bg-slate-50/50">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <img src={logoImg} alt="anabrasil" className="h-7 w-7 object-cover" />
                      </div>
                      <span className="font-bold tracking-tight text-xl lowercase text-foreground">anabrasil</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 p-6">
                    <NavContent onClick={() => setIsMenuOpen(false)} />
                  </nav>
                  <div className="absolute bottom-0 left-0 w-full p-8 border-t bg-slate-50/50">
                    {isAuthenticated && (
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                            {userName?.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{unit || user?.email}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="lg" onClick={() => signOut()} className="w-full justify-center gap-2 rounded-xl border-slate-200 hover:bg-white hover:shadow-md transition-all">
                          <LogOut className="h-4 w-4" />
                          Encerrar Sessão
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <Link to={`/${location.search}`} className="flex items-center gap-3 shrink-0 group transition-all active:scale-95">
              <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 group-hover:-rotate-3 transition-all duration-300">
                <img src={logoImg} alt="anabrasil" className="h-7 w-7 object-cover" />
              </div>
              <span className={cn("text-2xl leading-none text-foreground tracking-tighter lowercase", isMobile ? "inline" : "hidden sm:inline")} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800 }}>
                anabrasil
              </span>
            </Link>

            {!isMobile && (
              <nav className="flex items-center gap-2 ml-10 flex-1">
                <NavContent />
              </nav>
            )}

            <div className="flex items-center gap-4 shrink-0 ml-auto">
              {isAuthenticated ? (
                <>
                  <div className="flex flex-col items-end hidden md:flex">
                    <span className="text-sm font-bold text-foreground">{userName}</span>
                    <span className="text-[11px] font-medium text-muted-foreground opacity-80 uppercase tracking-wider">{unit || user?.email}</span>
                  </div>
                  {!isMobile && (
                    <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all h-10 px-4">
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline font-semibold">Sair</span>
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </header>
      )}

      <main className={cn(
        "flex-1 overflow-auto",
        !isCleanView && "mx-auto w-full"
      )}>
        <Outlet />
      </main>


      {!hideHeaderParam && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[60] duration-500 flex items-center gap-3",
          isFirstRender && "animate-in fade-in slide-in-from-bottom-4"
        )}>
          <TestModeTrigger floating />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="icon" 
                  className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-transform active:scale-95 border-2 border-primary-foreground/20"
                >
                  <UserCircle className="h-7 w-7" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">{unit || user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(isAdmin || isManager) && (
                  <DropdownMenuItem asChild>
                    <Link to={`/usuarios${location.search}`} className="flex items-center gap-2 cursor-pointer py-2">
                      <Users className="h-4 w-4" />
                      <span>Painel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {betaEligible && (
                  <>
                    <DropdownMenuSeparator />
                    <div
                      className="flex items-center justify-between gap-2 px-2 py-2 text-sm"
                      onClick={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        <span>UI Beta</span>
                      </div>
                      <Switch checked={betaOn} onCheckedChange={(v) => { toggleBeta(v); window.location.reload(); }} />
                    </div>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer py-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="transition-transform active:scale-95">
              <Button 
                variant="default" 
                size="icon" 
                className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 border-2 border-primary-foreground/20"
                title="Login Admin"
              >
                <LogIn className="h-7 w-7" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
