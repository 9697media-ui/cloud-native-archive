import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  IMAGE_MAX_HEIGHT,
  IMAGE_MIN_HEIGHT,
  SNAP_THRESHOLD,
  TEXT_STYLE_CLASSES,
  journalColor,
  pxToMm,
  type JournalImageBlock,
} from '@/lib/journal/types';

const RATIO_CLASS: Record<string, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
};

type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';

const CORNERS: HandleId[] = ['nw', 'ne', 'sw', 'se'];
const SIDES: HandleId[] = ['n', 's', 'w', 'e'];

const HANDLE_POS: Record<HandleId, string> = {
  nw: '-top-[4px] -left-[4px] cursor-nwse-resize',
  ne: '-top-[4px] -right-[4px] cursor-nesw-resize',
  sw: '-bottom-[4px] -left-[4px] cursor-nesw-resize',
  se: '-bottom-[4px] -right-[4px] cursor-nwse-resize',
  n: '-top-[4px] left-1/2 -translate-x-1/2 cursor-ns-resize',
  s: '-bottom-[4px] left-1/2 -translate-x-1/2 cursor-ns-resize',
  w: 'top-1/2 -left-[4px] -translate-y-1/2 cursor-ew-resize',
  e: 'top-1/2 -right-[4px] -translate-y-1/2 cursor-ew-resize',
};

export interface ImageBlockViewProps {
  block: JournalImageBlock;
  wrapperClass: string;
  selected?: boolean;
  interactive?: boolean;
  /** Escala do canvas, usada para converter pixels de tela em pixels A4. */
  scale?: number;
  onSelect?: (id: string) => void;
  onChange?: (patch: Partial<JournalImageBlock>) => void;
  frameMode?: boolean;
  onToggleFrameMode?: (id: string | null) => void;
}

