import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, LogIn, LogOut, Menu, Settings, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsEmbedded } from '@/hooks/useIsEmbedded';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
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
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/usuarios', label: 'Painel', icon: Users, requireAuth: true, managerOnly: true },
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
  const { isAdmin, isManager } = useUserRole();
  const isEmbedded = useIsEmbedded();
  const isMobile = useIsMobile();
  const isCleanView = isEmbedded || hideLoginParam || hideFooterParam || hideHeaderParam || hideTitleParam;

  const NavContent = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.filter(item => {
        if (item.adminOnly) return isAdmin;
        if (item.managerOnly) return isAdmin || isManager;
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
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-8">
            {isMobile && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-6 text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <img src={logoImg} alt="anabrasil" className="h-8 w-8 rounded-lg object-cover" />
                      <span className="font-bold tracking-tighter text-lg lowercase">anabrasil</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 px-2">
                    <NavContent onClick={() => setIsMenuOpen(false)} />
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

            <Link to={`/${location.search}`} className="flex items-center gap-2.5 shrink-0 group transition-all active:scale-95">
              <img src={logoImg} alt="anabrasil" className="h-10 w-10 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-all" />
              <span className={cn("text-xl leading-none text-foreground tracking-tighter lowercase", isMobile ? "inline" : "hidden sm:inline")} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700 }}>
                anabrasil
              </span>
            </Link>

            {!isMobile && (
              <nav className="flex items-center gap-1 flex-1">
                <NavContent />
              </nav>
            )}

            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <TestModeTrigger />
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
      )}

      <main className={cn(
        "flex-1 overflow-auto p-4",
        !isCleanView && "lg:p-8 mx-auto w-full max-w-7xl"
      )}>
        <Outlet />
      </main>

      {!hideHeaderParam && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[60] duration-500",
          isFirstRender && "animate-in fade-in slide-in-from-bottom-4"
        )}>
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
                  <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
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
