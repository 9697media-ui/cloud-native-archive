import { useRef, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import anaLogo from '@/assets/ana-brasil-logo.svg';
import {
  TEXT_STYLE_CLASSES,
  journalColor,
  type JournalBlock,
  type JournalPage,
} from '@/lib/journal/types';

export const A4_W = 794;
export const A4_H = 1123;

const SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
};

const RATIO_CLASS: Record<string, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
};

interface BlockViewProps {
  block: JournalBlock;
  selected?: boolean;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  /** Grade da página — usada para converter arraste em colunas. */
  gridRef?: RefObject<HTMLDivElement>;
  /** Redimensionamento direto no canvas (colunas de 1 a 6). */
  onResizeSpan?: (id: string, span: number) => void;
}

export function JournalBlockView({
  block,
  selected,
  interactive,
  onSelect,
  gridRef,
  onResizeSpan,
}: BlockViewProps) {
  const wrapper = cn(
    'group/block relative',
    SPAN_CLASS[block.span] ?? 'col-span-6',
    interactive && 'cursor-pointer rounded-sm transition-[box-shadow]',
    interactive && !selected && 'hover:shadow-[0_0_0_1.5px_hsl(var(--ring))]',
    selected && 'shadow-[0_0_0_2px_hsl(var(--primary))]',
  );

  const handleClick = interactive ? () => onSelect?.(block.id) : undefined;

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const grid = gridRef?.current;
    if (!grid || !onResizeSpan) return;

    onSelect?.(block.id);
    const startX = event.clientX;
    const startSpan = block.span;
    // getBoundingClientRect já considera o zoom aplicado ao canvas.
    const colWidth = grid.getBoundingClientRect().width / 6;
    if (colWidth <= 0) return;

    let lastSpan = startSpan;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const next = Math.max(1, Math.min(6, startSpan + Math.round(delta / colWidth)));
      if (next !== lastSpan) {
        lastSpan = next;
        onResizeSpan(block.id, next);
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const resizeHandle =
    interactive && onResizeSpan ? (
      <div
        role="presentation"
        data-pdf-helper="true"
        onMouseDown={startResize}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'absolute -right-2 top-0 bottom-0 z-30 flex w-4 cursor-col-resize items-center justify-center',
          'opacity-0 transition-opacity group-hover/block:opacity-100',
          selected && 'opacity-100',
        )}
      >
        <div className="h-10 w-1.5 rounded-full bg-primary/70 shadow-sm transition-colors hover:bg-primary" />
      </div>
    ) : null;

  const spanBadge =
    interactive && onResizeSpan ? (
      <span
        data-pdf-helper="true"
        className={cn(
          'pointer-events-none absolute -top-2 right-1 z-30 rounded bg-primary px-1 text-[9px] font-bold text-primary-foreground',
          'opacity-0 transition-opacity group-hover/block:opacity-100',
          selected && 'opacity-100',
        )}
      >
        {block.span}/6
      </span>
    ) : null;

  let content: React.ReactNode = null;

  if (block.kind === 'text') {
    const textClasses = cn(
      TEXT_STYLE_CLASSES[block.style],
      'whitespace-pre-wrap',
      block.align === 'center' && 'text-center',
      block.align === 'right' && 'text-right',
      block.align === 'left' && 'text-left',
      block.align === 'justify' && 'text-justify',
      block.bold && 'font-bold',
      block.italic && 'italic',
    );
    const textStyle = {
      color: journalColor(block.color),
      ...(block.lineHeight ? { lineHeight: block.lineHeight } : {}),
      ...(block.style === 'destaque'
        ? { borderLeftColor: block.color ? journalColor(block.color) : '#F5705B' }
        : {}),
    };
    const lines = block.content.split('\n').filter((line) => line.trim().length > 0);

    content = block.list ? (
      <ul className={cn(textClasses, 'list-disc pl-4')} style={textStyle}>
        {(lines.length ? lines : [' ']).map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    ) : (
      <p className={textClasses} style={textStyle}>
        {block.content || ' '}
      </p>
    );
  } else if (block.kind === 'image') {
    content = (
      <figure className="m-0">
        <div className={cn('w-full overflow-hidden bg-[#E4E0D2]', RATIO_CLASS[block.ratio])}>
          {block.url ? (
            <img
              src={block.url}
              alt={block.caption || 'Imagem do jornal'}
              className={cn('h-full w-full', block.fit === 'contain' ? 'object-contain' : 'object-cover')}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-[#8B8778]">
              Imagem
            </div>
          )}
        </div>
        {block.caption && (
          <figcaption
            className={cn(TEXT_STYLE_CLASSES.legenda, 'mt-1')}
            style={{ color: block.color ? journalColor(block.color) : '#5C5A50' }}
          >
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  } else if (block.kind === 'agenda') {
    content = (
      <ul className="divide-y divide-[#D9D4C4]">
        {block.items.map((item) => (
          <li key={item.id} className="flex gap-3 py-1.5">
            <span className="w-14 shrink-0 text-[11px] font-bold text-news-brand-1">{item.date}</span>
            <span className="flex-1 text-[11px] font-semibold text-[#1F211F]">{item.title}</span>
            <span className="w-12 text-right text-[10px] text-[#5C5A50]">{item.time}</span>
            <span className="w-32 text-right text-[10px] text-[#5C5A50]">{item.place}</span>
          </li>
        ))}
      </ul>
    );
  } else {
    content = (
      <div
        className="border-t-2 pt-2"
        style={{ borderTopColor: block.color ? journalColor(block.color) : '#FACC00' }}
      >
        <p
          className="text-[26px] font-extrabold leading-none"
          style={{ color: journalColor(block.color) }}
        >
          {block.value}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#5C5A50]">{block.label}</p>
      </div>
    );
  }

  return (
    <div className={wrapper} onClick={handleClick}>
      {content}
      {spanBadge}
      {resizeHandle}
    </div>
  );
}


interface JournalPageViewProps {
  page: JournalPage;
  index: number;
  total: number;
  edition: string;
  unitName: string;
  selectedBlockId?: string | null;
  interactive?: boolean;
  onSelectBlock?: (id: string) => void;
  onSelectPageArea?: () => void;
  className?: string;
}

/** Página A4 completa — o mesmo componente é usado no canvas, no preview e no PDF. */
export function JournalPageView({
  page,
  index,
  total,
  edition,
  unitName,
  selectedBlockId,
  interactive,
  onSelectBlock,
  onSelectPageArea,
  className,
}: JournalPageViewProps) {
  return (
    <div
      className={cn('relative flex flex-col overflow-hidden bg-news-paper', className)}
      style={{ width: A4_W, height: A4_H }}
      onClick={onSelectPageArea}
    >
      <div className="flex items-center justify-between px-12 pt-10">
        <img src={anaLogo} alt="ANA Brasil" className="h-9 w-auto object-contain" draggable={false} />
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1F211F]">
            Jornal Institucional
          </p>
          <p className="text-[9px] uppercase tracking-[0.14em] text-[#5C5A50]">
            {[unitName, edition].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <div className="mx-12 mt-3 h-px bg-[#D9D4C4]" />

      <div
        className="grid flex-1 grid-cols-6 content-start gap-x-4 gap-y-3 overflow-hidden px-12 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        {page.blocks.map((block) => (
          <JournalBlockView
            key={block.id}
            block={block}
            interactive={interactive}
            selected={selectedBlockId === block.id}
            onSelect={onSelectBlock}
          />
        ))}
      </div>

      <div className="px-12 pb-1 text-right text-[9px] text-[#5C5A50]">
        {index + 1} / {total}
      </div>
      <InstitutionalFooterBar className="w-full" />
    </div>
  );
}
