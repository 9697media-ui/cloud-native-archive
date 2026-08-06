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
  const defaultSize = TEXT_STYLE_DEFAULT_SIZES[block.style];
  const currentSize = block.fontSize ?? defaultSize;

  const setFontSize = (next: number | undefined) => {
    if (next === undefined || next === defaultSize) {
      onChange({ fontSize: undefined } as Partial<JournalBlock>);
      return;
    }
    const clamped = Math.max(8, Math.min(72, Math.round(next)));
    onChange({ fontSize: clamped } as Partial<JournalBlock>);
  };

  return (
    <div className="space-y-3">
      {/* Conteúdo */}
      <section className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conteúdo
          </Label>
          <span className="text-[10px] text-muted-foreground">{block.content.length} caracteres</span>
        </div>
        <Textarea
          value={block.content}
          rows={6}
          placeholder={PLACEHOLDERS[block.style]}
          className="resize-y text-sm"
          onChange={(event) => onChange({ content: event.target.value } as Partial<JournalBlock>)}
        />
      </section>

      {/* Estilo: função + tamanho */}
      <section className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Estilo
        </Label>
        <Select
          value={block.style}
          onValueChange={(value) => {
            const nextStyle = value as TextStyleKey;
            // Ao trocar de função, descarta o tamanho personalizado para adotar o padrão da nova função.
            onChange({ style: nextStyle, fontSize: undefined } as Partial<JournalBlock>);
          }}
        >
          <SelectTrigger className="h-9 bg-background">
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

        <div className="flex items-center gap-1.5">
          <span className="w-14 shrink-0 text-[11px] text-muted-foreground">Tamanho</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 bg-background"
            onClick={() => setFontSize(currentSize - 1)}
            aria-label="Diminuir tamanho da fonte"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Input
            type="number"
            min={8}
            max={72}
            value={currentSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="h-8 bg-background text-center tabular-nums"
            aria-label="Tamanho da fonte em pixels"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 bg-background"
            onClick={() => setFontSize(currentSize + 1)}
            aria-label="Aumentar tamanho da fonte"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            title={`Voltar ao padrão da função (${defaultSize}px)`}
            onClick={() => setFontSize(undefined)}
            aria-label="Voltar ao tamanho padrão"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* Alinhamento e formatação, em uma única barra visual */}
      <section className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Alinhamento e formatação
        </Label>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
            {ALIGNMENTS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={block.align === value}
                onClick={() => onChange({ align: value } as Partial<JournalBlock>)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  block.align === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
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
                  'grid h-8 w-8 place-items-center rounded transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  block[key]
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cor e espaçamento */}
      <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-2.5">
        <ColorSwatchPicker
          label="Cor do texto"
          value={block.color}
          onChange={(color) => onChange({ color } as Partial<JournalBlock>)}
        />
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label className="text-[11px] text-muted-foreground">Espaçamento entre linhas</Label>
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
        </div>
      </section>
    </div>
  );
}

export default TextBlockPanel;
