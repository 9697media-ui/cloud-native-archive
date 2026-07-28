/**
 * Fonte canônica das unidades para o Informativo.
 *
 * Derivada de `transparency_configs` (Portal da Transparência), com:
 *  - remoção do prefixo numérico de ordenação de pasta ("1 ", "14 ");
 *  - correção de typos aprovados (Paiuí → Piauí, Paulo Friere → Paulo Freire);
 *  - exclusão das unidades com "(Parceria Finalizada)" do seletor (decisão #3).
 */

export type NewsUnitType = 'Institucional' | 'NAVE' | 'CEI';

export interface NewsUnit {
  /** Slug estável usado como valor do seletor e persistido no rascunho. */
  id: string;
  /** Nome oficial exibido no cabeçalho do preview e do PDF. */
  name: string;
  /** Nome curto usado apenas na interface do editor. */
  short: string;
  type: NewsUnitType;
  /** Unidades inativas não aparecem no seletor, mas continuam legíveis. */
  active: boolean;
}

export const NEWS_UNITS: NewsUnit[] = [
  { id: 'goe', name: 'Grupo de Oração Esperança', short: 'GOE', type: 'Institucional', active: true },

  { id: 'ana-nilopolis', name: 'ANA Jardim Nilópolis', short: 'Nilópolis', type: 'NAVE', active: true },
  { id: 'ana-dic', name: 'ANA DIC', short: 'DIC', type: 'NAVE', active: true },
  { id: 'ana-santana', name: 'ANA Jardim Santana', short: 'Santana', type: 'NAVE', active: true },
  { id: 'ana-piaui', name: 'ANA Piauí', short: 'Piauí', type: 'NAVE', active: true },
  { id: 'ana-oziel', name: 'ANA Oziel', short: 'Oziel', type: 'NAVE', active: true },

  { id: 'cei-pierre-weil', name: 'CEI Bem Querer Prof. Pierre Weil', short: 'Pierre Weil', type: 'CEI', active: true },
  { id: 'cei-calmon', name: 'CEI Bem Querer Sen. João de Medeiros Calmon', short: 'Calmon', type: 'CEI', active: true },
  { id: 'cei-velardi-gaspar', name: 'CEI Bem Querer Célia A. J. Velardi Gaspar', short: 'Porto', type: 'CEI', active: true },
  { id: 'cei-portela-santana', name: 'CEI Bem Querer Rogério L. P. Santana', short: 'São José', type: 'CEI', active: true },
  { id: 'cei-anisio-spinola', name: 'CEI Bem Querer Prof. Anísio Spínola', short: 'Anísio', type: 'CEI', active: true },
  { id: 'cei-capanema', name: 'CEI Bem Querer Min. Gustavo Capanema', short: 'Capanema', type: 'CEI', active: true },
  { id: 'cei-brizola', name: 'CEI Bem Querer Gov. Leonel de Moura Brizola', short: 'Leonel', type: 'CEI', active: true },
  { id: 'cei-paulo-freire', name: 'CEI Bem Querer Paulo Reglus Neves Freire', short: 'Paulo Freire', type: 'CEI', active: true },
  { id: 'cei-mayara-masson', name: 'CEI Bem Querer Mayara Masson Christofoletti', short: 'Mayara Masson', type: 'CEI', active: true },
  { id: 'cei-ferramola', name: 'CEI Bem Querer Profa. Renata Ferramola', short: 'Ferramola', type: 'CEI', active: true },
  { id: 'cei-vandir', name: 'CEI Bem Querer Vandir Justino da Costa Dias', short: 'Vandir', type: 'CEI', active: true },

  // Parcerias finalizadas — fora do seletor (decisão #3), mantidas para leitura de informativos históricos.
  { id: 'cei-midori', name: 'CEI Bem Querer Midori Hamamoto', short: 'Midori', type: 'CEI', active: false },
  { id: 'cei-bernhard-johnson', name: 'CEI Bem Querer Rev. Bernhard Johnson Jr.', short: 'Eldorado', type: 'CEI', active: false },
  { id: 'cei-nardi-neto', name: 'CEI Bem Querer João Batista Nardi Neto', short: 'João Batista', type: 'CEI', active: false },
];

/** Unidades disponíveis para criar novos informativos. */
export const ACTIVE_NEWS_UNITS = NEWS_UNITS.filter((unit) => unit.active);

/** Agrupamento para o seletor: dois grupos apenas — Social (NAVEs) e Educação (CEIs + Institucional). */
export const NEWS_UNIT_GROUPS: { label: string; units: NewsUnit[] }[] = [
  { label: 'Social', units: ACTIVE_NEWS_UNITS.filter((u) => u.type === 'NAVE') },
  {
    label: 'Educação',
    units: ACTIVE_NEWS_UNITS.filter((u) => u.type === 'CEI' || u.type === 'Institucional'),
  },
];

export function findNewsUnit(id: string | undefined | null): NewsUnit | undefined {
  if (!id) return undefined;
  return NEWS_UNITS.find((unit) => unit.id === id);
}

export function newsUnitName(id: string | undefined | null): string {
  return findNewsUnit(id)?.name ?? '';
}
