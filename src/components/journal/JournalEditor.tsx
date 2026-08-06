import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Type,
  Hash,
  CalendarDays,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
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
import { cn } from '@/lib/utils';
import { A4_H, A4_W, JournalPageView } from './JournalPageView';
import { JournalPropertiesPanel } from './JournalPropertiesPanel';
import { JournalBlockList } from './JournalBlockList';

import {
  TEMPLATE_LABELS,
  type BlockSpan,
  type JournalBlock,
  type JournalPage,
  type JournalRecord,
  type JournalTemplate,
} from '@/lib/journal/types';
import {
  TEMPLATE_OPTIONS,
  agendaBlock,
  createPage,
  imageBlock,
  statBlock,
  textBlock,
  uid,
} from '@/lib/journal/templates';
import { newsUnitName, profileUnitForNewsUnit } from '@/lib/news/units';
import { UnitBadge } from './UnitBadge';

interface Props {
  journal: JournalRecord;
  saving: boolean;
  savedAt: string | null;
  onBack: () => void;
  onSave: (
    id: string,
    draft: {
      name?: string;
      pages?: JournalPage[];
      status?: JournalRecord['status'];
      unitId?: string | null;
      profileUnit?: string | null;
    },
  ) => Promise<boolean>;
}

/** Estado de preenchimento da página — usado nos selos das miniaturas. */
function pageStatus(page: JournalPage): 'completa' | 'pendente' {
  const pending = page.blocks.some((block) => {
    if (block.kind === 'text') return block.content.trim().length === 0;
    if (block.kind === 'image') return !block.url;
    return false;
  });
  return pending ? 'pendente' : 'completa';
}

