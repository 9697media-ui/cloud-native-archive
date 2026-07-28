/**
 * Unidades institucionais do informativo.
 * Fonte canônica: tabela `transparency_configs` (somente leitura).
 * O prefixo numérico da pasta ("4 Ana Piauí") é removido e a grafia
 * oficial é normalizada. Nenhum nome novo é inventado aqui.
 */

export interface NewsUnit {
  id: string;
  /** Nome oficial exibido no cabeçalho do informativo */
  name: string;
  /** Rótulo curto usado no seletor */
  short: string;
  /** Parceria encerrada — oculta do seletor por padrão */
  finished: boolean;
}

/** Remove o prefixo numérico e separadores iniciais ("1 ", "2. ", "3 - "). */
export function stripLeadingIndex(value: string): string {
  return value.replace(/^\s*\d+\s*[-.–—)]?\s*/, '').trim();
}

/** Correções de grafia validadas com a equipe. */
const NAME_FIXES: Record<string, string> = {
  'Ana Dic': 'ANA DIC',
  'Ana Piauí': 'ANA Piauí',
  'Ana Oziel': 'ANA Oziel',
  'Ana Jardim Nilópolis': 'ANA Jardim Nilópolis',
  'Ana Jardim Santana': 'ANA Jardim Santana',
};

export function normalizeUnitName(folderName: string): { name: string; finished: boolean } {
  const withoutIndex = stripLeadingIndex(folderName);
  const finished = /\(parceria finalizada\)/i.test(withoutIndex);
  const clean = withoutIndex.replace(/\s*\(parceria finalizada\)\s*/i, '').trim();
  return { name: NAME_FIXES[clean] ?? clean, finished };
}

export function toNewsUnit(row: { id: string; label: string | null; original_folder_name: string }): NewsUnit {
  const { name, finished } = normalizeUnitName(row.original_folder_name || row.label || '');
  return {
    id: row.id,
    name,
    short: (row.label || name).trim(),
    finished,
  };
}
