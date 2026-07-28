/**
 * Categorias temáticas do Informativo (decisão #4).
 *
 * As antigas categorias por unidade (ANA DIC, ANA Piauí…) foram migradas para
 * categorias de assunto, já que a unidade agora é um campo explícito.
 */

export interface NewsCategory {
  value: string;
  label: string;
}

export const CATEGORY_OPTIONS: NewsCategory[] = [
  { value: '', label: 'Sem categoria' },
  { value: 'educacao', label: 'Educação' },
  { value: 'acao_social', label: 'Ação Social' },
  { value: 'evento', label: 'Evento' },
  { value: 'parceria', label: 'Parceria' },
];

export const CATEGORY_LABELS: Record<string, string> = CATEGORY_OPTIONS.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<string, string>,
);

/** Mapa de compatibilidade para rascunhos criados com as categorias antigas. */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  ana_piaui: 'educacao',
  ana_nilopolis: 'educacao',
  ana_dic: 'educacao',
  ana_santana: 'educacao',
};

export function normalizeCategory(value: string | undefined | null): string {
  if (!value) return '';
  if (CATEGORY_LABELS[value] !== undefined) return value;
  return LEGACY_CATEGORY_MAP[value] ?? '';
}

/** Texto institucional fixo do documento (decisão #5). */
export const INSTITUTIONAL_DOCUMENT_LABEL = 'INFORMATIVO INSTITUCIONAL';
