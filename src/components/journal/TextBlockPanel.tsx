import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorSwatchPicker } from '@/components/journal/ColorSwatchPicker';
import { cn } from '@/lib/utils';
import { TEXT_STYLE_LABELS } from '@/lib/journal/types';
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

const SPANS: BlockSpan[] = [1, 2, 3, 4, 5, 6];

const PLACEHOLDERS: Record<TextStyleKey, string> = {
  titulo_capa: 'Escreva o título principal da capa…',
  titulo_materia: 'Escreva o título da matéria…',
  subtitulo: 'Escreva o subtítulo…',
  corpo: 'Escreva o texto da matéria…',
  destaque: 'Escreva a frase de destaque…',
  chamada: 'Escreva a chamada curta…',
  legenda: 'Escreva a legenda…',
};

/** Painel contextual de um bloco de texto: conteúdo primeiro, avançado recolhido. */
export function TextBlockPanel({ block, onChange }: TextBlockPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

      <section className="space-y-2 border-t border-border pt-3">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Alinhamento
        </Label>
        <div className="flex gap-1.5">
          {ALIGNMENTS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={block.align === value}
              onClick={() => onChange({ align: value } as Partial<JournalBlock>)}
              className={cn(
                'grid h-9 flex-1 place-items-center rounded-md border border-border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                block.align === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <Label className="block pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Formatação
        </Label>
        <div className="flex gap-1.5">
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
                'grid h-9 flex-1 place-items-center rounded-md border border-border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                block[key] ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
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
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Espaçamento entre linhas
        </Label>
        <div className="flex items-center gap-3">
          <Slider
            value={[lineHeight]}
            min={1}
            max={2}
            step={0.1}
            onValueChange={([value]) => onChange({ lineHeight: value } as Partial<JournalBlock>)}
            className="flex-1"
          />
          <span className="w-10 rounded-md border border-border px-2 py-1 text-center text-xs">
            {lineHeight.toFixed(1).replace('.', ',')}
          </span>
        </div>
      </section>
    </div>
  );
}

export default TextBlockPanel;
