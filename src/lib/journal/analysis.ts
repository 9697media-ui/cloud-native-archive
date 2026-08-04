import {
  TEXT_STYLE_DEFAULT_SIZES,
  type BlockSpan,
  type JournalBlock,
  type JournalPage,
} from './types';

export interface JournalSuggestion {
  id: string;
  blockId: string;
  message: string;
  /** Alteração aplicável com um clique (sempre requer confirmação da usuária). */
  patch: Partial<JournalBlock>;
}

/** Faixa institucional aceitável de corpo de texto e entrelinha. */
const MAX_FONT_DELTA = 6;
const LINE_HEIGHT_RANGE: [number, number] = [1.1, 1.9];

/**
 * Camada de análise (somente leitura): não altera conteúdo, apenas sugere.
 * Todas as sugestões exigem confirmação — nada é aplicado automaticamente.
 */
export function analyzePage(page: JournalPage | undefined): JournalSuggestion[] {
  if (!page || page.locked) return [];
  const suggestions: JournalSuggestion[] = [];

  page.blocks.forEach((block, index) => {
    if (block.kind === 'text') {
      if (block.content.length > 320 && block.span < 6) {
        suggestions.push({
          id: `${block.id}-span`,
          blockId: block.id,
          message: 'Texto longo em coluna estreita — sugerido 6/6.',
          patch: { span: 6 as BlockSpan },
        });
      }

      const base = TEXT_STYLE_DEFAULT_SIZES[block.style];
      if (block.fontSize && Math.abs(block.fontSize - base) > MAX_FONT_DELTA) {
        suggestions.push({
          id: `${block.id}-font`,
          blockId: block.id,
          message: `Fonte fora do padrão institucional (${block.fontSize}px) — voltar para ${base}px.`,
          patch: { fontSize: undefined },
        });
      }

      if (
        block.lineHeight &&
        (block.lineHeight < LINE_HEIGHT_RANGE[0] || block.lineHeight > LINE_HEIGHT_RANGE[1])
      ) {
        suggestions.push({
          id: `${block.id}-lh`,
          blockId: block.id,
          message: 'Entrelinha fora da faixa institucional — voltar ao padrão.',
          patch: { lineHeight: undefined },
        });
      }

      // Legenda deve acompanhar a largura da imagem imediatamente acima.
      const previous = page.blocks[index - 1];
      if (block.style === 'legenda' && previous?.kind === 'image' && previous.span !== block.span) {
        suggestions.push({
          id: `${block.id}-legenda`,
          blockId: block.id,
          message: `Legenda deveria acompanhar a largura da imagem (${previous.span}/6).`,
          patch: { span: previous.span },
        });
      }
    }

    if (block.kind === 'image' && !block.height && block.span === 6) {
      suggestions.push({
        id: `${block.id}-img`,
        blockId: block.id,
        message: 'Imagem ocupando a página inteira — sugerido 3/6 para abrir espaço ao texto.',
        patch: { span: 3 as BlockSpan },
      });
    }
  });

  return suggestions;
}
