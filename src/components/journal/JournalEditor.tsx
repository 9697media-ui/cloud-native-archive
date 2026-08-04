import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Type,
  Hash,
  CalendarDays,
  Check,
  Maximize,
  Eye,
  LayoutTemplate,
  AlertTriangle,
  FileImage,
  Lightbulb,
  ChevronUp,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { A4_H, A4_W, JournalPageView } from './JournalPageView';
import { JournalPropertiesPanel } from './JournalPropertiesPanel';
import { JournalBlockList } from './JournalBlockList';
import { PageTemplateGallery } from './PageTemplateGallery';


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
import { useIsMobile } from '@/hooks/use-mobile';

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
      paper?: 'branco' | 'offwhite';
    },
  ) => Promise<boolean>;
}

export function JournalEditor({ journal, saving, savedAt, onBack, onSave }: Props) {
  const [name, setName] = useState(journal.name);
  const [pages, setPages] = useState<JournalPage[]>(journal.pages?.length ? journal.pages : [createPage('capa_c1')]);
  const [activePageId, setActivePageId] = useState<string>(pages[0].id);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [autoFit, setAutoFit] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [paper, setPaper] = useState<'branco' | 'offwhite'>(journal.paper || 'branco');
  const [overflowByPage, setOverflowByPage] = useState<Record<string, number>>({});
  const exportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);
  const isMobile = useIsMobile();

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const selectedBlock = activePage?.blocks.find((block) => block.id === selectedBlockId);
  const unitName = useMemo(() => newsUnitName(journal.unit_id), [journal.unit_id]);

  const paperHex = paper === 'offwhite' ? '#F0EEE4' : '#FFFFFF';

  // Autosave com 2s de inatividade.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timer = setTimeout(() => {
      onSave(journal.id, { name, pages, paper });
      dirtyRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, [name, pages, paper, journal.id, onSave]);

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

  const duplicateBlock = () => {
    if (!selectedBlock) return;
    const copy: JournalBlock = { ...selectedBlock, id: uid() };
    mutatePages((prev) =>
      prev.map((page) => {
        if (page.id !== activePage.id) return page;
        const at = page.blocks.findIndex((entry) => entry.id === selectedBlockId);
        const blocks = [...page.blocks];
        blocks.splice(at + 1, 0, copy);
        return { ...page, blocks };
      }),
    );
    setSelectedBlockId(copy.id);
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

  const changePageTemplate = (template: JournalTemplate) => {
    mutatePages((prev) =>
      prev.map((page) =>
        page.id === activePageId ? { ...createPage(template), id: page.id } : page,
      ),
    );
    setSelectedBlockId(null);
  };

  const currentOverflow = overflowByPage[activePage.id] ?? 0;

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
          backgroundColor: paperHex,
          width: A4_W,
          height: A4_H,
          windowWidth: A4_W,
          windowHeight: A4_H,
          onclone: (doc) => {
            doc.querySelectorAll<HTMLElement>('[data-pdf-helper="true"]').forEach((el) => el.remove());
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

  const fitZoom = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    const padding = 40;
    const z = Math.min((width - padding) / A4_W, (height - padding) / A4_H);
    setZoom(Math.max(0.4, Math.min(1, z)));
  }, []);

  // Auto-fit ao abrir e ao redimensionar.
  useEffect(() => {
    if (!autoFit) return;
    fitZoom();
    const onResize = () => fitZoom();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [autoFit, fitZoom]);

  const manualZoom = (direction: number) => {
    setZoom((z) => {
      const next = Math.max(0.4, Math.min(1, z + direction));
      return next;
    });
    setAutoFit(false);
  };

  const handleOverflow = (pageId: string) => (overflow: number) => {
    setOverflowByPage((prev) => ({ ...prev, [pageId]: overflow }));
  };

  const moveOverflowToNewPage = () => {
    mutatePages((prev) => {
      const activeIndex = prev.findIndex((page) => page.id === activePageId);
      if (activeIndex < 0) return prev;
      const next = [...prev];
      const newPage = createPage('branco');
      next.splice(activeIndex + 1, 0, newPage);
      return next;
    });
    toast.success('Nova página criada abaixo da página atual. Mova os blocos excedentes para lá.');
  };

  const activeIndex = pages.findIndex((page) => page.id === activePage.id);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Barra superior */}
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value={paper} onValueChange={(value: 'branco' | 'offwhite') => { setPaper(value); dirtyRef.current = true; }}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <span className="mr-1">Papel:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branco">Branco (#FFFFFF)</SelectItem>
                <SelectItem value="offwhite">Off-white (#F0EEE4)</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => { setAutoFit(true); fitZoom(); }}>
              <Maximize className="mr-1.5 h-4 w-4" /> Ajustar à tela
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPdf('digital')} disabled={exporting}>
              {exporting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />}
              PDF digital
            </Button>
            <Button size="sm" onClick={() => exportPdf('impressao')} disabled={exporting}>
              <Download className="mr-1.5 h-4 w-4" /> Exportar PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportPdf('impressao')} disabled={exporting}>
                  <FileImage className="mr-2 h-4 w-4" /> PDF de impressão
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { duplicatePage(activePage); }}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicar página
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { duplicatePage({ ...activePage, id: activePage.id, blocks: activePage.blocks }); toast.success('Jornal duplicado na memória.'); }}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicar jornal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => removePage(activePage.id)} disabled={pages.length === 1}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir página
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[200px_1fr_300px]">
        {/* Miniaturas */}
        <aside className="hidden flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-card p-2 lg:flex">
          {pages.map((page, index) => {
            const isActive = page.id === activePageId;
            return (
              <div
                key={page.id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group relative flex cursor-pointer flex-col gap-1 rounded-lg border p-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'border-2 border-primary bg-accent' : 'border-border hover:bg-accent/50',
                )}
                onClick={() => {
                  setActivePageId(page.id);
                  setSelectedBlockId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setActivePageId(page.id);
                    setSelectedBlockId(null);
                  }
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary" />
                )}
                <div className="mb-1 flex items-center justify-between pl-2">
                  <span className="font-semibold text-foreground">
                    {String(index + 1).padStart(2, '0')} · {TEMPLATE_LABELS[page.template]}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); movePage(page.id, -1); }}>
                        <ChevronUp className="mr-2 h-4 w-4" /> Subir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); movePage(page.id, 1); }}>
                        <ChevronDown className="mr-2 h-4 w-4" /> Descer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicatePage(page); }}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); removePage(page.id); }} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="h-32 overflow-hidden rounded-sm border border-border bg-news-paper">
                  <div style={{ transform: `scale(${150 / A4_W})`, transformOrigin: 'top left' }}>
                    <JournalPageView
                      page={page}
                      index={index}
                      total={pages.length}
                      edition={journal.reference_month || ''}
                      unitName={unitName}
                      paper={paper}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Select onValueChange={(value) => addPage(value as JournalTemplate)}>
            <SelectTrigger className="h-10 text-xs font-medium">
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar página
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_header" disabled className="text-xs text-muted-foreground">
                Capas
              </SelectItem>
              {TEMPLATE_OPTIONS.filter((t) => t.startsWith('capa')).map((template) => (
                <SelectItem key={template} value={template}>
                  {TEMPLATE_LABELS[template]}
                </SelectItem>
              ))}
              <SelectItem value="_divider" disabled className="text-xs text-muted-foreground">
                Layouts internos
              </SelectItem>
              {TEMPLATE_OPTIONS.filter((t) => !t.startsWith('capa')).map((template) => (
                <SelectItem key={template} value={template}>
                  {TEMPLATE_LABELS[template]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </aside>

        {/* Canvas */}
        <section
          ref={canvasRef}
          className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-[#EEEEEE] dark:bg-muted"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Página {activeIndex + 1} de {pages.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => manualZoom(-0.1)} disabled={zoom <= 0.4}>−</Button>
              <span className="w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => manualZoom(0.1)} disabled={zoom >= 1}>+</Button>
            </div>
          </div>

          {currentOverflow > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Conteúdo excede a página em ~{Math.round(currentOverflow)}px
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={moveOverflowToNewPage}>
                  Mover excedente para nova página
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
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
                  index={activeIndex}
                  total={pages.length}
                  edition={journal.reference_month || ''}
                  unitName={unitName}
                  interactive
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onResizeBlockSpan={resizeBlockSpan}
                  onResizeBlockHeight={resizeBlockHeight}
                  onReorderBlocks={reorderBlocks}
                  onSelectPageArea={() => setSelectedBlockId(null)}
                  className="shadow-lg"
                  paper={paper}
                  onOverflow={handleOverflow(activePage.id)}
                />
              </div>
            </div>
          </div>

          {/* Mini-barra flutuante no canvas */}
          {selectedBlock && !activePage.locked && !isMobile && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
              <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1 shadow-lg backdrop-blur-sm">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { /* editar: já está selecionado; painel assume o foco */ }}>
                  <Type className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
                {selectedBlock.kind === 'image' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { /* imagem: use o painel lateral */ }}>
                    <FileImage className="mr-1.5 h-3.5 w-3.5" /> Trocar imagem
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={duplicateBlock}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={removeBlock}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Painel lateral em 3 níveis */}
        <aside className="flex flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-3">
          {/* Nível 1: Conteúdo */}
          <div>
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <LayoutTemplate className="h-3.5 w-3.5" /> Adicionar conteúdo
            </Label>
            <p className="mb-2 text-[10px] text-muted-foreground">
              {selectedBlock ? 'Novo bloco será inserido abaixo do selecionado.' : 'Novo bloco vai ao final da página.'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
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

          <JournalBlockList
            blocks={activePage?.blocks ?? []}
            selectedBlockId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onMove={moveBlock}
          />

          <div className="h-px bg-border" />

          {/* Nível 2+3: Formatação e ajustes avançados */}
          <JournalPropertiesPanel
            page={activePage}
            block={selectedBlock}
            onChangeBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onClose={() => setSelectedBlockId(null)}
          />

          {/* Sugestão de diagramação */}
          {selectedBlock && selectedBlock.kind === 'image' && !selectedBlock.height && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs dark:bg-amber-950/30">
              <div className="mb-1 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200">
                <Lightbulb className="h-3.5 w-3.5" /> Sugestão
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                Ajuste a altura com a alça inferior para preencher o espaço disponível.
              </p>
            </div>
          )}
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
              paper={paper}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default JournalEditor;
