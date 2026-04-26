import { AppEvent, AppUser } from '@/types';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

function d(day: number, hour: number, minute = 0): string {
  return new Date(year, month, day, hour, minute).toISOString();
}

export const mockEvents: AppEvent[] = [];

export const mockUsers: AppUser[] = [
  {
    id: 'test-admin-geral',
    name: 'Admin de Teste (Lovable)',
    email: 'admin@teste.lovable',
    unit: 'Evento Geral do Grupo',
    permission_level: 'admin_geral',
    is_active: true,
    created_at: d(1, 9),
    updated_at: d(1, 9),
  },
  {
    id: 'test-gestor-dic',
    name: 'Gestor DIC Teste',
    email: 'gestor.dic@teste.lovable',
    unit: 'DIC',
    permission_level: 'gestor_unidade',
    is_active: true,
    created_at: d(1, 10),
    updated_at: d(1, 10),
  },
  {
    id: 'test-gestor-nilopolis',
    name: 'Gestor Nilópolis Teste',
    email: 'gestor.nilopolis@teste.lovable',
    unit: 'Nilópolis',
    permission_level: 'gestor_unidade',
    is_active: true,
    created_at: d(1, 10),
    updated_at: d(1, 10),
  },
  {
    id: 'test-gestor-santana',
    name: 'Gestor Santana Teste',
    email: 'gestor.santana@teste.lovable',
    unit: 'Santana',
    permission_level: 'gestor_unidade',
    is_active: true,
    created_at: d(1, 10),
    updated_at: d(1, 10),
  },
  {
    id: 'test-usuario-nilopolis',
    name: 'Usuário Padrão Nilópolis',
    email: 'user.nilopolis@teste.lovable',
    unit: 'Nilópolis',
    permission_level: 'usuario_padrao',
    is_active: true,
    created_at: d(1, 11),
    updated_at: d(1, 11),
  },
  {
    id: 'test-visualizador-santana',
    name: 'Visualizador Santana',
    email: 'view.santana@teste.lovable',
    unit: 'Santana',
    permission_level: 'usuario_padrao',
    is_active: true,
    created_at: d(1, 12),
    updated_at: d(1, 12),
  },
  {
    id: 'test-inativo',
    name: 'Usuário Inativo Teste',
    email: 'inativo@teste.lovable',
    unit: 'DIC',
    permission_level: 'usuario_padrao',
    is_active: false,
    created_at: d(1, 13),
    updated_at: d(1, 13),
  }
];
