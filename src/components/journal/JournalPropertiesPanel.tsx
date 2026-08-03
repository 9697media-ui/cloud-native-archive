import {
  Trash2,
  Plus,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  MoveVertical,
  MoveHorizontal,
  RotateCcw,
  Lock,
  Unlock,
  Crop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ImageBlockField } from '@/components/news/ImageBlockField';
import { ColorSwatchPicker } from '@/components/journal/ColorSwatchPicker';
import { TEMPLATE_LABELS, TEXT_STYLE_LABELS, pxToMm } from '@/lib/journal/types';
import type {
  BlockSpan,
  JournalColorKey,
  JournalBlock,
  JournalPage,
  TextStyleKey,
} from '@/lib/journal/types';
import { uid } from '@/lib/journal/templates';

interface Props {
  page: JournalPage | undefined;
  block: JournalBlock | undefined;
  onChangeBlock: (patch: Partial<JournalBlock>) => void;
  onRemoveBlock: () => void;
  /** Iguala altura/largura ao bloco vizinho na mesma linha da grade. */
  onMatchSibling?: (dimension: 'height' | 'width') => void;
  frameMode?: boolean;
  onToggleFrameMode?: (id: string | null) => void;
}

const ALIGN_V = [
  { value: 'start' as const, label: 'Topo', Icon: AlignStartHorizontal },
  { value: 'center' as const, label: 'Centro', Icon: AlignCenterHorizontal },
  { value: 'end' as const, label: 'Base', Icon: AlignEndHorizontal },
];

const ALIGN_H = [
  { value: 'start' as const, label: 'Esq.', Icon: AlignStartVertical },
  { value: 'center' as const, label: 'Centro', Icon: AlignCenterVertical },
  { value: 'end' as const, label: 'Dir.', Icon: AlignEndVertical },
];


const SPANS: BlockSpan[] = [1, 2, 3, 4, 5, 6];

