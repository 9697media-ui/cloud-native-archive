import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorSwatchPicker } from '@/components/journal/ColorSwatchPicker';
import { cn } from '@/lib/utils';
import { TEXT_STYLE_LABELS, TEXT_STYLE_DEFAULT_SIZES } from '@/lib/journal/types';
import type {
  JournalBlock,
  JournalTextBlock,
  TextStyleKey,
} from '@/lib/journal/types';


export interface TextBlockPanelProps {
  block: JournalTextBlock;
  onChange: (patch: Partial<JournalBlock>) => void;
}

const ALIGNMENTS = [
  { value: 'left', label: 'Esquerda', Icon: AlignLeft },
  { value: 'center', label: 'Centralizado', Icon: AlignCenter },
  { value: 'right', label: 'Direita', Icon: AlignRight },
  { value: 'justify', label: 'Justificado', Icon: AlignJustify },
] as const;



const PLACEHOLDERS: Record<TextStyleKey, string> = {
  titulo_capa: 'Escreva o título principal da capa…',
  titulo_materia: 'Escreva o título da matéria…',
  subtitulo: 'Escreva o subtítulo…',
  corpo: 'Escreva o texto da matéria…',
  destaque: 'Escreva a frase de destaque…',
  chamada: 'Escreva a chamada curta…',
  legenda: 'Escreva a legenda…',
};

/** Painel contextual de um bloco de texto: todos os controles visíveis. */
export function TextBlockPanel({ block, onChange }: TextBlockPanelProps) {
  const lineHeight = block.lineHeight ?? 1.5;

  return (
    <div className="space-y-4">
      <section className="space-y-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conteúdo
        </Label>
        <Textarea
          value={block.content}
          rows={7}
          placeholder={PLACEHOLDERS[block.style]}
          onChange={(event) => onChange({ content: event.target.value } as Partial<JournalBlock>)}
        />
        <p className="text-right text-[10px] text-muted-foreground">
          {block.content.length} caracteres
        </p>
      </section>

      <section className="space-y-1.5 border-t border-border pt-3">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Função do texto
        </Label>
        <Select
          value={block.style}
          onValueChange={(value) => onChange({ style: value as TextStyleKey } as Partial<JournalBlock>)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEXT_STYLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Fonte, tamanho e cor são aplicados automaticamente.
        </p>
      </section>

      <section className="space-y-3 border-t border-border pt-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Alinhamento
          </Label>
          <div className="grid grid-cols-4 gap-1.5">
            {ALIGNMENTS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={block.align === value}
                onClick={() => onChange({ align: value } as Partial<JournalBlock>)}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-md border border-border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  block.align === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] leading-none">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Formatação
          </Label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: 'bold', label: 'Negrito', Icon: Bold },
              { key: 'italic', label: 'Itálico', Icon: Italic },
              { key: 'list', label: 'Lista', Icon: List },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={Boolean(block[key])}
                onClick={() => onChange({ [key]: !block[key] } as Partial<JournalBlock>)}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-md border border-border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  block[key]
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] leading-none">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2 border-t border-border pt-3">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cor do texto
        </Label>
        <ColorSwatchPicker
          label="Escolha a cor"
          value={block.color}
          onChange={(color) => onChange({ color } as Partial<JournalBlock>)}
        />
      </section>

      <section className="space-y-2 border-t border-border pt-3">
        <div className="flex items-baseline justify-between">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Espaçamento entre linhas
          </Label>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {lineHeight.toFixed(1).replace('.', ',')}
          </span>
        </div>
        <Slider
          value={[lineHeight]}
          min={1}
          max={2}
          step={0.1}
          onValueChange={([value]) => onChange({ lineHeight: value } as Partial<JournalBlock>)}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Compacto</span>
          <span>Espaçado</span>
        </div>
      </section>

    </div>
  );
}

export default TextBlockPanel;
