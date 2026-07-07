export type Unit = 'DIC' | 'Nilópolis' | 'Santana' | 'Administração';

export type BondType =
  | 'rh'
  | 'financeiro'
  | 'marketing'
  | 'nota_fiscal'
  | 'gestao_social'
  | 'educador'
  | 'parceiro'
  | 'usuario_comum';

export type EventStatus = 'confirmado' | 'pendente' | 'cancelado' | 'concluido';

export type EventType = 'reunião' | 'evento institucional' | 'apresentação' | 'cobertura' | 'ação externa' | 'programação interna' | 'outro';

export type PermissionLevel = 'admin_geral' | 'gestor_unidade' | 'eventos_parceiros' | 'editor' | 'usuario_padrao';

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
  external_collaborators: Array<string | { name: string; details: string }>;
  attachments: string[]; // URLs of uploaded files
  banner_url_desktop?: string;
  banner_url_mobile?: string;
  banner_image_desktop?: string;
  banner_image_mobile?: string;
  custom_color?: string;
  show_in_banner?: boolean;
  slug?: string;
  use_logo_as_title?: boolean;
  event_logo_url?: string;
  show_banner_fade?: boolean;
  full_height_title?: boolean;
  banner_display_time?: number;
  show_banner_overlay?: boolean;
  deleted_at?: string;
  target_audience?: string;
  support_team?: string;
  food_logistics?: string;
  marketing_info?: string;
  printed_materials?: string;
  equipment_needed?: string;
  marketing_items?: Array<{ type: 'cobertura' | 'demanda_grafica'; item: string; description: string }>;
  marketing_coverage?: boolean;
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
  is_beta_tester?: boolean;
  bond_type?: BondType | null;
}

export const UNITS: Unit[] = ['DIC', 'Nilópolis', 'Santana', 'Administração'];

export const UNIT_COLORS: Record<Unit, string> = {
  'DIC': 'unit-dic',
  'Nilópolis': 'unit-nilopolis',
  'Santana': 'unit-santana',
  'Administração': 'unit-geral',
};

export const UNIT_BG_COLORS: Record<Unit, string> = {
  'DIC': 'bg-unit-dic',
  'Nilópolis': 'bg-unit-nilopolis',
  'Santana': 'bg-unit-santana',
  'Administração': 'bg-unit-geral',
};

export const EVENT_TYPES: EventType[] = ['reunião', 'evento institucional', 'apresentação', 'cobertura', 'ação externa', 'programação interna', 'outro'];

export const EVENT_STATUSES: EventStatus[] = ['confirmado', 'pendente', 'cancelado', 'concluido'];

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
  { value: 'eventos_parceiros', label: 'Eventos e Parceiros' },
  { value: 'editor', label: 'Editor (Apenas Edição)' },
  { value: 'usuario_padrao', label: 'Usuário Padrão (Visualizador)' },
];
