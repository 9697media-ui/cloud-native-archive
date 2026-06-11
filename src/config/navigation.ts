import { Globe, LayoutDashboard, Calendar, Users, History, BookOpen, FileSearch, Newspaper } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  managerOnly?: boolean;
  auditoriaOnly?: boolean;
  requireAuth?: boolean;
  mktOrAdminOnly?: boolean;
  hidden?: boolean;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Eventos', icon: Globe },
  { to: '/visao-geral', label: 'Visão Geral', icon: LayoutDashboard, requireAuth: true },
  { to: '/calendario', label: 'Calendário', icon: Calendar, requireAuth: true },
  { to: '/noticias', label: 'Notícias (Informativo)', icon: Newspaper, requireAuth: true },
  { to: '/usuarios', label: 'Painel', icon: Users, requireAuth: true, managerOnly: true },
  { to: '/auditoria', label: 'Auditoria', icon: History, requireAuth: true, adminOnly: true },
  { to: '/design-manual', label: 'Manual Design', icon: BookOpen, requireAuth: true, mktOrAdminOnly: true },
  { to: '/portal-transparencia', label: 'Portal Transparência', icon: FileSearch, requireAuth: true, adminOnly: true },
  { to: '/admin-toolbox', label: 'Widgets', icon: LayoutDashboard, requireAuth: true, hidden: true },
];
