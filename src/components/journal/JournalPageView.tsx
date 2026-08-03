import { cn } from '@/lib/utils';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import { JournalImageBlockView } from '@/components/journal/JournalImageBlockView';
import anaLogo from '@/assets/ana-brasil-logo.svg';
import {
  TEXT_STYLE_CLASSES,
  journalColor,
  type JournalBlock,
  type JournalImageBlock,
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

interface BlockViewProps {
  block: JournalBlock;
  selected?: boolean;
  interactive?: boolean;
  scale?: number;
  onSelect?: (id: string) => void;
  onChangeBlock?: (id: string, patch: Partial<JournalBlock>) => void;
  frameModeId?: string | null;
  onToggleFrameMode?: (id: string | null) => void;
}

export function JournalBlockView({
  block,
  selected,
  interactive,
  scale,
  onSelect,
  onChangeBlock,
  frameModeId,
  onToggleFrameMode,
}: BlockViewProps) {
  const wrapper = cn(
    SPAN_CLASS[block.span] ?? 'col-span-6',
    interactive && 'cursor-pointer rounded-sm transition-[box-shadow]',
    interactive && !selected && 'hover:shadow-[0_0_0_1.5px_hsl(var(--ring))]',
    selected && block.kind !== 'image' && 'shadow-[0_0_0_2px_hsl(var(--primary))]',
  );

  const handleClick = interactive ? () => onSelect?.(block.id) : undefined;

  if (block.kind === 'text') {
    return (
      <div className={wrapper} onClick={handleClick}>
        <p
          className={cn(
            TEXT_STYLE_CLASSES[block.style],
            'whitespace-pre-wrap',
            block.align === 'center' && 'text-center',
            block.align === 'right' && 'text-right',
            block.align === 'left' && 'text-left',
            block.align === 'justify' && 'text-justify',
          )}
          style={{
            color: journalColor(block.color),
            ...(block.style === 'destaque'
              ? { borderLeftColor: block.color ? journalColor(block.color) : '#F5705B' }
              : {}),
          }}
        >
          {block.content || ' '}
        </p>
      </div>
    );
  }

  if (block.kind === 'image') {
    return (
      <JournalImageBlockView
        block={block}
        wrapperClass={wrapper}
        selected={selected}
        interactive={interactive}
        scale={scale}
        onSelect={onSelect}
        onChange={(patch: Partial<JournalImageBlock>) => onChangeBlock?.(block.id, patch as Partial<JournalBlock>)}
        frameMode={frameModeId === block.id}
        onToggleFrameMode={onToggleFrameMode}
      />
    );
  }


  if (block.kind === 'agenda') {
    return (
      <div className={wrapper} onClick={handleClick}>
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
      </div>
    );
  }

  return (
    <div className={wrapper} onClick={handleClick}>
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
  /** Escala aplicada ao canvas — necessária para o redimensionamento por alças. */
  scale?: number;
  onSelectBlock?: (id: string) => void;
  onChangeBlock?: (id: string, patch: Partial<JournalBlock>) => void;
  frameModeId?: string | null;
  onToggleFrameMode?: (id: string | null) => void;
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
  scale,
  onSelectBlock,
  onChangeBlock,
  frameModeId,
  onToggleFrameMode,
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
        data-journal-grid
        className="grid flex-1 grid-cols-6 content-start gap-x-4 gap-y-3 overflow-hidden px-12 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        {page.blocks.map((block) => (
          <JournalBlockView
            key={block.id}
            block={block}
            interactive={interactive}
            scale={scale}
            selected={selectedBlockId === block.id}
            onSelect={onSelectBlock}
            onChangeBlock={onChangeBlock}
            frameModeId={frameModeId}
            onToggleFrameMode={onToggleFrameMode}
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
