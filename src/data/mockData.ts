import { AppEvent, AppUser } from '@/types';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

function d(day: number, hour: number, minute = 0): string {
  return new Date(year, month, day, hour, minute).toISOString();
}

export const mockEvents: AppEvent[] = [];

export const mockUsers: AppUser[] = [
  { id: '1', name: 'Admin Central', email: 'admin@centralana.com', unit: 'DIC', permission_level: 'admin_geral', is_active: true, created_at: d(1, 8), updated_at: d(1, 8) },
  { id: '2', name: 'Maria Silva', email: 'maria@centralana.com', unit: 'Nilópolis', permission_level: 'gestor_unidade', is_active: true, created_at: d(1, 8), updated_at: d(1, 8) },
  { id: '3', name: 'João Santos', email: 'joao@centralana.com', unit: 'Santana', permission_level: 'gestor_unidade', is_active: true, created_at: d(1, 8), updated_at: d(1, 8) },
  { id: '4', name: 'Ana Oliveira', email: 'ana@centralana.com', unit: 'DIC', permission_level: 'usuario_padrao', is_active: true, created_at: d(1, 8), updated_at: d(1, 8) },
  { id: '5', name: 'Carlos Pereira', email: 'carlos@centralana.com', unit: 'Evento Geral do Grupo', permission_level: 'visualizador', is_active: true, created_at: d(1, 8), updated_at: d(1, 8) },
  { id: '6', name: 'Fernanda Lima', email: 'fernanda@centralana.com', unit: 'Nilópolis', permission_level: 'usuario_padrao', is_active: false, created_at: d(1, 8), updated_at: d(1, 8) },
];
