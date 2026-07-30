import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageBlockField } from '@/components/news/ImageBlockField';
import { TEMPLATE_LABELS, TEXT_STYLE_LABELS } from '@/lib/journal/types';
import type {
  BlockSpan,
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
}

const SPANS: BlockSpan[] = [1, 2, 3, 4, 5, 6];

export function JournalPropertiesPanel({ page, block, onChangeBlock, onRemoveBlock }: Props) {
  if (!block) {
    return (
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-foreground">Propriedades da página</p>
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
              </SelectContent>
            </Select>
          </div>

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
            <Label className="text-xs">Proporção</Label>
            <Select
              value={block.ratio}
              onValueChange={(value) => onChangeBlock({ ratio: value } as Partial<JournalBlock>)}
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
            <Label className="text-xs">Enquadramento</Label>
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Legenda (opcional)</Label>
            <Input
              value={block.caption}
              onChange={(event) => onChangeBlock({ caption: event.target.value } as Partial<JournalBlock>)}
            />
          </div>
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