export function JournalPropertiesPanel({
  page,
  block,
  onChangeBlock,
  onRemoveBlock,
  onMatchSibling,
  frameMode,
  onToggleFrameMode,
}: Props) {
  if (!block) {
    return (
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-foreground">Conteúdo da página</p>
        <p className="text-muted-foreground">
          Modelo: <strong>{page ? TEMPLATE_LABELS[page.template] : '—'}</strong>
        </p>
        <p className="text-muted-foreground">Blocos nesta página: {page?.blocks.length ?? 0}</p>
        <p className="text-xs text-muted-foreground">
          Clique em um bloco no canvas para editar seu conteúdo. Cabeçalho, rodapé e margens são
          fixos pela identidade institucional.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">
          {block.kind === 'text'
            ? 'Texto'
            : block.kind === 'image'
              ? 'Imagem'
              : block.kind === 'agenda'
                ? 'Agenda'
                : 'Indicador'}
        </p>
        <Button variant="ghost" size="sm" onClick={onRemoveBlock} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Largura (colunas)</Label>
        <Select
          value={String(block.span)}
          onValueChange={(value) => onChangeBlock({ span: Number(value) as BlockSpan })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPANS.map((span) => (
              <SelectItem key={span} value={String(span)}>
                {span} de 6
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {block.kind === 'text' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Função do texto</Label>
            <Select
              value={block.style}
              onValueChange={(value) => onChangeBlock({ style: value as TextStyleKey } as Partial<JournalBlock>)}
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alinhamento</Label>
            <Select
              value={block.align}
              onValueChange={(value) => onChangeBlock({ align: value } as Partial<JournalBlock>)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
                <SelectItem value="justify">Justificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ColorSwatchPicker
            value={block.color}
            onChange={(color) => onChangeBlock({ color } as Partial<JournalBlock>)}
          />

          <div className="space-y-1.5">
            <Label className="text-xs">Conteúdo</Label>
            <Textarea
              value={block.content}
              rows={8}
              onChange={(event) => onChangeBlock({ content: event.target.value } as Partial<JournalBlock>)}
            />
          </div>
        </>
      )}

      {block.kind === 'image' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Imagem</Label>
            <ImageBlockField
              value={block.url}
              onChange={(url) => onChangeBlock({ url } as Partial<JournalBlock>)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alinhamento</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {ALIGN_V.map(({ value, label, Icon }) => (
                <Button
                  key={value}
                  variant={block.alignSelf === value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => onChangeBlock({ alignSelf: value } as Partial<JournalBlock>)}
                >
                  <Icon className="mr-1 h-3.5 w-3.5" /> {label}
                </Button>
              ))}
              {ALIGN_H.map(({ value, label, Icon }) => (
                <Button
                  key={value}
                  variant={block.justify === value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => onChangeBlock({ justify: value } as Partial<JournalBlock>)}
                >
                  <Icon className="mr-1 h-3.5 w-3.5" /> {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Dimensões</Label>
            <Button
              size="sm"
              className="w-full bg-[#FACC00] text-[#1F211F] hover:bg-[#e5bb00]"
              onClick={() => onMatchSibling?.('height')}
            >
              <MoveVertical className="mr-1.5 h-3.5 w-3.5" /> Igualar altura ao bloco de texto
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => onMatchSibling?.('width')}>
              <MoveHorizontal className="mr-1.5 h-3.5 w-3.5" /> Mesma largura do bloco ao lado
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                onChangeBlock({
                  height: undefined,
                  widthPct: undefined,
                  focal: undefined,
                  zoom: undefined,
                  justify: undefined,
                  alignSelf: undefined,
                } as Partial<JournalBlock>)
              }
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar tamanho original
            </Button>
            <Button
              variant={block.lockRatio === false ? 'outline' : 'secondary'}
              size="sm"
              className="w-full"
              onClick={() => onChangeBlock({ lockRatio: block.lockRatio === false } as Partial<JournalBlock>)}
            >
              {block.lockRatio === false ? (
                <>
                  <Unlock className="mr-1.5 h-3.5 w-3.5" /> Proporção livre
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Proporção bloqueada
                </>
              )}
            </Button>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">Largura (%)</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={block.widthPct ?? 100}
                  onChange={(event) =>
                    onChangeBlock({
                      widthPct: Math.min(100, Math.max(30, Number(event.target.value) || 100)),
                    } as Partial<JournalBlock>)
                  }
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Altura (mm)</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={block.height ? pxToMm(block.height) : ''}
                  placeholder="auto"
                  onChange={(event) => {
                    const mm = Number(event.target.value);
                    onChangeBlock({
                      height: mm ? Math.round((mm * 794) / 210) : undefined,
                    } as Partial<JournalBlock>);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Enquadramento</Label>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onToggleFrameMode?.(frameMode ? null : block.id)}
            >
              <Crop className="mr-1.5 h-3.5 w-3.5" /> {frameMode ? 'Concluir enquadramento' : 'Ajustar enquadramento'}
            </Button>
            <Select
              value={block.fit}
              onValueChange={(value) => onChangeBlock({ fit: value } as Partial<JournalBlock>)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Preencher espaço</SelectItem>
                <SelectItem value="contain">Imagem completa</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Label className="text-[10px] text-muted-foreground">Zoom da foto</Label>
              <Slider
                value={[block.zoom ?? 1]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([zoom]) => onChangeBlock({ zoom } as Partial<JournalBlock>)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() =>
                onChangeBlock({ focal: { x: 0.5, y: 0.5 }, zoom: 1 } as Partial<JournalBlock>)
              }
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar enquadramento original
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Proporção base</Label>
            <Select
              value={block.ratio}
              onValueChange={(value) =>
                onChangeBlock({ ratio: value, height: undefined } as Partial<JournalBlock>)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16/9">Horizontal (16:9)</SelectItem>
                <SelectItem value="4/3">Paisagem (4:3)</SelectItem>
                <SelectItem value="1/1">Quadrada</SelectItem>
                <SelectItem value="3/4">Vertical (3:4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Legenda (opcional)</Label>
            <Input
              value={block.caption}
              onChange={(event) => onChangeBlock({ caption: event.target.value } as Partial<JournalBlock>)}
            />
          </div>
          <ColorSwatchPicker
            label="Cor da legenda"
            value={block.color}
            onChange={(color: JournalColorKey) => onChangeBlock({ color } as Partial<JournalBlock>)}
          />
        </>
      )}


      {block.kind === 'stat' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Número</Label>
            <Input
              value={block.value}
              onChange={(event) => onChangeBlock({ value: event.target.value } as Partial<JournalBlock>)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={block.label}
              onChange={(event) => onChangeBlock({ label: event.target.value } as Partial<JournalBlock>)}
            />
          </div>
          <div className="space-y-1.5">
            <ColorSwatchPicker
              label="Cor do número"
              value={block.color}
              onChange={(color: JournalColorKey) => onChangeBlock({ color } as Partial<JournalBlock>)}
            />
          </div>
        </>
      )}

      {block.kind === 'agenda' && (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={item.id} className="space-y-1.5 rounded-md border border-border p-2">
              <div className="flex gap-1.5">
                <Input
                  className="h-8"
                  placeholder="Data"
                  value={item.date}
                  onChange={(event) => {
                    const items = [...block.items];
                    items[index] = { ...item, date: event.target.value };
                    onChangeBlock({ items } as Partial<JournalBlock>);
                  }}
                />
                <Input
                  className="h-8"
                  placeholder="Hora"
                  value={item.time}
                  onChange={(event) => {
                    const items = [...block.items];
                    items[index] = { ...item, time: event.target.value };
                    onChangeBlock({ items } as Partial<JournalBlock>);
                  }}
                />
              </div>
              <Input
                className="h-8"
                placeholder="Evento"
                value={item.title}
                onChange={(event) => {
                  const items = [...block.items];
                  items[index] = { ...item, title: event.target.value };
                  onChangeBlock({ items } as Partial<JournalBlock>);
                }}
              />
              <div className="flex gap-1.5">
                <Input
                  className="h-8"
                  placeholder="Local"
                  value={item.place}
                  onChange={(event) => {
                    const items = [...block.items];
                    items[index] = { ...item, place: event.target.value };
                    onChangeBlock({ items } as Partial<JournalBlock>);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    onChangeBlock({
                      items: block.items.filter((entry) => entry.id !== item.id),
                    } as Partial<JournalBlock>)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              onChangeBlock({
                items: [...block.items, { id: uid(), date: '', title: '', time: '', place: '' }],
              } as Partial<JournalBlock>)
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar linha
          </Button>
        </div>
      )}
    </div>
  );
}

export default JournalPropertiesPanel;
