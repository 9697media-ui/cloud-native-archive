import {
  isCoverTemplate,
  type BlockSpan,
  type JournalBlock,
  type JournalPage,
  type JournalTemplate,
  type TextStyleKey,
} from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function textBlock(
  style: TextStyleKey,
  content: string,
  span: BlockSpan = 6,
  align: 'left' | 'center' | 'right' | 'justify' = 'left',
): JournalBlock {
  return { id: uid(), kind: 'text', style, content, span, align };
}

export function imageBlock(span: BlockSpan = 6, ratio: '16/9' | '4/3' | '1/1' | '3/4' = '16/9'): JournalBlock {
  return { id: uid(), kind: 'image', url: '', caption: '', span, ratio, fit: 'cover' };
}

export function agendaBlock(): JournalBlock {
  return {
    id: uid(),
    kind: 'agenda',
    span: 6,
    items: [
      { id: uid(), date: '05/08', title: 'Reunião de equipe', time: '09h', place: 'Sede administrativa' },
      { id: uid(), date: '12/08', title: 'Ação social', time: '14h', place: 'NAVE DIC' },
    ],
  };
}

export function statBlock(value = '0', label = 'Indicador', span: BlockSpan = 2): JournalBlock {
  return { id: uid(), kind: 'stat', value, label, span };
}

/** Composição inicial de cada modelo de página. */
export function createPage(template: JournalTemplate): JournalPage {
  const blocks: JournalBlock[] = (() => {
    switch (template) {
      // ── Capas institucionais (estruturas fixas) ───────────────────────────
      case 'capa':
      case 'capa_c1':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da chamada principal', 6, 'center'),
          { ...(imageBlock(6, '4/3') as JournalBlock), height: 520 },
          textBlock('chamada', 'Chamada desta edição.', 6, 'center'),
        ];
      case 'capa_c2':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da chamada principal', 6, 'center'),
          { ...(imageBlock(6, '16/9') as JournalBlock), height: 340 },
          textBlock('chamada', 'Primeira chamada.', 2),
          textBlock('chamada', 'Segunda chamada.', 2),
          textBlock('chamada', 'Terceira chamada.', 2),
        ];
      case 'capa_c3':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'left'),
          textBlock('titulo_capa', 'Título editorial', 4, 'left'),
          textBlock('chamada', 'Destaque 1\nDestaque 2', 2, 'left'),
          textBlock('subtitulo', 'Subtítulo de apoio', 6, 'left'),
          { ...(imageBlock(6, '4/3') as JournalBlock), height: 380 },
          textBlock('corpo', 'Texto de abertura desta edição.', 6, 'justify'),
        ];

      // ── Páginas internas ──────────────────────────────────────────────────
      case 'materias':
        return [
          textBlock('titulo_materia', 'Primeira matéria', 3),
          textBlock('titulo_materia', 'Segunda matéria', 3),
          textBlock('corpo', 'Texto da primeira matéria.', 3, 'justify'),
          textBlock('corpo', 'Texto da segunda matéria.', 3, 'justify'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
        ];
      case 'materia':
        return [
          textBlock('titulo_materia', 'Título da matéria'),
          textBlock('subtitulo', 'Subtítulo de apoio'),
          imageBlock(6, '16/9'),
          textBlock('corpo', 'Texto corrido da matéria.', 6, 'justify'),
          textBlock('destaque', 'Frase de destaque da matéria.'),
          textBlock('corpo', 'Continuação do texto da matéria.', 6, 'justify'),
        ];
      case 'galeria':
        return [
          textBlock('titulo_materia', 'Galeria de fotos'),
          textBlock('corpo', 'Breve introdução da galeria.', 6, 'justify'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
        ];
      case 'agenda':
        return [textBlock('titulo_materia', 'Agenda'), agendaBlock()];
      case 'numeros':
        return [
          textBlock('titulo_materia', 'Resultados e números'),
          statBlock('1.200', 'Atendimentos'),
          statBlock('35', 'Ações realizadas'),
          statBlock('18', 'Parcerias ativas'),
          textBlock('corpo', 'Comentário sobre os indicadores do período.', 6, 'justify'),
        ];
      case 'destaques':
        return [
          textBlock('titulo_materia', 'Chamada principal'),
          imageBlock(6, '16/9'),
          textBlock('corpo', 'Texto da chamada principal.', 6, 'justify'),
          textBlock('chamada', 'Destaque 1', 2),
          textBlock('chamada', 'Destaque 2', 2),
          textBlock('chamada', 'Destaque 3', 2),
        ];
      case 'contracapa':
        return [
          textBlock('titulo_materia', 'Mensagem institucional', 6, 'center'),
          textBlock('corpo', 'Texto de encerramento desta edição.', 6, 'justify'),
          textBlock('chamada', 'contato@anabrasil.org · @anabrasil', 6, 'center'),
        ];
      default:
        return [textBlock('corpo', 'Novo bloco de texto.')];
    }
  })();

  return { id: uid(), template, blocks, locked: isCoverTemplate(template) };
}

export function createJournalPages(cover: JournalTemplate = 'capa_c1'): JournalPage[] {
  return [createPage(cover), createPage('materia'), createPage('galeria'), createPage('contracapa')];
}

/** Modelos disponíveis para páginas internas (sem capas e sem página em branco). */
export const TEMPLATE_OPTIONS: JournalTemplate[] = [
  'materia',
  'materias',
  'galeria',
  'agenda',
  'numeros',
  'destaques',
  'contracapa',
];
