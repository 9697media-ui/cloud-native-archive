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

/** Composição inicial de cada modelo de página (v1). */
export function createPage(template: JournalTemplate): JournalPage {
  const blocks: JournalBlock[] = (() => {
    switch (template) {
      case 'capa':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da chamada principal', 6, 'center'),
          imageBlock(6, '16/9'),
          textBlock('chamada', 'Chamada secundária desta edição.', 3),
          textBlock('chamada', 'Outra chamada desta edição.', 3),
        ];
      case 'capa_imagem':
        return [
          imageBlock(6, '4/3'),
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da edição', 6, 'center'),
          textBlock('chamada', 'Chamada principal desta edição.', 6, 'center'),
        ];
      case 'capa_chamadas':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6, 'center'),
          textBlock('titulo_capa', 'Título da edição', 6, 'center'),
          imageBlock(6, '16/9'),
          textBlock('chamada', 'Primeira chamada desta edição.', 3),
          textBlock('chamada', 'Segunda chamada desta edição.', 3),
          textBlock('chamada', 'Terceira chamada desta edição.', 3),
          textBlock('chamada', 'Quarta chamada desta edição.', 3),
        ];
      case 'capa_editorial':
        return [
          textBlock('subtitulo', 'Jornal Institucional', 6),
          textBlock('titulo_capa', 'Título editorial da edição', 4),
          imageBlock(2, '3/4'),
          textBlock('destaque', 'Frase de abertura desta edição.', 6),
          textBlock('chamada', 'Destaque 1', 2),
          textBlock('chamada', 'Destaque 2', 2),
          textBlock('chamada', 'Destaque 3', 2),
        ];
      case 'duas_materias':
        return [
          textBlock('titulo_materia', 'Primeira matéria', 3),
          textBlock('titulo_materia', 'Segunda matéria', 3),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          textBlock('corpo', 'Texto da primeira matéria.', 3),
          textBlock('corpo', 'Texto da segunda matéria.', 3),
        ];
      case 'destaques':
        return [
          textBlock('titulo_materia', 'Destaques rápidos'),
          textBlock('chamada', 'Destaque 1', 2),
          textBlock('chamada', 'Destaque 2', 2),
          textBlock('chamada', 'Destaque 3', 2),
          imageBlock(6, '16/9'),
          textBlock('corpo', 'Comentário sobre os destaques do período.'),
        ];
      case 'materias':
        return [
          textBlock('titulo_materia', 'Matéria principal'),
          imageBlock(6, '16/9'),
          textBlock('corpo', 'Escreva aqui o texto da matéria principal.'),
          imageBlock(3, '4/3'),
          imageBlock(3, '4/3'),
          textBlock('chamada', 'Chamada da primeira imagem.', 3),
          textBlock('chamada', 'Chamada da segunda imagem.', 3),
        ];
      case 'materia':
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
        return [
          textBlock('titulo_materia', 'Resultados e números'),
          statBlock('1.200', 'Atendimentos'),
          statBlock('35', 'Ações realizadas'),
          statBlock('18', 'Parcerias ativas'),
          textBlock('corpo', 'Comentário sobre os indicadores do período.'),
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

  return { id: uid(), template, blocks };
}

export function createJournalPages(): JournalPage[] {
  return [createPage('capa'), createPage('materias'), createPage('galeria'), createPage('contracapa')];
}

/** Modelos de capa fixos oferecidos na criação do jornal. */
export const COVER_TEMPLATES: JournalTemplate[] = ['capa_imagem', 'capa_chamadas', 'capa_editorial'];

/** Layouts predefinidos de páginas internas (ordem de destaque no editor). */
export const INNER_TEMPLATES: JournalTemplate[] = [
  'materia',
  'materias',
  'duas_materias',
  'galeria',
  'agenda',
  'destaques',
  'numeros',
  'contracapa',
];

export const TEMPLATE_OPTIONS: JournalTemplate[] = [
  'capa',
  'capa_imagem',
  'capa_chamadas',
  'capa_editorial',
  'duas_materias',
  'destaques',
  'materias',
  'materia',
  'galeria',
  'agenda',
  'numeros',
  'contracapa',
  'branco',
];
