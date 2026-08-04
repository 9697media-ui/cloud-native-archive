import type {
  BlockSpan,
  JournalBlock,
  JournalPage,
  JournalTemplate,
  TextStyleKey,
} from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function textBlock(
  style: TextStyleKey,
  content: string,
  span: BlockSpan = 6,
  align: 'left' | 'center' | 'right' = 'left',
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

/** Cria uma página a partir de um modelo. Suporta templates legacy e novos. */
export function createPage(template: JournalTemplate): JournalPage {
  const blocks: JournalBlock[] = (() => {
    switch (template) {
      case 'capa':
      case 'capa_c1':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da chamada principal', 6, 'center'),
          imageBlock(6, '16/9'),
          textBlock('chamada', 'Chamada secundária desta edição.', 3),
          textBlock('chamada', 'Outra chamada desta edição.', 3),
        ];
      case 'capa_c2':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da edição', 6, 'center'),
          imageBlock(6, '4/3'),
          textBlock('chamada', 'Primeira chamada', 2),
          textBlock('chamada', 'Segunda chamada', 2),
          textBlock('chamada', 'Terceira chamada', 2),
        ];
      case 'capa_c3':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título editorial', 4, 'left'),
          textBlock('chamada', 'Destaque 1', 2),
          textBlock('chamada', 'Destaque 2', 2),
          textBlock('subtitulo', 'Subtítulo de abertura', 4, 'left'),
          imageBlock(4, '4/3'),
          textBlock('corpo', 'Texto de abertura da edição.', 4),
        ];
      case 'materias':
      case 'duas_materias':
        return [
          textBlock('titulo_materia', 'Matéria principal'),
          textBlock('subtitulo', 'Subtítulo de apoio'),
          textBlock('corpo', 'Escreva aqui o texto da primeira matéria.', 3),
          textBlock('corpo', 'Escreva aqui o texto da segunda matéria.', 3),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
        ];
      case 'materia':
      case 'materia_imagem':
        return [
          textBlock('titulo_materia', 'Título da matéria'),
          textBlock('subtitulo', 'Subtítulo de apoio'),
          imageBlock(6, '16/9'),
          textBlock('corpo', 'Texto corrido da matéria.'),
          textBlock('destaque', 'Frase de destaque da matéria.'),
          textBlock('corpo', 'Continuação do texto da matéria.'),
        ];
      case 'galeria':
        return [
          textBlock('titulo_materia', 'Galeria de fotos'),
          textBlock('corpo', 'Breve introdução da galeria.'),
          imageBlock(6, '16/9'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
        ];
      case 'agenda':
        return [textBlock('titulo_materia', 'Agenda'), agendaBlock()];
      case 'numeros':
      case 'destaques_numeros':
        return [
          textBlock('titulo_materia', 'Resultados e números'),
          statBlock('1.200', 'Atendimentos'),
          statBlock('35', 'Ações realizadas'),
          statBlock('18', 'Parcerias ativas'),
          textBlock('corpo', 'Comentário sobre os indicadores do período.'),
        ];
      case 'chamada_destaque':
        return [
          textBlock('titulo_capa', 'Chamada principal', 6, 'center'),
          imageBlock(6, '16/9'),
          textBlock('chamada', 'Destaque 1', 2),
          textBlock('chamada', 'Destaque 2', 2),
          textBlock('chamada', 'Destaque 3', 2),
          textBlock('corpo', 'Texto de apoio.', 6),
        ];
      case 'contracapa':
        return [
          textBlock('titulo_materia', 'Mensagem institucional', 6, 'center'),
          textBlock('corpo', 'Texto de encerramento desta edição.', 6),
          textBlock('chamada', 'contato@anabrasil.org · @anabrasil', 6, 'center'),
        ];
      default:
        return [textBlock('corpo', 'Novo bloco de texto.')];
    }
  })();

  const locked = template.startsWith('capa');
  return { id: uid(), template, blocks, locked };
}

/** Páginas iniciais de um jornal padrão (estrutura sugerida: capa + matéria + galeria + contracapa). */
export function createJournalPages(): JournalPage[] {
  return [
    createPage('capa_c1'),
    createPage('materia_imagem'),
    createPage('galeria'),
    createPage('contracapa'),
  ];
}

/** Templates de criação: capas e layouts internos. */
export const TEMPLATE_OPTIONS: JournalTemplate[] = [
  'capa_c1',
  'capa_c2',
  'capa_c3',
  'materia_imagem',
  'duas_materias',
  'galeria',
  'agenda',
  'destaques_numeros',
  'chamada_destaque',
  'contracapa',
  'branco',
];

/** Templates de capa (travados). */
export const COVER_TEMPLATES: JournalTemplate[] = ['capa_c1', 'capa_c2', 'capa_c3', 'capa'];

/** Templates de página interna (livres). */
export const INTERNAL_TEMPLATES: JournalTemplate[] = [
  'materia_imagem',
  'duas_materias',
  'galeria',
  'agenda',
  'destaques_numeros',
  'chamada_destaque',
  'contracapa',
  'branco',
];
