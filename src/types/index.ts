export type Unit = 'DIC' | 'Nilópolis' | 'Santana' | 'Evento Geral do Grupo';

export type EventStatus = 'confirmado' | 'pendente' | 'cancelado';

export type EventType = 'reunião' | 'evento institucional' | 'apresentação' | 'cobertura' | 'ação externa' | 'programação interna' | 'outro';

export type PermissionLevel = 'admin_geral' | 'gestor_unidade' | 'editor' | 'usuario_padrao';

export type PartnerType = 'padrinho' | 'doador' | 'empresa' | 'figura_publica' | 'outro' | '';

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  unit: Unit;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  location: string;
  status: EventStatus;
  visibility: 'publico' | 'interno';
  has_conflict: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  notes: string;
  marketing_request: boolean;
  partner_involved: boolean;
  partner_type: PartnerType;
  partner_name: string;
  partners: Array<{ type: PartnerType; name: string }>;
  // Unit collaboration
  has_unit_collaboration: boolean;
  collaborating_units: Unit[];
  external_collaborators: string[];
  attachments: string[]; // URLs of uploaded files
  banner_url_desktop?: string;
  banner_url_mobile?: string;
  custom_color?: string;
}

export const SYSTEM_COLORS = [
  '#484848',
  '#fbce00',
  '#81e2cf',
  '#01adff',
  '#f37964',
  '#f5dfbb',
  '#f0eee4',
  '#000000',
  '#1f2322',
  '#a78bfa', // +1 complementar
];

export interface AppUser {
  id: string;
  name: string;
  email: string;
  unit: Unit;
  permission_level: PermissionLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  view_restrictions?: Unit[] | null;
  delegated_units?: Unit[] | null;
}

export const UNITS: Unit[] = ['DIC', 'Nilópolis', 'Santana', 'Evento Geral do Grupo'];

export const UNIT_COLORS: Record<Unit, string> = {
  'DIC': 'unit-dic',
  'Nilópolis': 'unit-nilopolis',
  'Santana': 'unit-santana',
  'Evento Geral do Grupo': 'unit-geral',
};

export const UNIT_BG_COLORS: Record<Unit, string> = {
  'DIC': 'bg-unit-dic',
  'Nilópolis': 'bg-unit-nilopolis',
  'Santana': 'bg-unit-santana',
  'Evento Geral do Grupo': 'bg-unit-geral',
};

export const EVENT_TYPES: EventType[] = ['reunião', 'evento institucional', 'apresentação', 'cobertura', 'ação externa', 'programação interna', 'outro'];

export const EVENT_STATUSES: EventStatus[] = ['confirmado', 'pendente', 'cancelado'];

export const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  { value: 'padrinho', label: 'Padrinho' },
  { value: 'doador', label: 'Doador' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'figura_publica', label: 'Figura Pública' },
  { value: 'outro', label: 'Outro' },
];

export const PERMISSION_LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: 'admin_geral', label: 'Admin Geral' },
  { value: 'gestor_unidade', label: 'Gestor de Unidade (Cria/Edita)' },
  { value: 'editor', label: 'Editor (Apenas Edição)' },
  { value: 'usuario_padrao', label: 'Usuário Padrão (Visualizador)' },
];
