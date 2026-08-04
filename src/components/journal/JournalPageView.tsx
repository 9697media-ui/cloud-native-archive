import { useRef, useState, useEffect, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import anaLogo from '@/assets/ana-brasil-logo.svg';
import {
  TEXT_STYLE_CLASSES,
  journalColor,
  type JournalBlock,
  type JournalPage,
  type JournalTemplate,
} from '@/lib/journal/types';
import { COVER_TEMPLATES } from '@/lib/journal/templates';

export const A4_W = 794;
export const A4_H = 1123;
export const PAPER_WHITE = '#FFFFFF';
export const PAPER_OFFWHITE = '#F0EEE4';

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
  locked?: boolean;
  onSelect?: (id: string) => void;
  gridRef?: RefObject<HTMLDivElement>;
  onResizeSpan?: (id: string, span: number) => void;
  onResizeHeight?: (id: string, height: number | undefined) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  paper: 'branco' | 'offwhite';
  onDragging?: (dragging: boolean) => void;
}

export function JournalBlockView({
  block,
  selected,
  interactive,
  locked,
  onSelect,
  gridRef,
  onResizeSpan,
  onResizeHeight,
  onReorder,
  paper,
  onDragging,
}: BlockViewProps) {
  const [dropSide, setDropSide] = useState<'before' | 'after' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canDrag = Boolean(interactive && onReorder && !locked);
  const isCover = paper === 'offwhite';

  const wrapper = cn(
    'group/block relative transition-[box-shadow,transform,opacity] duration-150 ease-out',
    SPAN_CLASS[block.span] ?? 'col-span-6',
    interactive && !locked && 'cursor-pointer',
    interactive && !locked && !selected && 'hover:shadow-[0_0_0_1.5px_hsl(var(--ring))]',
    selected && !locked && 'ring-2 ring-primary transition-shadow duration-150',
    selected && locked && 'ring-2 ring-primary/60 transition-shadow duration-150',
    block.height ? 'overflow-hidden' : undefined,
    isDragging && 'opacity-60 scale-[0.98]',
  );

  const handleClick = interactive && !locked ? () => onSelect?.(block.id) : undefined;

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (locked) return;
    const grid = gridRef?.current;
    const blockEl = (event.currentTarget as HTMLElement).parentElement;
    if (!grid || !blockEl || !onResizeSpan) return;

    onSelect?.(block.id);
    const startX = event.clientX;
    const startSpan = block.span;
    const colWidth = blockEl.getBoundingClientRect().width / startSpan;
    if (colWidth <= 0) return;

    onDragging?.(true);
    let lastSpan: number = startSpan;
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
      onDragging?.(false);
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizeHeight = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (locked) return;
    const blockEl = (event.currentTarget as HTMLElement).parentElement;
    if (!blockEl || !onResizeHeight) return;

    onSelect?.(block.id);
    const rect = blockEl.getBoundingClientRect();
    const startY = event.clientY;
    const startHeight = block.height ?? rect.height;
    const scale = rect.height > 0 ? rect.height / blockEl.offsetHeight : 1;

    onDragging?.(true);
    let lastHeight = startHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientY - startY) / (scale || 1);
      const next = Math.max(24, Math.round(startHeight + delta));
      if (next !== lastHeight) {
        lastHeight = next;
        onResizeHeight(block.id, next);
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      onDragging?.(false);
    };
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const resizeHandle =
    interactive && onResizeSpan && !locked ? (
      <div
        role="presentation"
        data-pdf-helper="true"
        onMouseDown={startResize}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'absolute -right-2 top-0 bottom-0 z-30 flex w-4 cursor-col-resize items-center justify-center',
          'opacity-0 transition-opacity duration-100 group-hover/block:opacity-100',
          selected && 'opacity-100',
        )}
      >
        <div className="h-10 w-1.5 rounded-full bg-primary/70 shadow-sm transition-colors hover:bg-primary" />
      </div>
    ) : null;

  const heightHandle =
    interactive && onResizeHeight && !locked ? (
      <div
        role="presentation"
        data-pdf-helper="true"
        onMouseDown={startResizeHeight}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onResizeHeight(block.id, undefined);
        }}
        onClick={(event) => event.stopPropagation()}
        title="Arraste para ajustar a altura · clique duplo para altura automática"
        className={cn(
          'absolute -bottom-2 left-0 right-0 z-30 flex h-4 cursor-row-resize items-center justify-center',
          'opacity-0 transition-opacity duration-100 group-hover/block:opacity-100',
          selected && 'opacity-100',
        )}
      >
        <div className="h-1.5 w-10 rounded-full bg-primary/70 shadow-sm transition-colors hover:bg-primary" />
      </div>
    ) : null;

  const dragHandle = canDrag ? (
    <div
      role="presentation"
      data-pdf-helper="true"
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/journal-block', block.id);
        onSelect?.(block.id);
        setIsDragging(true);
        onDragging?.(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragging?.(false);
      }}
      onClick={(event) => event.stopPropagation()}
      title="Arraste para reordenar o bloco"
      className={cn(
        'absolute -left-2 top-0 bottom-0 z-30 flex w-4 cursor-grab items-center justify-center active:cursor-grabbing',
        'opacity-0 transition-opacity duration-100 group-hover/block:opacity-100',
        selected && 'opacity-100',
      )}
    >
      <div className="h-10 w-1.5 rounded-full bg-primary/40 shadow-sm transition-colors hover:bg-primary" />
    </div>
  ) : null;

  const spanBadge =
    interactive && onResizeSpan && !locked ? (
      <span
        data-pdf-helper="true"
        className={cn(
          'pointer-events-none absolute -top-2 right-1 z-30 rounded bg-primary px-1 text-[9px] font-bold text-primary-foreground',
          'opacity-0 transition-opacity duration-100 group-hover/block:opacity-100',
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
      ...(block.fontSize ? { fontSize: `${block.fontSize}px` } : {}),
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
    const hasFixedHeight = Boolean(block.height);
    content = (
      <figure className={cn('m-0', hasFixedHeight && 'flex h-full flex-col')}>
        <div
          className={cn(
            'w-full overflow-hidden bg-[#E4E0D2]',
            hasFixedHeight ? 'min-h-0 flex-1' : RATIO_CLASS[block.ratio],
          )}
        >
          {block.url ? (
            <img
              src={block.url}
              alt={block.caption || 'Imagem do jornal'}
              className={cn(
                'h-full w-full',
                block.fit === 'contain' ? 'object-contain' : 'object-cover',
                isCover ? 'rounded-none' : 'rounded-sm',
              )}
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
            className={cn(TEXT_STYLE_CLASSES.legenda, 'mt-1 px-0')}
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
    <div
      className={wrapper}
      data-block-kind={block.kind}
      onClick={handleClick}
      style={block.height ? { height: block.height } : undefined}
      onDragOver={
        canDrag
          ? (event) => {
              if (!event.dataTransfer.types.includes('text/journal-block')) return;
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              setDropSide(event.clientX - rect.left < rect.width / 2 ? 'before' : 'after');
            }
          : undefined
      }
      onDragLeave={canDrag ? () => setDropSide(null) : undefined}
      onDrop={
        canDrag
          ? (event) => {
              const draggedId = event.dataTransfer.getData('text/journal-block');
              event.preventDefault();
              event.stopPropagation();
              setDropSide(null);
              if (draggedId && draggedId !== block.id) onReorder?.(draggedId, block.id);
            }
          : undefined
      }
    >
      {content}
      {dropSide && (
        <div
          data-pdf-helper="true"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-0 bottom-0 z-40 w-1 rounded bg-primary transition-all duration-150',
            dropSide === 'before' ? '-left-1' : '-right-1',
          )}
        />
      )}
      {spanBadge}
      {dragHandle}
      {resizeHandle}
      {heightHandle}
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
  onResizeBlockSpan?: (id: string, span: number) => void;
  onResizeBlockHeight?: (id: string, height: number | undefined) => void;
  onReorderBlocks?: (draggedId: string, targetId: string) => void;
  className?: string;
  paper?: 'branco' | 'offwhite';
  onOverflow?: (overflow: number) => void;
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
  onResizeBlockSpan,
  onResizeBlockHeight,
  onReorderBlocks,
  className,
  paper = 'branco',
  onOverflow,
}: JournalPageViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isLocked = page.locked ?? COVER_TEMPLATES.includes(page.template);
  const paperColor = paper === 'offwhite' ? PAPER_OFFWHITE : PAPER_WHITE;

  // Detecta estouro de conteúdo em relação à área útil da página.
  const measureOverflow = () => {
    if (!contentRef.current || !onOverflow) return;
    const headerFooter = 220; // cabeçalho + rodapé aproximados
    const usefulHeight = A4_H - headerFooter;
    const renderedHeight = contentRef.current.scrollHeight;
    onOverflow(Math.max(0, renderedHeight - usefulHeight));
  };

  return (
    <div
      className={cn('relative flex flex-col overflow-hidden', className)}
      style={{ width: A4_W, height: A4_H, backgroundColor: paperColor, boxShadow: '0 8px 28px -12px rgba(0,0,0,0.25)' }}
      onClick={onSelectPageArea}
      data-journal-page={page.id}
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

      <div className="relative flex-1">
        {interactive && !isLocked && (
          <div
            data-pdf-helper="true"
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 z-0 grid grid-cols-6 gap-x-4 px-12 py-6 transition-opacity duration-200',
              dragging ? 'opacity-100' : 'opacity-0',
            )}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-full rounded-[2px] border border-dashed border-primary/30 bg-primary/[0.04]',
                  dragging && 'bg-primary/[0.08]',
                )}
              />
            ))}
          </div>
        )}

        <div
          ref={gridRef}
          className="relative z-10 grid h-full grid-cols-6 content-start gap-x-4 gap-y-3 overflow-hidden px-12 py-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div ref={contentRef} className="contents">
            {page.blocks.map((block) => (
              <JournalBlockView
                key={block.id}
                block={block}
                interactive={interactive}
                locked={isLocked}
                selected={selectedBlockId === block.id}
                onSelect={onSelectBlock}
                gridRef={gridRef}
                onResizeSpan={onResizeBlockSpan}
                onResizeHeight={onResizeBlockHeight}
                onReorder={onReorderBlocks}
                paper={paper}
                onDragging={setDragging}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-12 pb-1 text-right text-[9px] text-[#5C5A50]">
        {index + 1} / {total}
      </div>
      <InstitutionalFooterBar className="w-full" />
    </div>
  );
}