/** Bloco de imagem com quadro redimensionável, recorte por ponto focal e guias magnéticas. */
export function JournalImageBlockView({
  block,
  wrapperClass,
  selected,
  interactive,
  scale = 1,
  onSelect,
  onChange,
  frameMode,
  onToggleFrameMode,
}: ImageBlockViewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<{ width: number; height: number } | null>(null);
  const [guide, setGuide] = useState<'top' | 'bottom' | null>(null);
  const [overflow, setOverflow] = useState(false);

  const focal = block.focal ?? { x: 0.5, y: 0.5 };
  const photoZoom = block.zoom ?? 1;
  const showChrome = Boolean(interactive && selected);

  const snapTargets = useCallback((): number[] => {
    const frame = frameRef.current;
    const grid = frame?.closest<HTMLElement>('[data-journal-grid]');
    if (!frame || !grid) return [];
    const gridRect = grid.getBoundingClientRect();
    const targets: number[] = [0, gridRect.height / scale];
    grid.querySelectorAll<HTMLElement>('[data-block-id]').forEach((node) => {
      if (node.dataset.blockId === block.id) return;
      const rect = node.getBoundingClientRect();
      targets.push((rect.top - gridRect.top) / scale, (rect.bottom - gridRect.top) / scale);
    });
    return targets;
  }, [block.id, scale]);

  const startResize = (handle: HandleId) => (event: React.PointerEvent) => {
    if (!interactive || !frameRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = frameRef.current.getBoundingClientRect();
    const startW = rect.width / scale;
    const startH = rect.height / scale;
    const startX = event.clientX;
    const startY = event.clientY;
    const ratio = startW / startH;
    const lock = block.lockRatio !== false && CORNERS.includes(handle);
    const gridTop = (() => {
      const grid = frameRef.current.closest<HTMLElement>('[data-journal-grid]');
      return grid ? (rect.top - grid.getBoundingClientRect().top) / scale : 0;
    })();
    const targets = snapTargets();

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      let width = startW;
      let height = startH;

      if (handle.includes('e')) width = startW + dx;
      if (handle.includes('w')) width = startW - dx;
      if (handle.includes('s')) height = startH + dy;
      if (handle.includes('n')) height = startH - dy;
      if (lock) height = width / ratio;

      height = Math.min(IMAGE_MAX_HEIGHT, Math.max(IMAGE_MIN_HEIGHT, height));
      width = Math.max(40, width);

      let snapped: 'top' | 'bottom' | null = null;
      if (!moveEvent.altKey) {
        for (const target of targets) {
          if (Math.abs(gridTop + height - target) <= SNAP_THRESHOLD) {
            height = target - gridTop;
            snapped = 'bottom';
            break;
          }
        }
      }
      setGuide(snapped);
      setOverflow(gridTop + height > (targets[1] ?? Infinity));
      setLive({ width, height });
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setGuide(null);
      setOverflow(false);
      setLive((current) => {
        if (current) {
          const parent = frameRef.current?.parentElement?.parentElement;
          const available = parent ? parent.getBoundingClientRect().width / scale : current.width;
          onChange?.({
            height: Math.round(current.height),
            widthPct: Math.min(100, Math.max(30, Math.round((current.width / available) * 100))),
          });
        }
        return null;
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Arraste da fotografia dentro do quadro (modo enquadramento).
  const startPan = (event: React.PointerEvent) => {
    if (!frameMode || !frameRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = frameRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const base = { ...focal };

    const move = (moveEvent: PointerEvent) => {
      const nx = base.x - (moveEvent.clientX - startX) / rect.width;
      const ny = base.y - (moveEvent.clientY - startY) / rect.height;
      onChange?.({ focal: { x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) } });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  useEffect(() => {
    if (!frameMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleFrameMode?.(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [frameMode, onToggleFrameMode]);

  const frameStyle: CSSProperties = {
    height: live?.height ?? block.height,
    width: live ? `${live.width}px` : block.widthPct ? `${block.widthPct}%` : undefined,
    marginLeft: block.justify === 'end' || block.justify === 'center' ? 'auto' : undefined,
    marginRight: block.justify === 'start' || block.justify === 'center' ? 'auto' : undefined,
  };

  const imgStyle: CSSProperties = {
    objectPosition: `${focal.x * 100}% ${focal.y * 100}%`,
    transform: photoZoom === 1 ? undefined : `scale(${photoZoom})`,
    transformOrigin: `${focal.x * 100}% ${focal.y * 100}%`,
  };

  const measured = live ?? {
    width: frameRef.current?.getBoundingClientRect().width ?? 0,
    height: block.height ?? frameRef.current?.getBoundingClientRect().height ?? 0,
  };

  return (
    <figure
      className={wrapperClass}
      data-block-id={block.id}
      style={{ alignSelf: block.alignSelf }}
      onClick={interactive ? () => onSelect?.(block.id) : undefined}
      onDoubleClick={interactive ? () => onToggleFrameMode?.(frameMode ? null : block.id) : undefined}
    >
      <div
        ref={frameRef}
        className={cn(
          'relative w-full overflow-hidden bg-[#E4E0D2]',
          !block.height && !live && RATIO_CLASS[block.ratio],
          frameMode && 'outline-2 outline-dashed outline-[#00A6FF]',
        )}
        style={frameStyle}
        onPointerDown={startPan}
      >
        {block.url ? (
          <img
            src={block.url}
            alt={block.caption || 'Imagem do jornal'}
            className={cn('h-full w-full select-none', block.fit === 'contain' ? 'object-contain' : 'object-cover')}
            style={imgStyle}
            crossOrigin="anonymous"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-[#8B8778]">
            Imagem
          </div>
        )}

        {frameMode && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[#1F211F]/25" />
            <div className="pointer-events-none absolute inset-3 border border-white/90" />
            <span className="pointer-events-none absolute left-1 top-1 rounded bg-[#00A6FF] px-1.5 py-0.5 text-[8px] font-bold text-white">
              Arraste a foto · ESC para sair
            </span>
          </>
        )}

        {showChrome && !frameMode && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0',
              overflow ? 'shadow-[inset_0_0_0_2px_#F5705B]' : 'shadow-[inset_0_0_0_2px_#00A6FF]',
            )}
          />
        )}

        {guide && (
          <div
            className="pointer-events-none absolute -left-[400px] -right-[400px] h-[1.5px] bg-[#F5705B]"
            style={{ [guide === 'top' ? 'top' : 'bottom']: 0 } as CSSProperties}
          />
        )}
      </div>

      {showChrome && !frameMode && (
        <div className="pointer-events-none relative">
          <div className="pointer-events-none absolute inset-x-0" style={{ bottom: 0 }}>
            {[...CORNERS, ...SIDES].map((handle) => (
              <span
                key={handle}
                onPointerDown={startResize(handle)}
                className={cn(
                  'pointer-events-auto absolute z-10 h-[9px] w-[9px] border-2 border-[#00A6FF] bg-white',
                  SIDES.includes(handle) && 'rounded-full',
                  HANDLE_POS[handle],
                )}
                style={{
                  bottom: handle.startsWith('s') ? -4 : undefined,
                  top: handle.startsWith('n')
                    ? -(measured.height || 0) - 4
                    : SIDES.includes(handle) && (handle === 'w' || handle === 'e')
                      ? -(measured.height || 0) / 2 - 4
                      : undefined,
                }}
              />
            ))}
          </div>
          <span
            className={cn(
              'absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-bold text-white',
              overflow ? 'bg-[#F5705B]' : 'bg-[#00A6FF]',
            )}
            style={{ top: 6 }}
          >
            {pxToMm(measured.width)} × {pxToMm(measured.height)} mm ·{' '}
            {block.lockRatio === false ? 'proporção livre' : 'proporção travada'}
            {overflow ? ' · fora da área segura' : ''}
          </span>
        </div>
      )}

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
}

export default JournalImageBlockView;
