import { Globe, LayoutDashboard, Calendar, Users, History, BookOpen, FileSearch, Newspaper, Megaphone, ShoppingBasket } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  managerOnly?: boolean;
  auditoriaOnly?: boolean;
  requireAuth?: boolean;
  mktOrAdminOnly?: boolean;
  marketingOnly?: boolean;
  hidden?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Eventos', icon: Globe },
  { to: '/visao-geral', label: 'Visão Geral', icon: LayoutDashboard, requireAuth: true, hidden: true },
  { to: '/calendario', label: 'Calendário', icon: Calendar, requireAuth: true, hidden: true },
  { to: '/noticias', label: 'Notícias (Informativo)', icon: Newspaper, requireAuth: true },
  { to: '/mercado-solidario', label: 'Mercado Solidário', icon: ShoppingBasket, requireAuth: true },
  { to: '/marketing', label: 'Marketing', icon: Megaphone, requireAuth: true, marketingOnly: true },
  { to: '/usuarios', label: 'Painel', icon: Users, requireAuth: true, managerOnly: true },
  { to: '/auditoria', label: 'Auditoria', icon: History, requireAuth: true, marketingOnly: true, hidden: true },
  { to: '/design-manual', label: 'Manual Design', icon: BookOpen, requireAuth: true, marketingOnly: true, hidden: true },
  { to: '/portal-transparencia', label: 'Portal Transparência', icon: FileSearch, requireAuth: true, marketingOnly: true, hidden: true },
  { to: '/admin-toolbox', label: 'Widgets', icon: LayoutDashboard, requireAuth: true, marketingOnly: true, hidden: true },
];
