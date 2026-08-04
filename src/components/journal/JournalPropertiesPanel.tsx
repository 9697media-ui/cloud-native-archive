import { useState } from 'react';
import { Trash2, Plus, X, ChevronDown, Settings2 } from 'lucide-react';
import { TextBlockPanel } from '@/components/journal/TextBlockPanel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ImageBlockField } from '@/components/news/ImageBlockField';
import { ColorSwatchPicker } from '@/components/journal/ColorSwatchPicker';
import { TEMPLATE_LABELS } from '@/lib/journal/types';
import type {
  BlockSpan,
  JournalColorKey,
  JournalBlock,
  JournalPage,
} from '@/lib/journal/types';
import { uid } from '@/lib/journal/templates';
import { cn } from '@/lib/utils';


interface Props {
  page: JournalPage | undefined;
  block: JournalBlock | undefined;
  onChangeBlock: (patch: Partial<JournalBlock>) => void;
  onRemoveBlock: () => void;
  onClose?: () => void;
}

export function JournalPropertiesPanel({ page, block, onChangeBlock, onRemoveBlock, onClose }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const title =
    block.kind === 'text'
      ? 'Texto'
      : block.kind === 'image'
        ? 'Imagem'
        : block.kind === 'agenda'
          ? 'Agenda'
          : 'Indicador';

  const setSpan = (value: string) => {
    const span = Math.max(1, Math.min(6, Number(value))) as BlockSpan;
    onChangeBlock({ span });
  };

  const setHeight = (value: string) => {
    const height = value === '' ? undefined : Math.max(24, Number(value));
    onChangeBlock({ height });
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="-mx-3 -mt-3 flex items-center justify-between rounded-t-lg bg-accent px-3 py-2.5">
        <p className="font-semibold text-accent-foreground">{title}</p>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Fechar painel">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="rounded-md bg-muted/60 px-2.5 py-2 text-[11px] text-muted-foreground">
        Largura: <strong className="text-foreground">{block.span} de 6 colunas</strong> · Altura:{' '}
        <strong className="text-foreground">
          {block.height ? `${block.height}px` : 'automática'}
        </strong>
        . No canvas: arraste a alça direita para largura, a alça inferior para altura (clique duplo
        volta ao automático) e a alça esquerda para reordenar os blocos.
      </p>

      {block.kind === 'text' && <TextBlockPanel block={block} onChange={onChangeBlock} />}

      {block.kind === 'image' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Imagem</Label>
            <ImageBlockField
              value={block.url}
              onChange={(url) => onChangeBlock({ url } as Partial<JournalBlock>)}
            />
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
        </div>
      )}

      {block.kind === 'stat' && (
        <div className="space-y-3">
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
          <ColorSwatchPicker
            label="Cor do número"
            value={block.color}
            onChange={(color: JournalColorKey) => onChangeBlock({ color } as Partial<JournalBlock>)}
          />
        </div>
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

      {/* Ajustes avançados */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between px-1 text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> Ajustes avançados
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Largura (colunas)</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={block.span}
                onChange={(event) => setSpan(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Altura (px)</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  min={24}
                  value={block.height ?? ''}
                  placeholder="Auto"
                  onChange={(event) => setHeight(event.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Voltar à altura automática"
                  onClick={() => onChangeBlock({ height: undefined })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {block.kind === 'image' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Ajuste da imagem</Label>
              <Select
                value={block.fit}
                onValueChange={(value) => onChangeBlock({ fit: value as 'cover' | 'contain' } as Partial<JournalBlock>)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cobrir (crop)</SelectItem>
                  <SelectItem value="contain">Conter (sem crop)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-border pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveBlock}
          className="w-full justify-start px-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Remover bloco
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from '@/lib/utils';

export default JournalPropertiesPanel;
