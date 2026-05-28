import React, { useState } from 'react';
import {
  Trash2,
  Image as ImageIcon,
  FileText,
  Printer,
  AlertCircle,
  GripVertical,
  Columns,
  Square,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid,
  PlusCircle,
  Bold,
} from 'lucide-react';

const MODULE_RULES: Record<string, { label: string; max: number; icon: any; placeholder: string }> = {
  paragraph: { label: 'Parágrafo de Texto', max: Infinity, icon: FileText, placeholder: 'Digite o texto da notícia aqui...' },
  image: { label: 'Imagem (URL)', max: Infinity, icon: ImageIcon, placeholder: 'Cole o link/URL da imagem aqui...' },
};

function CarouselGallery({ items, isGeneratingPdf }: { items: any[]; isGeneratingPdf: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));

  return (
    <div className="w-full">
      {/* MODO BLOG: Slideshow interativo */}
      {!isGeneratingPdf && (
        <div className="relative w-full rounded-xl overflow-hidden shadow-md group bg-muted">
          {items.map((item, idx) => (
            <img
              key={item.id}
              src={item.content}
              alt=""
              className={`w-full h-[400px] object-cover transition-opacity duration-500 ${idx === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/800x400/eeeeee/999999?text=Imagem+N%C3%A3o+Encontrada';
              }}
            />
          ))}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute z-20 left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute z-20 right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute z-20 bottom-4 left-0 right-0 flex justify-center gap-2">
            {items.map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${idx === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* MODO PDF: Grid em Blocos */}
      {isGeneratingPdf && (
        <div style={{ width: '100%', fontSize: 0 }}>
          {items.map((item, idx) => {
            const isOddTotal = items.length % 2 !== 0;
            const isFirst = idx === 0;
            const pdfStyle: React.CSSProperties = (isOddTotal && isFirst)
              ? { width: '100%', display: 'block', marginBottom: '16px', aspectRatio: '21/9', objectFit: 'cover', pageBreakInside: 'avoid', breakInside: 'avoid' }
              : { width: 'calc(50% - 8px)', display: 'inline-block', verticalAlign: 'top', margin: '4px', marginBottom: '16px', aspectRatio: '4/3', objectFit: 'cover', pageBreakInside: 'avoid', breakInside: 'avoid' };

            return (
              <img
                key={item.id}
                src={item.content}
                alt=""
                style={pdfStyle}
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/800x400/eeeeee/999999?text=Erro';
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NewsGeneratorPage() {
  const [headerData, setHeaderData] = useState({
    author: 'Por: Equipe de Jornalismo - 28/05/2026',
    title: 'Olimpíadas de Matemática: Alunos se destacam',
    subtitle: 'Escola conquista três medalhas de ouro na etapa regional.',
  });

  const [modules, setModules] = useState<any[]>([
    { id: '4', type: 'paragraph', content: 'Nesta última semana, nossos alunos do 9º ano participaram da edição regional da Olimpíada de Matemática, trazendo **resultados históricos** para a nossa instituição. Abaixo conferimos os registros deste momento único!', width: 'full' },
    { id: '5', type: 'image', content: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', width: 'third' },
    { id: '6', type: 'image', content: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', width: 'third' },
    { id: '7', type: 'image', content: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80', width: 'third' },
  ]);

  const [dragItem, setDragItem] = useState<any>(null);
  const [dropIndicator, setDropIndicator] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleNewArticle = () => setShowClearModal(true);

  const addModule = (type: string) => {
    setModules([...modules, { id: Date.now().toString(), type, content: '', width: 'full' }]);
  };

  const removeModule = (id: string) => setModules(modules.filter((m) => m.id !== id));
  const updateContent = (id: string, newContent: string) =>
    setModules(modules.map((m) => (m.id === id ? { ...m, content: newContent } : m)));

  const insertBold = (id: string) => {
    const textarea = document.getElementById(`textarea-${id}`) as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      const newText = selectedText.length > 0
        ? text.substring(0, start) + `**${selectedText}**` + text.substring(end)
        : text + ' **texto negrito**';

      updateContent(id, newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end > start ? end + 2 : newText.length - 2);
      }, 0);
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </>
    );
  };

  const confirmNewArticle = () => {
    setHeaderData({ author: '', title: '', subtitle: '' });
    setModules([]);
    setShowClearModal(false);
  };

  const toggleWidth = (id: string) => {
    setModules(modules.map((m) => {
      if (m.id !== id) return m;
      let nextWidth = 'full';
      if (m.width === 'full') nextWidth = 'half';
      else if (m.width === 'half') nextWidth = 'third';
      else if (m.width === 'third') nextWidth = 'full';
      return { ...m, width: nextWidth };
    }));
  };

  const getWidthClass = (widthStr: string) => {
    if (widthStr === 'third') return 'w-full md:grow md:basis-[calc(33.333333%-10.666px)]';
    if (widthStr === 'half') return 'w-full md:grow md:basis-[calc(50%-8px)]';
    return 'w-full flex-none';
  };

  const getPdfWidthClass = (widthStr: string) => {
    if (widthStr === 'third') return 'w-[calc(33.33%-8px)] inline-block align-top mx-[4px] mb-6';
    if (widthStr === 'half') return 'w-[calc(50%-8px)] inline-block align-top mx-[4px] mb-6';
    return 'w-full block mb-6';
  };

  const handleDragStartToolbox = (e: React.DragEvent, type: string) => {
    setDragItem({ source: 'toolbox', type });
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
  };

  const handleDragStartList = (e: React.DragEvent, id: string) => {
    setDragItem({ source: 'list', id });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDropIndicator(null);
  };

  const handleModuleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem || (dragItem.source === 'list' && dragItem.id === targetId)) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let position: 'left' | 'right' | 'top' | 'bottom' = 'bottom';
    if (x < rect.width * 0.25) position = 'left';
    else if (x > rect.width * 0.75) position = 'right';
    else if (y < rect.height * 0.5) position = 'top';
    else position = 'bottom';

    if (dropIndicator?.id !== targetId || dropIndicator?.position !== position) {
      setDropIndicator({ id: targetId, position });
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem) return;
    if (dropIndicator?.id !== 'container') {
      setDropIndicator({ id: 'container', position: 'bottom' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragItem || !dropIndicator) {
      handleDragEnd();
      return;
    }

    let newItem: any;
    if (dragItem.source === 'toolbox') {
      newItem = { id: Date.now().toString(), type: dragItem.type, content: '', width: 'full' };
    } else {
      const found = modules.find((m) => m.id === dragItem.id);
      if (!found) return;
      newItem = { ...found };
    }

    if (!newItem) return;

    let newModules = modules.map((m) => ({ ...m })).filter((m) => m.id !== newItem.id);

    if (dropIndicator.id === 'container') {
      newModules.push(newItem);
    } else {
      let targetIndex = newModules.findIndex((m) => m.id === dropIndicator.id);
      if (targetIndex !== -1) {
        if (dropIndicator.position === 'left' || dropIndicator.position === 'right') {
          const target = newModules[targetIndex];

          if (target.width === 'full') {
            target.width = 'half';
            newItem.width = 'half';
          } else if (target.width === 'half') {
            target.width = 'third';
            newItem.width = 'third';
            if (targetIndex > 0 && newModules[targetIndex - 1].width === 'half') {
              newModules[targetIndex - 1].width = 'third';
            } else if (targetIndex < newModules.length - 1 && newModules[targetIndex + 1].width === 'half') {
              newModules[targetIndex + 1].width = 'third';
            }
          } else {
            newItem.width = 'third';
          }

          if (dropIndicator.position === 'left') {
            newModules.splice(targetIndex, 0, newItem);
          } else {
            newModules.splice(targetIndex + 1, 0, newItem);
          }
        } else {
          newItem.width = 'full';
          if (dropIndicator.position === 'bottom') {
            targetIndex += 1;
          }
          newModules.splice(targetIndex, 0, newItem);
        }
      } else {
        newItem.width = 'full';
        newModules.push(newItem);
      }
    }

    setModules(newModules);
    handleDragEnd();
  };

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    setPdfError(false);

    try {
      if (!(window as any).html2pdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.head.appendChild(script);

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Erro de rede ao carregar biblioteca'));
          }),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout no script')), 15000)),
        ]);
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      const element = document.getElementById('pdf-content');
      const opt = {
        margin: 15,
        filename: 'noticia-institucional.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break', 'h1', 'h2', 'img'] },
      };

      const pdfPromise = (window as any).html2pdf().set(opt).from(element).save();

      await Promise.race([
        pdfPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout gerando arquivo')), 20000)),
      ]);
    } catch (error) {
      console.error('Falha ao gerar PDF:', error);
      setPdfError(true);
      setTimeout(() => setPdfError(false), 7000);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderModules: any[] = [];
  let currentGalleryGroup: any = null;

  modules.forEach((module) => {
    if (!module.content && module.type !== 'image') return;

    if (module.type === 'image' && module.width === 'full' && module.content) {
      if (!currentGalleryGroup) {
        currentGalleryGroup = { id: `gallery-${module.id}`, type: 'gallery', width: 'full', items: [module] };
        renderModules.push(currentGalleryGroup);
      } else {
        currentGalleryGroup.items.push(module);
      }
    } else {
      currentGalleryGroup = null;
      if (module.content || module.type === 'image') {
        renderModules.push(module);
      }
    }
  });

  const finalRenderModules = renderModules.map((m) =>
    m.type === 'gallery' && m.items.length === 1 ? m.items[0] : m
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-muted/30">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
        }
        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .page-ruler-bg {
          background-image: repeating-linear-gradient(to bottom, transparent, transparent 296mm, hsl(var(--border)) 296mm, hsl(var(--border)) 297mm);
        }
      `}</style>

      {/* PAINEL DE EDIÇÃO */}
      <div className="w-full lg:w-[420px] flex flex-col bg-card border-r border-border print:hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <LayoutGrid size={20} className="text-primary" />
              Editor Institucional
            </h2>
          </div>

          <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Cabeçalho (Ordem Fixa Obrigatória)
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">1. Autor e Data</label>
              <input
                type="text"
                value={headerData.author}
                onChange={(e) => setHeaderData({ ...headerData, author: e.target.value })}
                placeholder="Ex: Equipe de Jornalismo - 10/10/2026"
                className="w-full p-2 text-sm font-medium border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="block text-xs font-medium text-muted-foreground">2. Título Principal</label>
              <input
                type="text"
                value={headerData.title}
                onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
                placeholder="Digite o título da notícia..."
                className="w-full p-2 text-base font-bold border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="block text-xs font-medium text-muted-foreground">3. Subtítulo</label>
              <input
                type="text"
                value={headerData.subtitle}
                onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
                placeholder="Linha fina de apoio..."
                className="w-full p-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Adicionar Corpo (Arraste)
            </h3>
            <div className="flex gap-2">
              {Object.entries(MODULE_RULES).map(([type, rule]) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => handleDragStartToolbox(e, type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addModule(type)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium transition-all select-none bg-muted text-foreground hover:bg-accent border border-border cursor-grab active:cursor-grabbing"
                  >
                    <Icon size={16} />
                    {rule.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {modules.map((module) => {
              const rule = MODULE_RULES[module.type];
              const Icon = rule.icon;
              const isDraggingThis = dragItem?.id === module.id;
              const isTarget = dropIndicator?.id === module.id;
              const widthClass = getWidthClass(module.width);

              return (
                <div
                  key={module.id}
                  draggable
                  onDragStart={(e) => {
                    const tagName = (e.nativeEvent.target as HTMLElement).tagName.toLowerCase();
                    if (['textarea', 'input', 'button'].includes(tagName) || (e.nativeEvent.target as HTMLElement).closest('button')) {
                      e.preventDefault();
                      return;
                    }
                    handleDragStartList(e, module.id);
                  }}
                  onDragOver={(e) => handleModuleDragOver(e, module.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  className={`bg-card border relative rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all
                    ${isDraggingThis ? 'opacity-30 border-dashed' : 'border-border hover:border-primary/50'}
                    ${widthClass}`}
                >
                  {isTarget && (
                    <div className="absolute inset-0 bg-primary/10 border-2 border-primary z-10 pointer-events-none rounded-xl" />
                  )}

                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <GripVertical size={14} />
                      <Icon size={14} />
                      {rule.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleWidth(module.id)}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-accent rounded text-foreground text-xs font-bold bg-muted transition-colors"
                        title="Alternar Largura"
                      >
                        {module.width === 'full' && <><Square size={10} /> 100%</>}
                        {module.width === 'half' && <><Columns size={10} /> 50%</>}
                        {module.width === 'third' && <><LayoutGrid size={10} /> 33%</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeModule(module.id)}
                        className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {module.type === 'paragraph' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 border-b border-border">
                      <button
                        type="button"
                        onClick={() => insertBold(module.id)}
                        className="p-1.5 hover:bg-accent rounded text-foreground transition-colors"
                        title="Aplicar Negrito"
                      >
                        <Bold size={14} />
                      </button>
                    </div>
                  )}

                  <div className="p-2 flex-1">
                    {module.type === 'paragraph' ? (
                      <textarea
                        id={`textarea-${module.id}`}
                        value={module.content}
                        onChange={(e) => updateContent(module.id, e.target.value)}
                        placeholder={rule.placeholder}
                        className="w-full h-full min-h-[100px] p-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      />
                    ) : module.type === 'image' ? (
                      <div className="flex flex-col gap-2 h-full justify-between">
                        <input
                          type="url"
                          value={module.content}
                          onChange={(e) => updateContent(module.id, e.target.value)}
                          placeholder={rule.placeholder}
                          className="w-full p-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {module.content && (
                          <img
                            src={module.content}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded mt-2"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-card border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleNewArticle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-lg font-semibold transition-colors"
          >
            <PlusCircle size={18} />
            Criar Nova Notícia
          </button>
        </div>
      </div>

      {/* PAINEL DE VISUALIZAÇÃO / PDF */}
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-10 bg-muted print:bg-white print:p-0 print:w-full print:h-auto print:block overflow-y-auto relative items-center">
        <div className="sticky md:absolute top-0 right-0 md:top-6 md:right-6 w-full md:w-auto flex justify-end pb-4 md:pb-0 z-10 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
            {isGeneratingPdf ? 'Gerando...' : 'Salvar PDF'}
          </button>

          {pdfError && (
            <div className="mt-2 absolute top-full right-0 bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-md shadow-sm border border-destructive/30 flex items-center gap-1 animate-pulse min-w-max">
              <AlertCircle size={14} />
              Erro. Tentando impressão nativa...
            </div>
          )}
        </div>

        <article
          id="pdf-content"
          className={`bg-white mx-auto w-full max-w-[210mm] min-h-[297mm] p-6 md:p-12 shadow-2xl rounded-sm text-slate-800
            ${isGeneratingPdf ? 'shadow-none p-0 max-w-none w-full' : 'page-ruler-bg print:shadow-none print:p-0 print:max-w-none print:w-full print:bg-none'}
          `}
          onDragOver={handleContainerDragOver}
          onDrop={handleDrop}
        >
          <div className={`border-b-4 border-primary pb-4 mb-8 ${isGeneratingPdf ? 'hidden' : 'print:hidden'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex justify-between items-center">
              <span>Pré-visualização</span>
              <span className="text-slate-400 font-normal normal-case opacity-70 border border-slate-300 px-2 py-0.5 rounded text-[10px]">
                A linha cinza indica quebra de página A4
              </span>
            </span>
          </div>

          <div className="w-full mb-8 avoid-break clear-both">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-t border-b border-slate-200 py-2 mb-4">
              {headerData.author || 'Autor e Data'}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4 break-words">
              {headerData.title || 'Título não definido'}
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-slate-600 leading-snug break-words">
              {headerData.subtitle || 'Subtítulo não definido'}
            </h2>
          </div>

          {modules.length === 0 && (
            <div className="text-center py-20 text-slate-400 print:hidden flex flex-col items-center border-2 border-dashed border-slate-200 rounded-xl mx-4">
              <AlertCircle size={40} className="mb-3 opacity-20" />
              <p>O corpo da notícia está vazio.</p>
              <p className="text-sm mt-2">Arraste os blocos da caixa de ferramentas para cá.</p>
            </div>
          )}

          <div className={isGeneratingPdf ? 'block w-full' : 'flex flex-wrap gap-4 w-full'}>
            {finalRenderModules.map((module) => {
              const widthClass = isGeneratingPdf ? getPdfWidthClass(module.width) : getWidthClass(module.width);
              const dragId = module.type === 'gallery' ? module.items[0].id : module.id;
              const isDraggingThis = dragItem?.id === dragId;
              const isTarget = dropIndicator?.id === dragId;

              let contentRender: React.ReactNode = null;
              switch (module.type) {
                case 'paragraph':
                  contentRender = (
                    <div className={`flex flex-col w-full ${module.width === 'full' ? '' : 'flex-1 h-full'}`}>
                      <p className="text-base md:text-lg text-slate-700 leading-relaxed text-justify">
                        {module.content.split('\n').map((line: string, i: number) => (
                          <React.Fragment key={i}>{renderFormattedText(line)}<br /></React.Fragment>
                        ))}
                      </p>
                    </div>
                  );
                  break;
                case 'image':
                  contentRender = (
                    <figure className={`flex flex-col w-full m-0 ${module.width === 'full' ? 'h-auto' : 'flex-1 h-full'}`}>
                      <img
                        src={module.content}
                        alt="Notícia"
                        className={`w-full object-cover rounded-xl shadow-md pointer-events-none
                          ${module.width === 'full' ? 'max-h-[500px]' : (isGeneratingPdf ? 'aspect-video h-full' : 'h-full flex-1 min-h-[200px]')}
                        `}
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/800x400/eeeeee/999999?text=Imagem+N%C3%A3o+Encontrada';
                        }}
                      />
                    </figure>
                  );
                  break;
                case 'gallery':
                  contentRender = <CarouselGallery items={module.items} isGeneratingPdf={isGeneratingPdf} />;
                  break;
                default:
                  return null;
              }

              return (
                <div
                  key={module.id}
                  style={isGeneratingPdf ? { pageBreakInside: 'avoid', breakInside: 'avoid' } : {}}
                  className={`
                    ${widthClass}
                    ${module.type === 'paragraph' ? '' : 'avoid-break'}
                    flex flex-col
                    relative
                    border-2 border-transparent
                    ${!isGeneratingPdf ? 'hover:border-primary/30 border-dashed rounded-lg transition-colors cursor-grab active:cursor-grabbing' : ''}
                    ${isDraggingThis ? 'opacity-30' : ''}
                  `}
                  draggable={!isGeneratingPdf}
                  onDragStart={(e) => {
                    const tagName = (e.nativeEvent.target as HTMLElement).tagName.toLowerCase();
                    if (['textarea', 'input', 'button'].includes(tagName) || (e.nativeEvent.target as HTMLElement).closest('button')) {
                      e.preventDefault();
                      return;
                    }
                    handleDragStartList(e, dragId);
                  }}
                  onDragOver={(e) => handleModuleDragOver(e, dragId)}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                >
                  {isTarget && !isGeneratingPdf && (
                    <div className={`absolute pointer-events-none bg-primary/20 z-10
                      ${dropIndicator.position === 'left' ? 'top-0 left-0 bottom-0 w-1/2 border-l-4 border-primary' : ''}
                      ${dropIndicator.position === 'right' ? 'top-0 right-0 bottom-0 w-1/2 border-r-4 border-primary' : ''}
                      ${dropIndicator.position === 'top' ? 'top-0 left-0 right-0 h-1/2 border-t-4 border-primary' : ''}
                      ${dropIndicator.position === 'bottom' ? 'bottom-0 left-0 right-0 h-1/2 border-b-4 border-primary' : ''}
                    `} />
                  )}

                  {contentRender}
                </div>
              );
            })}
          </div>

          <footer className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 print:block w-full avoid-break clear-both">
            Documento gerado pelo Sistema Institucional de Jornalismo Escolar
          </footer>
        </article>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold">Criar Nova Notícia?</h3>
            </div>
            <p className="text-muted-foreground mb-8 text-base">
              Tem a certeza que deseja começar uma nova notícia? <br /><br />
              <strong className="text-foreground">Todo o conteúdo atual e hierarquia serão apagados e a página ficará em branco.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmNewArticle}
                className="px-4 py-2 rounded-lg font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-md"
              >
                Sim, folha em branco
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