export function JournalEditor({ journal, saving, savedAt, onBack, onSave }: Props) {
  const [name, setName] = useState(journal.name);
  const [pages, setPages] = useState<JournalPage[]>(journal.pages?.length ? journal.pages : [createPage('capa')]);
  const [activePageId, setActivePageId] = useState<string>(pages[0].id);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.7);
  /** Layout do modelo travado: só o conteúdo é editável (padrão). */
  const [layoutLocked, setLayoutLocked] = useState(true);
  const [autoFit, setAutoFit] = useState(true);
  /** Fundo da folha: cinza institucional (#EEEEEE) ou branco. */
  const [paperColor, setPaperColor] = useState<'#EEEEEE' | '#FFFFFF'>('#EEEEEE');
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const selectedBlock = activePage?.blocks.find((block) => block.id === selectedBlockId);
  const unitName = useMemo(() => newsUnitName(journal.unit_id), [journal.unit_id]);

  /** Ajuste automático da folha à área central (recalcula ao redimensionar). */
  useEffect(() => {
    if (!autoFit) return;
    const element = canvasRef.current;
    if (!element) return;
    const recompute = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const next = Math.min((width - 48) / A4_W, (height - 48) / A4_H);
      setZoom(Math.max(0.3, Math.min(1.5, Number(next.toFixed(3)))));
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(element);
    return () => observer.disconnect();
  }, [autoFit]);

  // Autosave com 2s de inatividade.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      onSave(journal.id, { name, pages });
      dirtyRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, [name, pages, journal.id, onSave]);

  const setManualZoom = useCallback((updater: (current: number) => number) => {
    setAutoFit(false);
    setZoom((current) => Math.max(0.3, Math.min(1.5, updater(current))));
  }, []);

  const mutatePages = useCallback((updater: (prev: JournalPage[]) => JournalPage[]) => {
    dirtyRef.current = true;
    setPages(updater);
  }, []);


  const updateBlock = (patch: Partial<JournalBlock>) => {
    if (!selectedBlockId) return;
    mutatePages((prev) =>
      prev.map((page) =>
        page.id !== activePage.id
          ? page
          : {
              ...page,
              blocks: page.blocks.map((block) =>
                block.id === selectedBlockId ? ({ ...block, ...patch } as JournalBlock) : block,
              ),
            },
      ),
    );
  };

  /** Redimensionamento por arraste no canvas — altera apenas a largura em colunas. */
  const resizeBlockSpan = useCallback(
    (blockId: string, span: number) => {
      const clamped = Math.max(1, Math.min(6, Math.round(span))) as BlockSpan;
      mutatePages((prev) =>
        prev.map((page) =>
          page.id !== activePage.id
            ? page
            : {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === blockId ? ({ ...block, span: clamped } as JournalBlock) : block,
                ),
              },
        ),
      );
    },
    [activePage.id, mutatePages],
  );

  /** Alça inferior — altura fixa em px (undefined volta para automática). */
  const resizeBlockHeight = useCallback(
    (blockId: string, height: number | undefined) => {
      mutatePages((prev) =>
        prev.map((page) =>
          page.id !== activePage.id
            ? page
            : {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === blockId ? ({ ...block, height } as JournalBlock) : block,
                ),
              },
        ),
      );
    },
    [activePage.id, mutatePages],
  );

  /** Reordenação por arraste — move o bloco arrastado para a posição do alvo. */
  const reorderBlocks = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      mutatePages((prev) =>
        prev.map((page) => {
          if (page.id !== activePage.id) return page;
          const from = page.blocks.findIndex((block) => block.id === draggedId);
          const to = page.blocks.findIndex((block) => block.id === targetId);
          if (from < 0 || to < 0) return page;
          const blocks = [...page.blocks];
          const [moved] = blocks.splice(from, 1);
          blocks.splice(to, 0, moved);
          return { ...page, blocks };
        }),
      );
    },
    [activePage.id, mutatePages],
  );

  const removeBlock = () => {
    if (!selectedBlockId) return;
    mutatePages((prev) =>
      prev.map((page) =>
        page.id !== activePage.id
          ? page
          : { ...page, blocks: page.blocks.filter((block) => block.id !== selectedBlockId) },
      ),
    );
    setSelectedBlockId(null);
  };

  /** Move um bloco uma posição para cima/baixo na ordem da página. */
  const moveBlock = (blockId: string, direction: -1 | 1) => {
    mutatePages((prev) =>
      prev.map((page) => {
        if (page.id !== activePage.id) return page;
        const index = page.blocks.findIndex((block) => block.id === blockId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= page.blocks.length) return page;
        const blocks = [...page.blocks];
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        return { ...page, blocks };
      }),
    );
  };

  /** Insere logo após o bloco selecionado (ou no fim, se nada estiver selecionado). */
  const addBlock = (block: JournalBlock) => {
    mutatePages((prev) =>
      prev.map((page) => {
        if (page.id !== activePage.id) return page;
        const at = page.blocks.findIndex((entry) => entry.id === selectedBlockId);
        const blocks = [...page.blocks];
        blocks.splice(at < 0 ? blocks.length : at + 1, 0, block);
        return { ...page, blocks };
      }),
    );
    setSelectedBlockId(block.id);
  };


  const addPage = (template: JournalTemplate) => {
    const page = createPage(template);
    mutatePages((prev) => [...prev, page]);
    setActivePageId(page.id);
    setSelectedBlockId(null);
  };

  const duplicatePage = (page: JournalPage) => {
    const copy: JournalPage = {
      ...page,
      id: uid(),
      blocks: page.blocks.map((block) => ({ ...block, id: uid() })),
    };
    mutatePages((prev) => {
      const index = prev.findIndex((entry) => entry.id === page.id);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const removePage = (pageId: string) => {
    if (pages.length === 1) {
      toast.error('O jornal precisa de ao menos uma página.');
      return;
    }
    mutatePages((prev) => prev.filter((page) => page.id !== pageId));
    if (activePageId === pageId) setActivePageId(pages.find((page) => page.id !== pageId)!.id);
  };

  const movePage = (pageId: string, direction: -1 | 1) => {
    mutatePages((prev) => {
      const index = prev.findIndex((page) => page.id === pageId);
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const exportPdf = async (quality: 'digital' | 'impressao') => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const scale = quality === 'impressao' ? 3 : 1.6;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const nodes = Array.from(exportRef.current.querySelectorAll<HTMLElement>('[data-journal-page]'));

      for (let index = 0; index < nodes.length; index += 1) {
        const canvas = await html2canvas(nodes[index], {
          scale,
          useCORS: true,
          backgroundColor: '#F0EEE4',
          width: A4_W,
          height: A4_H,
          windowWidth: A4_W,
          windowHeight: A4_H,
          onclone: (doc) => {
            // html2canvas colapsa parte do espaçamento vertical do grid; reforçamos
            // o respiro acima das imagens para o PDF ficar igual ao preview.
            doc.querySelectorAll<HTMLElement>('[data-block-kind="image"]').forEach((el) => {
              el.style.paddingTop = '8px';
            });
          },
        });
        if (index > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', quality === 'impressao' ? 0.98 : 0.9), 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`${name || 'jornal'}.pdf`);
      toast.success('PDF gerado.');
    } catch (error) {
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
          </Button>
          <Input
            value={name}
            onChange={(event) => {
              dirtyRef.current = true;
              setName(event.target.value);
            }}
            className="h-9 w-56 text-base font-semibold"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <Check className="h-3 w-3" /> {savedAt ? `Tudo salvo · ${savedAt}` : 'Tudo salvo'}
              </>
            )}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportPdf('digital')} disabled={exporting}>
              {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
              PDF digital
            </Button>
            <Button size="sm" onClick={() => exportPdf('impressao')} disabled={exporting}>
              <Download className="mr-1.5 h-4 w-4" /> PDF impressão
            </Button>
          </div>
        </div>

        <UnitBadge
          variant="line"
          unitId={journal.unit_id}
          label="Jornal da unidade"
          onChangeUnit={(unitId) =>
            onSave(journal.id, { unitId, profileUnit: profileUnitForNewsUnit(unitId) })
          }
        />
      </div>



      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[210px_1fr_300px]">
        {/* Miniaturas */}
        <aside className="hidden flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-card p-2 lg:flex">
          {pages.map((page, index) => {
            const status = pageStatus(page);
            const active = page.id === activePageId;
            return (
              <div key={page.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setActivePageId(page.id);
                    setSelectedBlockId(null);
                  }}
                  aria-current={active}
                  className={cn(
                    'block w-full rounded-md border p-1.5 text-left text-xs transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-accent shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-accent/40',
                  )}
                >
                  <div className="h-32 overflow-hidden rounded-sm border border-border bg-news-paper">
                    <div style={{ transform: `scale(${180 / A4_W})`, transformOrigin: 'top left' }}>
                      <JournalPageView
                        page={page}
                        index={index}
                        total={pages.length}
                        edition={journal.reference_month || ''}
                        unitName={unitName}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 truncate font-medium text-foreground">
                    Página {String(index + 1).padStart(2, '0')} · {TEMPLATE_LABELS[page.template]}
                  </p>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center gap-1 text-[10px]',
                      status === 'completa' ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {status === 'completa' ? '✓ Completa' : '● Pendente'}
                  </span>
                </button>

                <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-md bg-card/90 p-0.5 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Mover para cima" onClick={() => movePage(page.id, -1)}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Mover para baixo" onClick={() => movePage(page.id, 1)}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Duplicar página" onClick={() => duplicatePage(page)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" aria-label="Excluir página" onClick={() => removePage(page.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Select onValueChange={(value) => addPage(value as JournalTemplate)}>
            <SelectTrigger className="h-9 text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar página
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_OPTIONS.map((template) => (
                <SelectItem key={template} value={template}>
                  {TEMPLATE_LABELS[template]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </aside>

        {/* Canvas */}
        <section className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Página {pages.findIndex((page) => page.id === activePage.id) + 1} de {pages.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant={layoutLocked ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLayoutLocked((value) => !value)}
                title={
                  layoutLocked
                    ? 'Layout travado pelo modelo — clique para liberar tamanho e posição'
                    : 'Layout livre — clique para travar tamanho e posição'
                }
              >
                {layoutLocked ? (
                  <>
                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Layout travado
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1.5 h-3.5 w-3.5" /> Layout livre
                  </>
                )}
              </Button>
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                <Button
                  variant={paperColor === '#EEEEEE' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperColor('#EEEEEE')}
                  title="Fundo cinza (#EEEEEE)"
                >
                  Fundo #EEE
                </Button>
                <Button
                  variant={paperColor === '#FFFFFF' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPaperColor('#FFFFFF')}
                  title="Fundo branco"
                >
                  Branco
                </Button>
              </div>
              <Button
                variant={autoFit ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setAutoFit(true)}
                title="Ajustar a folha à tela"
              >
                Ajustar à tela
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setManualZoom((z) => z - 0.1)} aria-label="Diminuir zoom">
                −
              </Button>
              <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => setManualZoom((z) => z + 0.1)} aria-label="Aumentar zoom">
                +
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setManualZoom(() => 1)} title="Restaurar 100%">
                100%
              </Button>
            </div>
          </div>
          <div ref={canvasRef} className="flex-1 overflow-auto bg-journal-workspace p-6">
            <div
              style={{
                width: A4_W * zoom,
                height: A4_H * zoom,
                margin: '0 auto',
              }}
            >
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                <JournalPageView
                  page={activePage}
                  index={pages.findIndex((page) => page.id === activePage.id)}
                  total={pages.length}
                  edition={journal.reference_month || ''}
                  unitName={unitName}
                  interactive
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  showGrid={!layoutLocked}
                  paperColor={paperColor}
                  onResizeBlockSpan={layoutLocked ? undefined : resizeBlockSpan}
                  onResizeBlockHeight={layoutLocked ? undefined : resizeBlockHeight}
                  onReorderBlocks={layoutLocked ? undefined : reorderBlocks}
                  onSelectPageArea={() => setSelectedBlockId(null)}
                  className="border border-border shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>
          </div>
        </section>


        {/* Conteúdo da página */}
        <aside className="flex flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-3">
          {layoutLocked ? (
            <p className="rounded-md bg-muted/60 px-2.5 py-2 text-[11px] text-muted-foreground">
              Layout do modelo travado: clique em um bloco para trocar o texto ou enviar a imagem.
              Para incluir/remover blocos ou mudar tamanhos, use “Layout livre” na barra do canvas.
            </p>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground">
                {selectedBlock ? 'Adicionar abaixo do bloco selecionado' : 'Adicionar ao jornal'}
              </Label>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => addBlock(textBlock('corpo', 'Novo texto.'))}>
                  <Type className="mr-1.5 h-3.5 w-3.5" /> Texto
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock(imageBlock(6, '16/9'))}>
                  <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Imagem
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock(statBlock())}>
                  <Hash className="mr-1.5 h-3.5 w-3.5" /> Número
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBlock(agendaBlock())}>
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Agenda
                </Button>
              </div>
            </div>
          )}

          <JournalBlockList
            blocks={activePage?.blocks ?? []}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onMove={moveBlock}
            locked={layoutLocked}
          />

          <div className="h-px bg-border" />

          <JournalPropertiesPanel
            page={activePage}
            block={selectedBlock}
            onChangeBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onClose={() => setSelectedBlockId(null)}
            locked={layoutLocked}
          />
        </aside>
      </div>

      {/* Container offscreen usado somente na exportação (paridade preview = PDF) */}
      <div ref={exportRef} className="pointer-events-none fixed left-[-20000px] top-0" aria-hidden="true">
        {pages.map((page, index) => (
          <div key={page.id} data-journal-page>
            <JournalPageView
              page={page}
              index={index}
              total={pages.length}
              edition={journal.reference_month || ''}
              unitName={unitName}
              paperColor={paperColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default JournalEditor;
