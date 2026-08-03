import { ChevronDown, ChevronUp, CalendarDays, Hash, Image as ImageIcon, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TEXT_STYLE_LABELS, type JournalBlock } from '@/lib/journal/types';

interface Props {
  blocks: JournalBlock[];
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

/** Rótulo curto e legível de cada bloco para a lista de ordenação. */
function blockLabel(block: JournalBlock): string {
  switch (block.kind) {
    case 'text':
      return `${TEXT_STYLE_LABELS[block.style]} · ${block.content.slice(0, 24) || 'vazio'}`;
    case 'image':
      return block.caption ? `Imagem · ${block.caption.slice(0, 22)}` : 'Imagem';
    case 'stat':
      return `Número · ${block.value || '—'}`;
    case 'agenda':
      return `Agenda · ${block.items.length} item(ns)`;
    default:
      return 'Bloco';
  }
}

function BlockIcon({ block }: { block: JournalBlock }) {
  const className = 'h-3.5 w-3.5 shrink-0 text-muted-foreground';
  if (block.kind === 'image') return <ImageIcon className={className} />;
  if (block.kind === 'stat') return <Hash className={className} />;
  if (block.kind === 'agenda') return <CalendarDays className={className} />;
  return <Type className={className} />;
}

export function JournalBlockList({ blocks, selectedBlockId, onSelect, onMove }: Props) {
  if (!blocks.length) {
    return <p className="text-xs text-muted-foreground">Nenhum bloco nesta página ainda.</p>;
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Blocos da página (ordem)</Label>
      <ul className="space-y-1">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            className={cn(
              'flex items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors',
              block.id === selectedBlockId ? 'border-primary bg-accent' : 'border-border bg-background',
            )}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              onClick={() => onSelect(block.id)}
            >
              <span className="w-4 shrink-0 text-muted-foreground">{index + 1}</span>
              <BlockIcon block={block} />
              <span className="truncate text-foreground">{blockLabel(block)}</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Mover para cima"
              disabled={index === 0}
              onClick={() => onMove(block.id, -1)}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Mover para baixo"
              disabled={index === blocks.length - 1}
              onClick={() => onMove(block.id, 1)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JournalBlockList;
