import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import { InstitutionalHeader } from '@/components/news/InstitutionalHeader';
import { ImageBlockField } from '@/components/news/ImageBlockField';
import { NEWS_UNIT_GROUPS, newsUnitName, newsUnitForProfileUnit, profileUnitForNewsUnit } from '@/lib/news/units';
import { useUserRole } from '@/hooks/useUserRole';
import { useNewsBulletins } from '@/hooks/useNewsBulletins';
import {
  CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  normalizeCategory,
  INSTITUTIONAL_DOCUMENT_LABEL,
} from '@/lib/news/categories';
import {
  Trash2,
  Image as ImageIcon,
  FileText,
  Printer,
  AlertCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlusCircle,
  Bold,
  Sparkles,
  Type,
  Layers,
  Plus,
  Copy,
  Pencil,
  X,
  Building2,
  CheckCircle2,
  Quote,
  Images,
  Columns2,
  Rows3,
  Eye,
  FolderOpen,
  Lock,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Constantes de grade
 * ------------------------------------------------------------------ */

/** A folha é dividida em 6 colunas — permite meios (3/6) e terços (2/6). */
const GRID_COLS = 6;
const ROW_HEIGHT = 150;
const DRAFT_KEY = 'ana-news-draft-v2';

const MODULE_RULES: Record<string, { label: string; icon: any; placeholder: string }> = {
  paragraph: { label: 'Texto', icon: FileText, placeholder: 'Digite o texto da notícia aqui...' },
  image: { label: 'Imagem', icon: ImageIcon, placeholder: 'Cole o link/URL da imagem aqui...' },
};

interface BlockPreset {
  id: string;
  label: string;
  hint: string;
  icon: any;
  create: () => any[];
}

const newId = (offset = 0) => `${Date.now() + offset}-${Math.random().toString(36).slice(2, 7)}`;

const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: 'paragraph',
    label: 'Parágrafo',
    hint: 'Bloco de texto corrido',
    icon: FileText,
    create: () => [{ id: newId(), type: 'paragraph', content: '', cols: GRID_COLS, rows: 'auto' }],
  },
  {
    id: 'highlight',
    label: 'Frase de destaque',
    hint: 'Citação em evidência',
    icon: Quote,
    create: () => [{ id: newId(), type: 'paragraph', highlight: true, content: '', cols: GRID_COLS, rows: 'auto' }],
  },
  {
    id: 'image-1',
    label: 'Imagem única',
    hint: 'Largura total',
    icon: ImageIcon,
    create: () => [{ id: newId(), type: 'image', content: '', caption: '', cols: GRID_COLS, rows: 2 }],
  },
  {
    id: 'image-2',
    label: 'Duas imagens',
    hint: 'Lado a lado, iguais',
    icon: Columns2,
    create: () => [
      { id: newId(0), type: 'image', content: '', caption: '', cols: 3, rows: 2, preventGallery: true },
      { id: newId(1), type: 'image', content: '', caption: '', cols: 3, rows: 2, preventGallery: true },
    ],
  },
  {
    id: 'image-3',
    label: 'Três imagens',
    hint: 'Fileira de três',
    icon: Images,
    create: () => [
      { id: newId(0), type: 'image', content: '', caption: '', cols: 2, rows: 2, preventGallery: true },
      { id: newId(1), type: 'image', content: '', caption: '', cols: 2, rows: 2, preventGallery: true },
      { id: newId(2), type: 'image', content: '', caption: '', cols: 2, rows: 2, preventGallery: true },
    ],
  },
  {
    id: 'image-text',
    label: 'Imagem com texto',
    hint: 'Imagem + texto lateral',
    icon: Rows3,
    create: () => [
      { id: newId(0), type: 'image', content: '', caption: '', cols: 3, rows: 2, preventGallery: true },
      { id: newId(1), type: 'paragraph', content: '', cols: 3, rows: 2 },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Utilidades
 * ------------------------------------------------------------------ */

/** Converte módulos legados (grade de 3 colunas) para a grade de 6 colunas. */
function migrateModules(modules: any[]): any[] {
  return (modules || []).map((module) => {
    const cols = Number(module.cols) || 3;
    const migrated = cols <= 3 ? cols * 2 : cols;
    return { ...module, cols: Math.max(1, Math.min(GRID_COLS, migrated)) };
  });
}

function formatDateBr(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

interface MetadataLineProps {
  category: string;
  responsible: string;
  activityDate: string;
}

/**
 * Linha de metadados: `CATEGORIA • Responsável • dd/mm/aaaa`.
 * Renderizada em SVG para manter alinhamento vertical idêntico no PDF.
 */
function MetadataLine({ category, responsible, activityDate }: MetadataLineProps) {
  const categoryLabel = category && CATEGORY_LABELS[category] ? CATEGORY_LABELS[category].toUpperCase() : '';
  const parts = [responsible?.trim(), formatDateBr(activityDate)].filter(Boolean);
  const infoLabel = parts.length ? parts.join(' • ') : 'Responsável • Data';
  const badgeWidth = categoryLabel ? Math.max(78, categoryLabel.length * 8 + 24) : 0;
  const dotX = badgeWidth + 12;
  const infoX = categoryLabel ? badgeWidth + 26 : 0;

  return (
    <svg
      width="100%"
      height="22"
      className="block overflow-visible"
      role="img"
      aria-label={categoryLabel ? `${categoryLabel} • ${infoLabel}` : infoLabel}
    >
      <title>{categoryLabel ? `${categoryLabel} • ${infoLabel}` : infoLabel}</title>
      {categoryLabel && (
        <>
          <rect x="0" y="0" width={badgeWidth} height="22" rx="11" fill="#81E2CF" />
          <text
            x={badgeWidth / 2}
            y="11"
            textAnchor="middle"
            dominantBaseline="middle"
            alignmentBaseline="middle"
            fill="#1F211F"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.3px' }}
          >
            {categoryLabel}
          </text>
          <text
            x={dotX}
            y="11"
            dominantBaseline="middle"
            alignmentBaseline="middle"
            fill="#CBD5E1"
            style={{ fontFamily: 'Poppins, system-ui, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.3px' }}
          >
            •
          </text>
        </>
      )}
      <text
        x={infoX}
        y="11"
        dominantBaseline="middle"
        alignmentBaseline="middle"
        fill="#64748B"
        style={{ fontFamily: 'Poppins, system-ui, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.3px' }}
      >
        {infoLabel}
      </text>
    </svg>
  );
}

function CarouselGallery({ items, isGeneratingPdf, heightStyle }: { items: any[]; isGeneratingPdf: boolean; heightStyle?: React.CSSProperties }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));

  const finalHeightStyle = {
    ...heightStyle,
    height: isGeneratingPdf ? heightStyle?.height : '100%',
    minHeight: !isGeneratingPdf ? '100%' : heightStyle?.height === 'auto' ? '400px' : '0px',
  };

  const activeCaption = items[currentIndex]?.caption;
  const firstCaption = items[0]?.caption;

  return (
    <div className="w-full h-full flex flex-col">
      {!isGeneratingPdf && (
        <div
          className={`relative w-full rounded-xl overflow-hidden shadow-md group bg-muted ${activeCaption ? 'flex-1 min-h-0' : 'h-full'}`}
          style={finalHeightStyle}
        >
          {items.map((item, idx) => (
            <img
              key={item.id}
              src={item.content}
              alt=""
              className={`w-full h-full object-cover transition-opacity duration-500 ${idx === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              style={{ minHeight: heightStyle?.height === 'auto' ? '400px' : '0px' }}
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
      {!isGeneratingPdf && activeCaption && (
        <p className="px-2 py-1.5 text-[11px] leading-snug text-slate-600 italic text-center flex-shrink-0">{activeCaption}</p>
      )}

      {isGeneratingPdf && (
        <div className={`relative w-full rounded-xl overflow-hidden shadow-md bg-muted ${firstCaption ? 'flex-1 min-h-0' : 'h-full'}`} style={finalHeightStyle}>
          <img
            src={items[0]?.content}
            alt=""
            className="w-full h-full object-cover"
            style={{ minHeight: heightStyle?.height === 'auto' ? '400px' : '0px' }}
            onError={(e: any) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/800x400/eeeeee/999999?text=Imagem+N%C3%A3o+Encontrada';
            }}
          />
        </div>
      )}
      {isGeneratingPdf && firstCaption && (
        <p className="px-2 py-1.5 text-[11px] leading-snug text-slate-600 italic text-center flex-shrink-0">{firstCaption}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Seção sanfonada do editor
 * ------------------------------------------------------------------ */

interface EditorSectionProps {
  step: number;
  title: string;
  icon: any;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function EditorSection({ step, title, icon: Icon, badge, open, onToggle, children }: EditorSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-background overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3 py-3 text-left hover:bg-muted/40 transition-colors min-h-[44px]"
      >
        <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <Icon size={14} className="text-muted-foreground flex-shrink-0" />
        <span className="text-[12px] font-bold uppercase tracking-wider text-foreground flex-1 truncate">{title}</span>
        {badge}
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-4 pt-1 space-y-3 border-t border-border/60">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Página
 * ------------------------------------------------------------------ */

export default function NewsGeneratorPage() {
  const [headerData, setHeaderData] = useState({
    unitId: 'ana-dic',
    category: 'educacao',
    responsible: 'Equipe de Jornalismo',
    activityDate: '',
    title: 'Olimpíadas de Matemática: Alunos se destacam',
    subtitle: 'Escola conquista três medalhas de ouro na etapa regional.',
  });

  const [modules, setModules] = useState<any[]>(() =>
    migrateModules([
      { id: '4', type: 'paragraph', content: 'Nesta última semana, nossos alunos do 9º ano participaram da edição regional da Olimpíada de Matemática, trazendo **resultados históricos** para a nossa instituição. Abaixo conferimos os registros deste momento único!', cols: 3, rows: 'auto' },
      { id: '5', type: 'image', content: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', cols: 1, rows: 1 },
      { id: '6', type: 'image', content: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', cols: 1, rows: 1 },
      { id: '7', type: 'image', content: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80', cols: 1, rows: 1 },
    ]),
  );

  const { isAdmin, unit: profileUnit, delegatedUnits, loading: roleLoading } = useUserRole();
  const {
    bulletins,
    saving,
    savedAt: remoteSavedAt,
    currentId,
    setCurrent,
    persist,
    remove,
    duplicate,
  } = useNewsBulletins();

  /** Unidades que o usuário pode usar. Admin geral escolhe livremente. */
  const allowedUnits = useMemo(() => {
    if (isAdmin) return null; // sem restrição
    const raw = [profileUnit, ...(delegatedUnits || [])].filter(Boolean) as string[];
    const resolved = raw.map((value) => newsUnitForProfileUnit(value)).filter(Boolean) as any[];
    return resolved;
  }, [isAdmin, profileUnit, delegatedUnits]);

  const unitLocked = !isAdmin && !!allowedUnits && allowedUnits.length <= 1;

  const [openSection, setOpenSection] = useState<number>(1);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [resizingModuleId, setResizingModuleId] = useState<string | null>(null);
  const [resizingTargetCols, setResizingTargetCols] = useState<number | null>(null);
  const [resizingTargetRows, setResizingTargetRows] = useState<number | null>(null);

  const [dragItem, setDragItem] = useState<any>(null);
  const [dropIndicator, setDropIndicator] = useState<any>(null);
  const [isGeneratingPdf] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [fillPercent, setFillPercent] = useState(0);

  const previewRef = useRef<HTMLElement | null>(null);

  /* ---------------- Vínculo de unidade ---------------- */

  useEffect(() => {
    if (roleLoading || isAdmin || !allowedUnits) return;
    if (allowedUnits.length === 0) return;
    const allowedIds = allowedUnits.map((u) => u.id);
    if (!allowedIds.includes(headerData.unitId)) {
      setHeaderData((prev) => ({ ...prev, unitId: allowedUnits[0].id }));
    }
  }, [roleLoading, isAdmin, allowedUnits, headerData.unitId]);

  /* ---------------- Rascunho local ---------------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.headerData) {
        setHeaderData((prev) => ({
          ...prev,
          ...parsed.headerData,
          category: normalizeCategory(parsed.headerData.category),
        }));
      }
      if (Array.isArray(parsed?.modules)) setModules(migrateModules(parsed.modules));
    } catch {
      /* rascunho corrompido é ignorado */
    }
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ headerData, modules }));
      setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      /* quota excedida — ignorado silenciosamente */
    }
  }, [headerData, modules]);

  /** Persiste no banco, vinculando sempre à unidade autorizada do usuário. */
  const persistBulletin = useCallback(async () => {
    const targetUnitId = headerData.unitId;
    const targetProfileUnit = profileUnitForNewsUnit(targetUnitId);
    if (!targetProfileUnit) return;
    await persist({
      unitId: targetUnitId,
      profileUnit: targetProfileUnit,
      title: headerData.title,
      category: headerData.category,
      headerData,
      modules,
    });
  }, [headerData, modules, persist]);

  /* ---------------- Autosave (2s após parar de digitar) ---------------- */

  const autosaveReady = useRef(false);

  useEffect(() => {
    if (roleLoading) return;
    if (!autosaveReady.current) {
      // Evita gravar o conteúdo de exemplo assim que a página monta.
      autosaveReady.current = true;
      return;
    }
    const timer = setTimeout(() => {
      saveDraft();
      persistBulletin();
    }, 2000);
    return () => clearTimeout(timer);
  }, [headerData, modules, roleLoading, saveDraft, persistBulletin]);

  /* ---------------- Responsividade ---------------- */

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      setSidebarWidth(Math.max(340, Math.min(1200, e.clientX)));
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

  /* ---------------- Indicador de ocupação da folha ---------------- */

  useEffect(() => {
    const element = previewRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      const pageHeight = (width * 297) / 210;
      const contentHeight = element.scrollHeight;
      setFillPercent(Math.round((contentHeight / pageHeight) * 100));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const timer = window.setTimeout(measure, 300);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [modules, headerData, windowWidth]);

  const pageCount = Math.max(1, Math.ceil(fillPercent / 100));

  /* ---------------- Blocos ---------------- */

  const handleNewArticle = () => setShowClearModal(true);

  const addPreset = (preset: BlockPreset) => {
    setModules((prev) => normalizeModules([...prev, ...preset.create()]));
    setShowAddMenu(false);
    setOpenSection(2);
  };

  const removeModule = (id: string) => setModules((prev) => normalizeModules(prev.filter((m) => m.id !== id)));

  const duplicateModule = (id: string) => {
    setModules((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      if (index === -1) return prev;
      const copy = { ...prev[index], id: newId() };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return normalizeModules(next);
    });
  };

  const moveModule = (id: string, direction: -1 | 1) => {
    setModules((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeModules(next);
    });
  };

  const patchModule = (id: string, updates: Record<string, any>) =>
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));

  const updateContent = (id: string, newContent: string) => patchModule(id, { content: newContent });

  const ungroupGallery = (id: string) =>
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, preventGallery: !m.preventGallery } : m)));

  const insertBold = (id: string) => {
    const textarea = document.getElementById(`textarea-${id}`) as HTMLTextAreaElement | null;
    if (!textarea) return;
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
  };

  const getMaxCharacters = () => 600;

  const calculateFontSize = (text: string, cols: number, rows: number | 'auto') => {
    if (rows === 'auto' || !text) return '18px';
    const charCount = Math.max(text.length, 1);
    const w = (cols || GRID_COLS) * 135 - 24;
    const h = (rows as number) * ROW_HEIGHT - 24;
    const s = Math.sqrt((w * h) / (charCount * 0.92));
    return `${Math.max(12, Math.min(24, s))}px`;
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

  const confirmNewArticle = async () => {
    // Antes de limpar, guarda o informativo atual para não perder o trabalho feito.
    const hasContent = Boolean(headerData.title?.trim()) || modules.length > 0;
    if (hasContent) {
      try {
        await persistBulletin();
      } catch {
        /* falha ao salvar não deve travar a criação do novo informativo */
      }
    }
    setHeaderData({
      unitId: headerData.unitId,
      category: '',
      responsible: '',
      activityDate: '',
      title: '',
      subtitle: '',
    });
    setModules([]);
    setShowClearModal(false);
    setOpenSection(1);
    setCurrent(null);
    localStorage.removeItem(DRAFT_KEY);
  };


  /** Abre um informativo salvo da unidade no editor. */
  const openBulletin = (bulletin: any) => {
    const stored = bulletin.header_data || {};
    setHeaderData({
      unitId: bulletin.unit_id,
      category: normalizeCategory(stored.category ?? bulletin.category),
      responsible: stored.responsible ?? '',
      activityDate: stored.activityDate ?? '',
      title: stored.title ?? bulletin.title ?? '',
      subtitle: stored.subtitle ?? '',
    });
    setModules(migrateModules(Array.isArray(bulletin.blocks) ? bulletin.blocks : []));
    setCurrent(bulletin.id);
    setOpenSection(1);
  };

  const updateModuleGrid = (id: string, updates: { cols?: number; rows?: number | 'auto' }) => {
    setModules((prevModules) => normalizeModules(prevModules.map((m) => (m.id === id ? { ...m, ...updates } : m))));
  };

  /** Garante que cada linha da grade some exatamente GRID_COLS. */
  const normalizeModules = (list: any[]) => {
    const result = list.map((m) => ({ ...m }));

    let currentRowCols = 0;
    let currentRowIndices: number[] = [];

    for (let i = 0; i < result.length; i++) {
      const cols = Math.max(1, Math.min(GRID_COLS, result[i].cols || GRID_COLS));
      result[i].cols = cols;

      if (currentRowCols + cols > GRID_COLS) {
        if (currentRowIndices.length > 0 && currentRowCols < GRID_COLS) {
          const lastIdx = currentRowIndices[currentRowIndices.length - 1];
          result[lastIdx].cols = GRID_COLS - (currentRowCols - result[lastIdx].cols);
        }
        currentRowCols = cols;
        currentRowIndices = [i];
      } else {
        currentRowCols += cols;
        currentRowIndices.push(i);
      }
    }

    if (currentRowCols > 0 && currentRowCols < GRID_COLS && result.length > 0) {
      const lastIdx = result.length - 1;
      result[lastIdx].cols = GRID_COLS - (currentRowCols - result[lastIdx].cols);
    }

    return result;
  };

  const getSidebarWidthClass = (cols: number) => {
    const ratio = (cols || GRID_COLS) / GRID_COLS;
    if (ratio >= 1) return 'w-full flex-none';
    if (ratio > 0.5) return 'w-full grow basis-[calc(66.66%-8px)]';
    if (ratio > 0.34) return 'w-full grow basis-[calc(50%-8px)]';
    return 'w-full grow basis-[calc(33.33%-8px)]';
  };

  const getHeightStyle = (rows: number | 'auto', isPdf = false): React.CSSProperties => {
    if (rows === 'auto') return { height: 'auto' };
    const baseHeight = isPdf ? 180 : ROW_HEIGHT;
    return { height: `${(rows as number) * baseHeight}px`, overflow: 'hidden' };
  };

  /* ---------------- Drag & drop ---------------- */

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
    if (x < rect.width * 0.3) position = 'left';
    else if (x > rect.width * 0.7) position = 'right';
    else if (y < rect.height * 0.5) position = 'top';
    else position = 'bottom';

    if (dropIndicator?.id !== targetId || dropIndicator?.position !== position) {
      setDropIndicator({ id: targetId, position });
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem) return;
    if (dropIndicator?.id !== 'container') setDropIndicator({ id: 'container', position: 'bottom' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragItem || !dropIndicator) {
      handleDragEnd();
      return;
    }

    const found = modules.find((m) => m.id === dragItem.id);
    if (!found) {
      handleDragEnd();
      return;
    }
    const newItem: any = { ...found };

    const newModules = modules.map((m) => ({ ...m })).filter((m) => m.id !== newItem.id);

    if (dropIndicator.id === 'container') {
      newItem.cols = GRID_COLS;
      newModules.push(newItem);
    } else {
      let targetIndex = newModules.findIndex((m) => m.id === dropIndicator.id);
      if (targetIndex !== -1) {
        if (dropIndicator.position === 'left' || dropIndicator.position === 'right') {
          const target = newModules[targetIndex];
          const half = Math.max(1, Math.floor((target.cols || GRID_COLS) / 2));
          newItem.cols = half;
          target.cols = Math.max(1, (target.cols || GRID_COLS) - half);
          if (dropIndicator.position === 'left') newModules.splice(targetIndex, 0, newItem);
          else newModules.splice(targetIndex + 1, 0, newItem);
        } else {
          newItem.cols = GRID_COLS;
          if (dropIndicator.position === 'bottom') targetIndex += 1;
          newModules.splice(targetIndex, 0, newItem);
        }
      } else {
        newItem.cols = GRID_COLS;
        newModules.push(newItem);
      }
    }

    setModules(normalizeModules(newModules));
    handleDragEnd();
  };

  /* ---------------- Exportação ---------------- */

  const getPdfFileName = () => `${(headerData.title || 'noticia').replace(/[^\w\-]+/g, '_')}.pdf`;

  const waitForPreviewAssets = async (element: HTMLElement) => {
    await document.fonts?.ready;
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }),
    );
  };

  const waitForExportLayout = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  /** Última linha de pixel com conteúdo real (evita páginas em branco no fim). */
  const getCanvasContentHeight = (canvas: HTMLCanvasElement, minimumHeight: number) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return canvas.height;

    const { width, height } = canvas;
    const imageData = context.getImageData(0, 0, width, height).data;

    for (let y = height - 1; y >= 0; y -= 1) {
      for (let x = 0; x < width; x += 8) {
        const index = (y * width + x) * 4;
        const alpha = imageData[index + 3];
        const red = imageData[index];
        const green = imageData[index + 1];
        const blue = imageData[index + 2];

        // #F0EEE4 é o fundo do papel; qualquer pixel mais escuro conta como conteúdo.
        if (alpha > 0 && (red < 238 || green < 236 || blue < 226)) {
          return Math.min(height, Math.max(minimumHeight, y + 24));
        }
      }
    }

    return Math.min(height, minimumHeight);
  };

  const PAPER_HEX = '#F0EEE4';
  const FOOTER_STRIPES = ['#F5DFBC', '#FBCE00', '#F37964', '#81E2CF', '#01ADFF'];
  const FOOTER_MM = 4.5;
  const FOOTER_GAP_MM = 6;

  const drawFooterBar = (pdf: jsPDF, pageWidthMm: number, pageHeightMm: number) => {
    const stripeWidth = pageWidthMm / FOOTER_STRIPES.length;
    FOOTER_STRIPES.forEach((hex, index) => {
      pdf.setFillColor(hex);
      // +0.2mm de sobreposição evita linhas brancas entre as faixas na impressão.
      pdf.rect(index * stripeWidth, pageHeightMm - FOOTER_MM, stripeWidth + 0.2, FOOTER_MM, 'F');
    });
  };

  /**
   * Gera o PDF exatamente como o preview. Quando o conteúdo ultrapassa a folha,
   * cria automaticamente as páginas seguintes (decisão #7), cada uma com a barra
   * institucional ancorada no rodapé.
   */
  const createPreviewPdf = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) throw new Error('Preview não encontrado para gerar o PDF.');
    const previewWidth = Math.ceil(element.getBoundingClientRect().width);
    const previewPageHeight = Math.ceil((previewWidth * 297) / 210);

    await waitForPreviewAssets(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: PAPER_HEX,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      onclone: (clonedDocument) => {
        const clonedElement = clonedDocument.getElementById('pdf-content');
        const exportStyle = clonedDocument.createElement('style');
        exportStyle.textContent = `
          [data-pdf-helper="true"] { display: none !important; }
          /* A barra institucional é desenhada pelo jsPDF em cada página. */
          [data-news-footer="true"] { display: none !important; }
          #pdf-content.pdf-export-mode {
            box-shadow: none !important;
            position: relative !important;
            min-height: ${previewPageHeight}px !important;
            overflow: visible !important;
            background: ${PAPER_HEX} !important;
          }
          #pdf-content.pdf-export-mode .grid-background { background-image: none !important; }
          #pdf-content.pdf-export-mode .page-ruler-bg { background-image: none !important; }
          #pdf-content.pdf-export-mode .grid-container-modern,
          #pdf-content.pdf-export-mode .grid-container-modern * {
            border-color: transparent !important;
            box-shadow: none !important;
          }
          #pdf-content.pdf-export-mode .grid-container-modern { background: transparent !important; }
        `;

        clonedDocument.head.appendChild(exportStyle);
        if (clonedElement) {
          clonedElement.classList.add('pdf-export-mode');
          clonedElement.style.width = `${previewWidth}px`;
          clonedElement.style.maxWidth = `${previewWidth}px`;
          clonedElement.style.minWidth = `${previewWidth}px`;
        }
      },
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidthMm = 210;
    const pageHeightMm = 297;

    const pxPerMm = canvas.width / pageWidthMm;
    const usableHeightMm = pageHeightMm - FOOTER_MM - FOOTER_GAP_MM;
    const pageSlicePx = Math.max(1, Math.floor(usableHeightMm * pxPerMm));

    const totalContentPx = getCanvasContentHeight(canvas, Math.min(canvas.height, pageSlicePx));
    const totalPages = Math.max(1, Math.ceil(totalContentPx / pageSlicePx));

    for (let page = 0; page < totalPages; page += 1) {
      if (page > 0) pdf.addPage();

      pdf.setFillColor(PAPER_HEX);
      pdf.rect(0, 0, pageWidthMm, pageHeightMm, 'F');

      const sourceY = page * pageSlicePx;
      const sourceHeight = Math.min(pageSlicePx, totalContentPx - sourceY);
      if (sourceHeight > 0) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceHeight;
        const context = sliceCanvas.getContext('2d');
        if (!context) throw new Error('Não foi possível preparar a página do PDF.');

        context.fillStyle = PAPER_HEX;
        context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        pdf.addImage(
          sliceCanvas.toDataURL('image/jpeg', 0.98),
          'JPEG',
          0,
          0,
          pageWidthMm,
          sourceHeight / pxPerMm,
        );
      }

      drawFooterBar(pdf, pageWidthMm, pageHeightMm);
    }

    return pdf;
  };

  const handlePrint = async () => {
    try {
      setPdfError(false);
      setIsExportingPdf(true);
      await waitForExportLayout();
      const pdf = await createPreviewPdf();
      pdf.save(getPdfFileName());
    } catch (error) {
      console.error('Falha ao gerar PDF:', error);
      setPdfError(true);
      setTimeout(() => setPdfError(false), 7000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenDoc = async () => {
    try {
      setPdfError(false);
      setIsExportingPdf(true);
      await waitForExportLayout();
      const pdf = await createPreviewPdf();
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const previewWin = window.open(url, '_blank', 'noopener,noreferrer');

      if (!previewWin) {
        const a = document.createElement('a');
        a.href = url;
        a.download = getPdfFileName();
        a.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Falha ao abrir PDF:', error);
      setPdfError(true);
      setTimeout(() => setPdfError(false), 7000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  /* ---------------- Agrupamento de galeria ---------------- */

  const finalRenderModules = useMemo(() => {
    const renderModules: any[] = [];
    let currentGalleryGroup: any = null;

    modules.forEach((module) => {
      if (!module.content && module.type !== 'image') return;

      if (module.type === 'image' && module.cols === GRID_COLS && module.content && !module.preventGallery) {
        if (!currentGalleryGroup) {
          currentGalleryGroup = { id: `gallery-${module.id}`, type: 'gallery', cols: GRID_COLS, rows: module.rows, items: [module] };
          renderModules.push(currentGalleryGroup);
        } else {
          currentGalleryGroup.items.push(module);
          if (module.rows !== 'auto') currentGalleryGroup.rows = module.rows;
        }
      } else {
        currentGalleryGroup = null;
        if (module.content || module.type === 'image') renderModules.push(module);
      }
    });

    return renderModules.map((m) => (m.type === 'gallery' && m.items.length === 1 ? m.items[0] : m));
  }, [modules]);

  const imageModules = modules.filter((m) => m.type === 'image');
  const editingImage = modules.find((m) => m.id === editingImageId) || null;
  const unitName = newsUnitName(headerData.unitId);

  const fillTone =
    fillPercent > 100
      ? { text: 'text-destructive', bg: 'bg-destructive', ring: 'border-destructive/40 bg-destructive/5' }
      : fillPercent > 90
        ? { text: 'text-warning', bg: 'bg-warning', ring: 'border-warning/40 bg-warning/5' }
        : { text: 'text-success', bg: 'bg-success', ring: 'border-success/40 bg-success/5' };

  /* ---------------- Preview (compartilhado com o modal mobile) ---------------- */

  const previewArticle = (
    <article
      id="pdf-content"
      ref={previewRef as any}
      className={`bg-news-paper mx-auto w-full max-w-[210mm] min-h-[297mm] p-6 md:p-12 shadow-2xl rounded-none text-slate-800 overflow-hidden
        ${isGeneratingPdf ? 'shadow-none' : 'page-ruler-bg print:shadow-none print:p-0 print:max-w-none print:w-full print:bg-none'}
      `}
      onDragOver={handleContainerDragOver}
      onDrop={handleDrop}
    >
      <div data-pdf-helper="true" className="border-b-4 border-primary pb-4 mb-8 print:hidden">
        <span className="text-xs font-bold uppercase tracking-widest text-primary flex justify-between items-center gap-2">
          <span>Pré-visualização</span>
          <span className="text-slate-400 font-normal normal-case opacity-70 border border-slate-300 px-2 py-0.5 rounded text-[10px]">
            A linha cinza indica quebra de página A4
          </span>
        </span>
      </div>

      <InstitutionalHeader />

      <div className="w-full flex items-center justify-between gap-3 -mt-4 mb-6 avoid-break">
        <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 truncate">
          {unitName || 'Unidade não definida'}
        </span>
        <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 flex-shrink-0">
          {INSTITUTIONAL_DOCUMENT_LABEL}
        </span>
      </div>

      <div className="w-full mb-8 avoid-break clear-both">
        <div className="border-t border-b border-slate-200 py-2 mb-4">
          <MetadataLine
            category={headerData.category}
            responsible={headerData.responsible}
            activityDate={headerData.activityDate}
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4 break-words">
          {headerData.title || 'Título não definido'}
        </h1>
        <h2 className="text-xl md:text-2xl font-medium text-slate-600 leading-snug break-words">
          {headerData.subtitle || 'Subtítulo não definido'}
        </h2>
      </div>

      {modules.length === 0 && (
        <div data-pdf-helper="true" className="text-center py-20 text-slate-400 print:hidden flex flex-col items-center border-2 border-dashed border-slate-200 rounded-xl mx-4">
          <AlertCircle size={40} className="mb-3 opacity-20" />
          <p>O corpo da notícia está vazio.</p>
          <p className="text-sm mt-2">Use “Adicionar conteúdo” no editor para começar.</p>
        </div>
      )}

      <div className="grid-container-modern auto-rows-[150px] w-full relative min-h-[600px] grid-background rounded-xl border-2 border-primary/5 bg-slate-50/30 group/grid">
        {finalRenderModules.map((module) => {
          const dragId = module.type === 'gallery' ? module.items?.[0]?.id || module.id : module.id;
          const isDraggingThis = dragItem?.id === dragId;
          const isTarget = dropIndicator?.id === dragId;
          const heightStyle = getHeightStyle(module.rows, false);

          const gridStyle: React.CSSProperties = {
            gridColumn: `span ${module.cols || GRID_COLS}`,
            gridRow: module.rows !== 'auto' ? `span ${module.rows}` : 'span 1',
            height: '100%',
            minHeight: module.rows !== 'auto' ? `${module.rows * ROW_HEIGHT}px` : `${ROW_HEIGHT}px`,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
          };

          let contentRender: React.ReactNode = null;
          switch (module.type) {
            case 'paragraph':
              contentRender = module.highlight ? (
                <blockquote className="w-full h-full flex items-center border-l-4 border-primary pl-4 pr-2">
                  <span className="text-slate-700 italic text-lg md:text-xl leading-snug">
                    {module.content.split('\n').map((line: string, i: number) => (
                      <React.Fragment key={i}>
                        {renderFormattedText(line)}
                        {i < module.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </span>
                </blockquote>
              ) : (
                <div className="w-full h-full flex flex-col justify-center overflow-hidden">
                  <div
                    className="text-slate-700 w-full h-full flex items-center"
                    style={{
                      fontSize: calculateFontSize(module.content, module.cols, module.rows),
                      textAlign: 'justify',
                      textAlignLast: 'left',
                      hyphens: 'none',
                      wordBreak: 'normal',
                      overflowWrap: 'anywhere',
                      lineHeight: '1.3',
                      transition: 'font-size 0.3s ease-out',
                    }}
                  >
                    <span className="w-full">
                      {module.content.split('\n').map((line: string, i: number) => (
                        <React.Fragment key={i}>
                          {renderFormattedText(line)}
                          {i < module.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                </div>
              );
              break;
            case 'image':
              contentRender = (
                <figure className="flex flex-col w-full h-full m-0 overflow-hidden rounded-xl shadow-md bg-muted/20 pointer-events-none">
                  <img
                    src={module.content}
                    alt={module.caption || 'Imagem da notícia'}
                    className={`w-full ${module.caption ? 'flex-1 min-h-0' : 'h-full'} object-cover pointer-events-none rounded-lg`}
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/800x400/eeeeee/999999?text=Imagem+N%C3%A3o+Encontrada';
                    }}
                  />
                  {module.caption && (
                    <figcaption className="px-2 py-1.5 text-[11px] leading-snug text-slate-600 italic text-center flex-shrink-0">
                      {module.caption}
                    </figcaption>
                  )}
                </figure>
              );
              break;
            case 'gallery':
              contentRender = (
                <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                  <CarouselGallery items={module.items} isGeneratingPdf={isGeneratingPdf} heightStyle={heightStyle} />
                </div>
              );
              break;
            default:
              return null;
          }

          return (
            <div
              key={module.id}
              style={gridStyle}
              className={`${module.type === 'paragraph' ? '' : 'avoid-break'} flex flex-col relative z-10 transition-all duration-200 group/module ${isDraggingThis ? 'opacity-30' : ''}`}
            >
              <div data-pdf-helper="true" className="absolute inset-0 border-2 border-transparent group-hover/module:border-primary/30 rounded-xl transition-all pointer-events-none z-20" />
              {isTarget && (
                <div
                  data-pdf-helper="true"
                  className={`absolute pointer-events-none bg-primary/20 z-10
                    ${dropIndicator.position === 'left' ? 'top-0 left-0 bottom-0 w-1/2 border-l-4 border-primary' : ''}
                    ${dropIndicator.position === 'right' ? 'top-0 right-0 bottom-0 w-1/2 border-r-4 border-primary' : ''}
                    ${dropIndicator.position === 'top' ? 'top-0 left-0 right-0 h-1/2 border-t-4 border-primary' : ''}
                    ${dropIndicator.position === 'bottom' ? 'bottom-0 left-0 right-0 h-1/2 border-b-4 border-primary' : ''}
                  `}
                />
              )}

              {resizingModuleId && resizingModuleId !== module.id && (
                <div data-pdf-helper="true" className="absolute inset-0 border-4 border-destructive/40 bg-destructive/5 z-[40] animate-pulse pointer-events-none rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-destructive opacity-40" size={32} />
                </div>
              )}

              <div
                draggable
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
                onDoubleClick={() => {
                  if (module.type === 'image') {
                    setEditingImageId(module.id);
                    setOpenSection(3);
                  }
                }}
                className="flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing h-full w-full overflow-hidden rounded-xl bg-white shadow-sm group-hover/module:shadow-md transition-shadow module-content-wrapper"
              >
                {contentRender}
              </div>

              {/* Resizers */}
              <div
                data-pdf-helper="true"
                className="absolute -right-3 top-0 bottom-0 w-6 cursor-col-resize z-[100] opacity-0 group-hover/module:opacity-100 transition-all flex items-center justify-center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResizingModuleId(module.id);
                  const startX = e.clientX;
                  const startCols = module.cols || 1;
                  const gridEl = document.querySelector('.grid-container-modern');
                  if (!gridEl) return;

                  const calculatedColWidth = gridEl.clientWidth / GRID_COLS;

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    moveEvent.preventDefault();
                    const deltaX = moveEvent.clientX - startX;
                    const nextCols = Math.max(1, Math.min(GRID_COLS, startCols + Math.round(deltaX / calculatedColWidth)));
                    if (nextCols !== resizingTargetCols) {
                      setResizingTargetCols(nextCols);
                      updateModuleGrid(module.id, { cols: nextCols });
                    }
                  };
                  const onMouseUp = () => {
                    setResizingModuleId(null);
                    setResizingTargetCols(null);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.style.cursor = 'default';
                  };
                  document.body.style.cursor = 'col-resize';
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="w-2 h-16 bg-primary/60 rounded-full hover:bg-primary transition-colors shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-white/20" />
              </div>
              <div
                data-pdf-helper="true"
                className="absolute -bottom-3 left-0 right-0 h-6 cursor-row-resize z-[100] opacity-0 group-hover/module:opacity-100 transition-all flex items-center justify-center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResizingModuleId(module.id);
                  const startY = e.clientY;
                  const startRows = module.rows === 'auto' ? 1 : module.rows;

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    moveEvent.preventDefault();
                    const deltaY = moveEvent.clientY - startY;
                    const nextRows = Math.max(1, Math.min(4, startRows + Math.round(deltaY / ROW_HEIGHT)));
                    if (nextRows !== resizingTargetRows) {
                      setResizingTargetRows(nextRows);
                      updateModuleGrid(module.id, { rows: nextRows as any });
                    }
                  };
                  const onMouseUp = () => {
                    setResizingModuleId(null);
                    setResizingTargetRows(null);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.style.cursor = 'default';
                  };
                  document.body.style.cursor = 'row-resize';
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="w-16 h-2 bg-primary/60 rounded-full hover:bg-primary transition-colors shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-white/20" />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 print:block w-full avoid-break clear-both">
        Documento gerado pelo Sistema Institucional de Jornalismo Escolar
      </footer>

      <InstitutionalFooterBar
        data-news-footer="true"
        className="-mx-6 md:-mx-12 -mb-6 md:-mb-12 mt-8 print:mx-0 print:mb-0"
      />
    </article>
  );

  return (
    <div className="relative flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-muted/30">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .grid-container-modern {
            grid-template-columns: repeat(${GRID_COLS}, 1fr) !important;
            gap: 10px !important;
            padding: 0 !important;
          }
          #pdf-content {
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: none !important;
          }
        }
        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .page-ruler-bg {
          background-image:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 297mm,
              hsl(var(--border)) 297mm,
              hsl(var(--border)) calc(297mm + 1px)
            );
        }
        .grid-background {
          background-image:
            linear-gradient(to right, hsl(var(--primary) / 0.05) 2px, transparent 2px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.05) 2px, transparent 2px);
          background-size: calc(100% / ${GRID_COLS}) ${ROW_HEIGHT}px;
        }
        .grid-container-modern {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 10px;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 768px) {
          .grid-container-modern {
            grid-template-columns: repeat(${GRID_COLS}, 1fr);
            gap: 10px;
            padding: 0;
          }
        }
        #pdf-content.pdf-export-mode .grid-container-modern { gap: 10px !important; }
        .module-content-wrapper {
          padding: 12px !important;
          box-sizing: border-box;
        }
        #pdf-content.pdf-export-mode {
          box-shadow: none !important;
          background: #F0EEE4 !important;
        }
      `}</style>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 top-16 bg-foreground/40 backdrop-blur-sm z-30 print:hidden"
        />
      )}

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
          ${sidebarOpen ? 'max-w-[90vw] translate-x-0' : '-translate-x-full lg:translate-x-0 lg:overflow-hidden lg:border-r-0'}
        `}
      >
        {sidebarOpen && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className="hidden lg:block absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-50 group"
            title="Arraste para redimensionar"
          >
            <div className="absolute inset-y-0 right-0 w-[1px] bg-border group-hover:bg-primary/50 group-hover:w-1 transition-all" />
          </div>
        )}

        <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-card to-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20 flex-shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">Editor Institucional</h2>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                {unitName || 'Selecione a unidade'}
              </p>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* ① Informações */}
          <EditorSection
            step={1}
            title="Informações"
            icon={Type}
            open={openSection === 1}
            onToggle={() => setOpenSection(openSection === 1 ? 0 : 1)}
          >
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Building2 size={12} /> Unidade
              </label>
              {isAdmin ? (
                <select
                  value={headerData.unitId}
                  onChange={(e) => setHeaderData({ ...headerData, unitId: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[44px]"
                >
                  <option value="">Selecione a unidade…</option>
                  {NEWS_UNIT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : unitLocked ? (
                <div className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-border rounded-lg bg-muted/50 text-foreground min-h-[44px]">
                  <Lock size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{unitName || 'Unidade não vinculada ao seu perfil'}</span>
                </div>
              ) : (
                <select
                  value={headerData.unitId}
                  onChange={(e) => setHeaderData({ ...headerData, unitId: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[44px]"
                >
                  {(allowedUnits || []).map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              )}
              {!isAdmin && (
                <p className="text-[10px] text-muted-foreground/80">
                  A unidade é definida pelo seu perfil de acesso e não pode ser alterada aqui.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Categoria</label>
                <select
                  value={headerData.category}
                  onChange={(e) => setHeaderData({ ...headerData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Data da atividade</label>
                <input
                  type="date"
                  value={headerData.activityDate}
                  onChange={(e) => setHeaderData({ ...headerData, activityDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Responsável</label>
              <input
                type="text"
                value={headerData.responsible}
                onChange={(e) => setHeaderData({ ...headerData, responsible: e.target.value })}
                placeholder="Ex.: Equipe de Jornalismo"
                className="w-full px-3 py-2 text-sm font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Título principal</label>
              <input
                type="text"
                value={headerData.title}
                onChange={(e) => setHeaderData({ ...headerData, title: e.target.value })}
                placeholder="Digite o título da notícia..."
                className="w-full px-3 py-2 text-base font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Subtítulo</label>
              <input
                type="text"
                value={headerData.subtitle}
                onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
                placeholder="Linha fina de apoio..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
              />
            </div>
          </EditorSection>

          {/* ② Conteúdo */}
          <EditorSection
            step={2}
            title="Conteúdo"
            icon={Layers}
            open={openSection === 2}
            onToggle={() => setOpenSection(openSection === 2 ? 0 : 2)}
            badge={
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {modules.length}
              </span>
            }
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddMenu((v) => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-semibold transition-all min-h-[44px]"
              >
                <Plus size={16} /> Adicionar conteúdo
              </button>

              {showAddMenu && (
                <div className="absolute z-30 mt-2 left-0 right-0 rounded-xl border border-border bg-popover shadow-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {BLOCK_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => addPreset(preset)}
                        className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted text-left transition-colors min-h-[44px]"
                      >
                        <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={15} className="text-primary" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-foreground truncate">{preset.label}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">{preset.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {modules.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <Layers size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum bloco ainda.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {modules.map((module, idx) => {
                const rule = MODULE_RULES[module.type];
                const Icon = module.highlight ? Quote : rule.icon;
                const isDraggingThis = dragItem?.id === module.id;
                const isTarget = dropIndicator?.id === module.id;
                const widthClass = getSidebarWidthClass(module.cols || GRID_COLS);
                const widthLabel = `${Math.round(((module.cols || GRID_COLS) / GRID_COLS) * 100)}%`;

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
                    {isTarget && <div className="absolute inset-0 bg-primary/10 border-2 border-primary z-10 pointer-events-none rounded-xl" />}

                    <div className="flex items-center justify-between gap-1 px-2.5 py-2 bg-muted/40 border-b border-border">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical size={14} className="text-muted-foreground/50 cursor-grab flex-shrink-0" />
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-primary/15 text-primary text-[10px] font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-foreground truncate">
                          {module.highlight ? 'Destaque' : rule.label}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/70 flex-shrink-0">{widthLabel}</span>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <button type="button" onClick={() => moveModule(module.id, -1)} disabled={idx === 0} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" title="Mover para cima">
                          <ChevronUp size={13} />
                        </button>
                        <button type="button" onClick={() => moveModule(module.id, 1)} disabled={idx === modules.length - 1} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" title="Mover para baixo">
                          <ChevronDown size={13} />
                        </button>
                        <button type="button" onClick={() => duplicateModule(module.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" title="Duplicar">
                          <Copy size={13} />
                        </button>
                        {module.type === 'image' && module.cols === GRID_COLS && (
                          <button
                            type="button"
                            onClick={() => ungroupGallery(module.id)}
                            className={`p-1.5 rounded-md transition-colors ${module.preventGallery ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'}`}
                            title={module.preventGallery ? 'Ativar agrupamento em carrossel' : 'Desativar agrupamento em carrossel'}
                          >
                            <Layers size={13} />
                          </button>
                        )}
                        <button type="button" onClick={() => removeModule(module.id)} className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors" title="Excluir">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {module.type === 'paragraph' ? (
                      <>
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/20 border-b border-border">
                          <button
                            type="button"
                            onClick={() => insertBold(module.id)}
                            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Aplicar negrito (selecione o texto)"
                          >
                            <Bold size={13} />
                          </button>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <textarea
                            id={`textarea-${module.id}`}
                            value={module.content}
                            maxLength={getMaxCharacters()}
                            onChange={(e) => updateContent(module.id, e.target.value)}
                            placeholder={module.highlight ? 'Digite a frase de destaque...' : rule.placeholder}
                            className="w-full flex-1 min-h-[110px] p-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y transition-all"
                          />
                          <div className="flex justify-end mt-1">
                            <span className={`text-[10px] font-bold ${module.content.length >= getMaxCharacters() ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                              {module.content.length} / {getMaxCharacters()}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingImageId(module.id); setOpenSection(3); }}
                        className="p-3 flex items-center gap-3 text-left hover:bg-muted/40 transition-colors min-h-[76px]"
                      >
                        <span className="h-14 w-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          {module.content ? (
                            <img src={module.content} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={18} className="text-muted-foreground/40" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-foreground">
                            {module.content ? 'Imagem definida' : 'Sem imagem'}
                          </span>
                          <span className="block text-[10px] text-muted-foreground truncate">
                            {module.caption || 'Sem legenda'}
                          </span>
                        </span>
                        <Pencil size={14} className="text-muted-foreground flex-shrink-0" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </EditorSection>

          {/* ③ Imagens */}
          <EditorSection
            step={3}
            title="Imagens"
            icon={ImageIcon}
            open={openSection === 3}
            onToggle={() => setOpenSection(openSection === 3 ? 0 : 3)}
            badge={
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {imageModules.length}
              </span>
            }
          >
            {imageModules.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhuma imagem no informativo ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {imageModules.map((module) => (
                  <button
                    type="button"
                    key={module.id}
                    onClick={() => setEditingImageId(module.id)}
                    className={`h-16 w-24 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-muted ${editingImageId === module.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                    title={module.caption || 'Editar imagem'}
                  >
                    {module.content ? (
                      <img src={module.content} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-muted-foreground/40" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/70">
              Clique numa miniatura para abrir o painel amplo de edição.
            </p>
          </EditorSection>

          {/* ④ Conferir e gerar */}
          <EditorSection
            step={4}
            title="Conferir e gerar"
            icon={CheckCircle2}
            open={openSection === 4}
            onToggle={() => setOpenSection(openSection === 4 ? 0 : 4)}
          >
            <div className={`rounded-xl border p-3 space-y-2 ${fillTone.ring}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ocupação da folha</span>
                <span className={`text-sm font-bold ${fillTone.text}`}>{fillPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${fillTone.bg} transition-all`} style={{ width: `${Math.min(100, fillPercent)}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {fillPercent > 100
                  ? `O conteúdo ultrapassou uma página — o PDF sairá em ${pageCount} páginas, com o rodapé institucional em cada uma.`
                  : fillPercent > 90
                    ? 'Resta pouco espaço nesta página.'
                    : 'O conteúdo cabe confortavelmente em uma página A4.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isExportingPdf}
                className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {isExportingPdf ? 'Gerando...' : 'Gerar PDF'}
              </button>
              <button
                type="button"
                onClick={handleOpenDoc}
                disabled={isExportingPdf}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-background font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <FileText size={16} /> Abrir
              </button>
              <button
                type="button"
                onClick={() => { saveDraft(); persistBulletin(); }}
                disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-background font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Salvar
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {saving
                ? 'Salvando…'
                : remoteSavedAt
                  ? `Salvo automaticamente às ${remoteSavedAt}.`
                  : savedAt
                    ? `Rascunho local salvo às ${savedAt}.`
                    : 'O rascunho é salvo automaticamente.'}
            </p>
          </EditorSection>

          {/* ⑤ Meus informativos */}
          <EditorSection
            step={5}
            title="Meus informativos"
            icon={FolderOpen}
            badge={
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {bulletins.length}
              </span>
            }
            open={openSection === 5}
            onToggle={() => setOpenSection(openSection === 5 ? 0 : 5)}
          >
            {bulletins.length === 0 ? (
              <p className="text-[11px] text-muted-foreground leading-snug">
                Nenhum informativo salvo ainda. Os rascunhos da sua unidade aparecem aqui automaticamente.
              </p>
            ) : (
              <ul className="space-y-2">
                {bulletins.map((bulletin) => (
                  <li
                    key={bulletin.id}
                    className={`rounded-lg border p-2.5 transition-colors ${bulletin.id === currentId ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/40'}`}
                  >
                    <button
                      type="button"
                      onClick={() => openBulletin(bulletin)}
                      className="w-full text-left"
                    >
                      <p className="text-[12px] font-semibold text-foreground truncate">{bulletin.title || 'Sem título'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {newsUnitName(bulletin.unit_id)} · atualizado em{' '}
                        {new Date(bulletin.updated_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </button>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => duplicate(bulletin)}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                      >
                        <Copy size={11} /> Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(bulletin.id)}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-border text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 size={11} /> Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </EditorSection>
        </div>

        <div className="p-4 bg-card border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleNewArticle}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-background hover:bg-destructive/5 text-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-xl font-semibold text-sm transition-all min-h-[44px]"
          >
            <PlusCircle size={16} />
            Novo informativo
          </button>
        </div>
      </aside>

      {/* PAINEL DE VISUALIZAÇÃO */}
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-10 bg-muted print:bg-white print:p-0 print:w-full print:h-auto print:block overflow-y-auto relative items-center">
        <div className="sticky md:absolute top-0 right-0 md:top-6 md:right-6 w-full md:w-auto flex flex-wrap justify-end gap-2 pb-4 md:pb-0 z-10 print:hidden">
          <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-xs font-semibold ${fillTone.text}`}>
            A4: {fillPercent}%{pageCount > 1 ? ` · ${pageCount} págs.` : ''}
          </span>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isExportingPdf}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
            {isExportingPdf ? 'Gerando...' : 'Salvar PDF'}
          </button>

          <button
            type="button"
            onClick={handleOpenDoc}
            disabled={isExportingPdf}
            className="bg-card text-foreground border border-border px-4 py-2 rounded-lg shadow-lg hover:bg-muted transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={18} />
            Abrir
          </button>

          {pdfError && (
            <div className="mt-2 absolute top-full right-0 bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-md shadow-sm border border-destructive/30 flex items-center gap-1 animate-pulse min-w-max">
              <AlertCircle size={14} />
              Erro ao gerar o PDF. Tente novamente.
            </div>
          )}
        </div>

        {previewArticle}
      </div>

      {/* Botão fixo de preview no mobile */}
      <button
        type="button"
        onClick={() => setShowMobilePreview(true)}
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-xl font-semibold text-sm flex items-center gap-2 print:hidden"
      >
        <Eye size={16} /> Visualizar informativo
      </button>

      {showMobilePreview && (
        <div className="lg:hidden fixed inset-0 z-50 bg-muted overflow-y-auto print:hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <span className="text-sm font-bold">Pré-visualização</span>
            <button type="button" onClick={() => setShowMobilePreview(false)} className="h-10 w-10 rounded-lg hover:bg-muted flex items-center justify-center">
              <X size={18} />
            </button>
          </div>
          <div className="p-3 text-center text-xs text-muted-foreground">
            A folha completa está no painel principal — feche para continuar editando.
          </div>
        </div>
      )}

      {/* Painel amplo de imagem */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 print:hidden">
          <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon size={16} className="text-primary flex-shrink-0" />
                <h3 className="text-sm font-bold truncate">Editar imagem</h3>
              </div>
              <button type="button" onClick={() => setEditingImageId(null)} className="h-10 w-10 rounded-lg hover:bg-muted flex items-center justify-center" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <ImageBlockField
                value={editingImage.content}
                onChange={(url) => patchModule(editingImage.id, { content: url })}
                placeholder={MODULE_RULES.image.placeholder}
              />

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 flex items-center justify-between mb-1">
                  <span>Legenda (opcional)</span>
                  <span className={`font-bold ${(editingImage.caption?.length || 0) >= 120 ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                    {editingImage.caption?.length || 0} / 120
                  </span>
                </label>
                <input
                  type="text"
                  value={editingImage.caption || ''}
                  maxLength={120}
                  onChange={(e) => patchModule(editingImage.id, { caption: e.target.value })}
                  placeholder="Ex.: Alunos recebem medalha na etapa regional."
                  className="w-full p-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all min-h-[44px]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { duplicateModule(editingImage.id); }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors min-h-[44px]"
                >
                  <Copy size={14} /> Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => { removeModule(editingImage.id); setEditingImageId(null); }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors min-h-[44px]"
                >
                  <Trash2 size={14} /> Remover bloco
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold">Criar novo informativo?</h3>
            </div>
            <p className="text-muted-foreground mb-8 text-base">
              Tem certeza que deseja começar um novo informativo? <br /><br />
              <strong className="text-foreground">Todo o conteúdo atual será apagado e a página ficará em branco.</strong>
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
