import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Type,
  Layers,
  Plus,
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
        <div style={{ width: '100%', fontSize: 0, margin: '0 -4px' }}>
          {items.map((item, idx) => {
            const isOddTotal = items.length % 2 !== 0;
            const isFirst = idx === 0;
            const pdfStyle: React.CSSProperties = (isOddTotal && isFirst)
              ? { width: 'calc(100% - 8px)', display: 'block', margin: '4px', marginBottom: '16px', aspectRatio: '21/9', objectFit: 'cover', pageBreakInside: 'avoid', breakInside: 'avoid' }
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [activeWidthMenu, setActiveWidthMenu] = useState<string | null>(null);
  const [layoutAssistant, setLayoutAssistant] = useState<{ isOpen: boolean; rowId?: string; remainingWidth: number; modulesInRow: any[] }>({ isOpen: false, remainingWidth: 0, modulesInRow: [] });
  const widthMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widthMenuRef.current && !widthMenuRef.current.contains(event.target as Node)) {
        setActiveWidthMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Ajusta a largura baseada na posição do mouse
      // Adicionamos um pequeno buffer se necessário, mas clientX funciona bem para painel à esquerda
      const newWidth = Math.max(340, Math.min(1200, e.clientX)); // Aumentado o limite máximo para facilitar colunas largas
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

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

  const updateModuleWidth = (id: string, width: string) => {
    setModules(prevModules => {
      return prevModules.map(m => m.id === id ? { ...m, width } : m);
    });
    setActiveWidthMenu(null);
  };

  const getSidebarWidthClass = (widthStr: string) => {
    if (widthStr === 'two-thirds') return 'w-[calc(66.66%-4px)] flex-grow';
    if (widthStr === 'half') return 'w-[calc(50%-6px)] flex-grow';
    if (widthStr === 'third') return 'w-[calc(33.33%-8px)] flex-grow';
    return 'w-full flex-none';
  };

  const getWidthClass = (widthStr: string) => {
    if (widthStr === 'two-thirds') return 'w-[calc(66.66%-5.33px)] flex-grow';
    if (widthStr === 'third') return 'w-[calc(33.33%-10.66px)] flex-grow';
    if (widthStr === 'half') return 'w-[calc(50%-8px)] flex-grow';
    return 'w-full flex-none';
  };

  const getPdfWidthClass = (widthStr: string) => {
    if (widthStr === 'two-thirds') return 'w-[calc(66.66%-5.33px)] inline-block align-top mx-[2.66px] mb-6';
    if (widthStr === 'third') return 'w-[calc(33.33%-10.66px)] inline-block align-top mx-[5.33px] mb-6';
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
    <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-muted/30">
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

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 top-16 bg-foreground/40 backdrop-blur-sm z-30 print:hidden"
        />
      )}

      {/* Botão flutuante para abrir quando fechada */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed lg:absolute top-20 lg:top-4 left-4 z-40 h-11 px-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 text-sm font-semibold print:hidden"
          title="Abrir editor"
        >
          <ChevronRight size={18} />
          <span>Editor</span>
        </button>
      )}

      {/* PAINEL DE EDIÇÃO */}
      <aside
        style={{ width: sidebarOpen ? (windowWidth >= 1024 ? `${sidebarWidth}px` : '88vw') : '0px' }}
        className={`
          print:hidden bg-card border-r border-border shadow-xl lg:shadow-sm
          flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-out'}
          fixed lg:relative inset-y-0 left-0 top-16 lg:top-0 z-40
          ${sidebarOpen
            ? 'max-w-[90vw] translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:overflow-hidden lg:border-r-0'}
        `}
      >
        {/* Handle de redimensionamento (apenas desktop) */}
        {sidebarOpen && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className="hidden lg:block absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-50 group"
            title="Arraste para redimensionar"
          >
            <div className="absolute inset-y-0 right-0 w-[1px] bg-border group-hover:bg-primary/50 group-hover:w-1 transition-all" />
          </div>
        )}
        {/* Header da sidebar */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-card to-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20 flex-shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">Editor Institucional</h2>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">Construa sua notícia em blocos</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title="Recolher painel"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Cabeçalho */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type size={14} className="text-muted-foreground" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cabeçalho
                </h3>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">Ordem fixa</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                  Autor e Data
                </label>
                <input
                  type="text"
                  value={headerData.author}
                  onChange={(e) => setHeaderData({ ...headerData, author: e.target.value })}
                  placeholder="Ex: Equipe de Jornalismo - 10/10/2026"
                  className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                  Título Principal
                </label>
                <input
                  type="text"
                  value={headerData.title}
                  onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
                  placeholder="Digite o título da notícia..."
                  className="w-full px-3 py-2 text-base font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">3</span>
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={headerData.subtitle}
                  onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
                  placeholder="Linha fina de apoio..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
            </div>
          </section>

          {/* Caixa de ferramentas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Plus size={14} className="text-muted-foreground" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Adicionar Bloco
              </h3>
              <span className="text-[10px] text-muted-foreground/70 ml-auto">Clique ou arraste</span>
            </div>
            <div className={`grid gap-2 ${sidebarWidth > 640 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {Object.entries(MODULE_RULES).map(([type, rule]) => {
                const Icon = rule.icon;
                return (
                  <button
                    type="button"
                    key={type}
                    draggable
                    onDragStart={(e) => handleDragStartToolbox(e, type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addModule(type)}
                    className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-all select-none bg-background hover:bg-primary/5 text-foreground border-2 border-dashed border-border hover:border-primary/40 cursor-grab active:cursor-grabbing active:scale-95"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                      <Icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs leading-tight text-center">{rule.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Blocos do corpo */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-muted-foreground" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Corpo da Notícia
              </h3>
              <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {modules.length}
              </span>
            </div>

            {modules.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <Layers size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum bloco ainda.</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Adicione um bloco acima para começar.</p>
              </div>
            )}


            <div className="flex flex-wrap gap-x-3 gap-y-3">
              {modules.map((module, idx) => {
                const rule = MODULE_RULES[module.type];
                const Icon = rule.icon;
                const isDraggingThis = dragItem?.id === module.id;
                const isTarget = dropIndicator?.id === module.id;
                const widthClass = getSidebarWidthClass(module.width);
                const widthLabel = module.width === 'full' ? '100%' : module.width === 'half' ? '50%' : module.width === 'two-thirds' ? '66.6%' : '33.3%';
                const WidthIcon = module.width === 'full' ? Square : module.width === 'half' ? Columns : LayoutGrid;

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
                    className={`bg-card border relative rounded-xl overflow-hidden shadow-sm hover:shadow-md flex flex-col group transition-all ${widthClass}
                      ${isDraggingThis ? 'opacity-30 border-dashed scale-95' : 'border-border hover:border-primary/40'}`}
                  >
                    {isTarget && (
                      <div className="absolute inset-0 bg-primary/10 border-2 border-primary z-10 pointer-events-none rounded-xl" />
                    )}

                    {/* Header do bloco */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical size={14} className="text-muted-foreground/50 cursor-grab" />
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-primary/15 text-primary text-[10px] font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-foreground truncate">{rule.label}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWidthMenu(activeWidthMenu === module.id ? null : module.id);
                          }}
                          className={`flex items-center gap-1 px-1.5 py-1 hover:bg-accent rounded-md text-[10px] font-bold border transition-colors ${activeWidthMenu === module.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border'}`}
                          title="Opções de Largura"
                        >
                          <WidthIcon size={10} />
                          {widthLabel}
                        </button>

                        {activeWidthMenu === module.id && (
                          <div 
                            ref={widthMenuRef}
                            className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-[100] p-1 animate-in fade-in zoom-in duration-200"
                          >
                            <div className="grid grid-cols-1 gap-1">
                              {[
                                { id: 'full', label: '100% (Cheio)', icon: Square },
                                { id: 'two-thirds', label: '66.6% (2/3)', icon: LayoutGrid },
                                { id: 'half', label: '50% (Metade)', icon: Columns },
                                { id: 'third', label: '33.3% (1/3)', icon: LayoutGrid },
                              ].map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => updateModuleWidth(module.id, option.id)}
                                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors ${module.width === option.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'}`}
                                >
                                  <option.icon size={10} />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeModule(module.id)}
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {module.type === 'paragraph' && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/20 border-b border-border">
                        <button
                          type="button"
                          onClick={() => insertBold(module.id)}
                          className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Aplicar Negrito (selecione o texto)"
                        >
                          <Bold size={13} />
                        </button>
                      </div>
                    )}

                    <div className="p-3 flex-1">
                      {module.type === 'paragraph' ? (
                        <textarea
                          id={`textarea-${module.id}`}
                          value={module.content}
                          onChange={(e) => updateContent(module.id, e.target.value)}
                          placeholder={rule.placeholder}
                          className="w-full h-full min-h-[110px] p-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-y transition-all"
                        />
                      ) : module.type === 'image' ? (
                        <div className="flex flex-col gap-2 h-full">
                          <input
                            type="url"
                            value={module.content}
                            onChange={(e) => updateContent(module.id, e.target.value)}
                            placeholder={rule.placeholder}
                            className="w-full p-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                          />
                          {module.content ? (
                            <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                              <img
                                src={module.content}
                                alt="Preview"
                                className="w-full h-28 object-cover"
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-border bg-muted/30 h-20 flex items-center justify-center">
                              <ImageIcon size={20} className="text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer da sidebar */}
        <div className="p-4 bg-card border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleNewArticle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-background hover:bg-destructive/5 text-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-xl font-semibold text-sm transition-all"
          >
            <PlusCircle size={16} />
            Criar Nova Notícia
          </button>
        </div>
      </aside>


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

          <div className={isGeneratingPdf ? 'block w-full' : 'flex flex-wrap gap-4 w-full'} style={isGeneratingPdf ? { fontSize: 0 } : {}}>
            {finalRenderModules.map((module) => {
              const widthClass = isGeneratingPdf ? getPdfWidthClass(module.width) : getWidthClass(module.width);
              const dragId = module.type === 'gallery' ? module.items[0].id : module.id;
              const isDraggingThis = dragItem?.id === dragId;
              const isTarget = dropIndicator?.id === dragId;

              let contentRender: React.ReactNode = null;
              switch (module.type) {
                case 'paragraph':
                  contentRender = (
                    <div className={`flex flex-col w-full ${module.width === 'full' ? '' : 'flex-1 h-full'}`} style={isGeneratingPdf ? { fontSize: '12pt' } : {}}>
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
