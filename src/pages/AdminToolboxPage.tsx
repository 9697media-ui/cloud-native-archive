import React, { useState, useEffect } from 'react';
import { Settings, Code, Eye, Copy, Check, MessageCircle, AlertTriangle, Monitor, Smartphone, Tablet, ShieldAlert, Lock, Terminal, Menu as MenuIcon, RefreshCw, Globe, LayoutDashboard, Save, FolderOpen, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { navItems } from '@/config/navigation';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


export default function AdminToolboxPage() {
  const { toast } = useToast();
  // Estado geral
  const [activeWidgetType, setActiveWidgetType] = useState('whatsapp');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' ou 'code'
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' ou 'mobile'
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const skipDraftRef = React.useRef(false);
  
  // Ref para controle de debounce na detecção de URL
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Resoluções "nativas" simuladas por dispositivo (a janela mantém a proporção,
  // mas o conteúdo é renderizado nessas dimensões e escalado para caber).
  const DEVICE_RESOLUTIONS: Record<string, { width: number; height: number }> = {
    desktop: { width: 1366, height: 768 }, // 16:9
    tablet: { width: 900, height: 1200 },  // ~3:4, dentro do breakpoint tablet
    mobile: { width: 390, height: 844 },   // ~9:19.5 (smartphone moderno)
  };
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const native = DEVICE_RESOLUTIONS[deviceView] ?? DEVICE_RESOLUTIONS.desktop;
    const update = () => {
      // clientWidth/Height excluem a borda do "dispositivo", evitando overflow do conteúdo.
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0) {
        // Usa a menor escala para garantir que o conteúdo caiba sem cortar.
        setPreviewScale(Math.min(w / native.width, h / native.height));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deviceView]);

  const demoRef = React.useRef<HTMLDivElement | null>(null);
  const [demoScale, setDemoScale] = useState(0.6);
  useEffect(() => {
    const el = demoRef.current;
    if (!el) return;
    const native = DEVICE_RESOLUTIONS[deviceView] ?? DEVICE_RESOLUTIONS.desktop;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setDemoScale(Math.min(w / native.width, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deviceView]);




  // No preview inline, media queries usam a viewport real do app; por isso
  // espelhamos o dispositivo selecionado com classes auxiliares no widget.
  useEffect(() => {
    const t = setTimeout(() => {
      const root = frameRef.current;
      if (!root) return;
      root.querySelectorAll('.custom-nav-992').forEach((nav) => {
        nav.classList.toggle('force-tablet', deviceView === 'tablet');
        nav.classList.toggle('force-mobile', deviceView === 'mobile');
      });
    }, 60);
    return () => clearTimeout(t);
  });
  const [menuDetectionDetails, setMenuDetectionDetails] = useState<{
    status: 'checking' | 'success' | 'warning' | 'error';
    message: string;
    endpoint?: string;
    itemCount?: number;
    submenuCount?: number;
  } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('widget_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar modelos:', error.message);
    }
  };

  const currentConfig = () => activeWidgetType === 'whatsapp' ? whatsappConfig :
    activeWidgetType === 'banner' ? bannerConfig : menuConfig;

  const applyConfig = (type: string, config: any) => {
    if (type === 'whatsapp') setWhatsappConfig(config);
    else if (type === 'banner') setBannerConfig(config);
    else setMenuConfig(prev => ({
      ...prev,
      ...config,
      activeRadiusTablet: config.activeRadiusTablet ?? config.activeRadius ?? prev.activeRadiusTablet,
      activeRadiusMobile: config.activeRadiusMobile ?? config.activeRadius ?? prev.activeRadiusMobile,
      itemRadiusTablet: config.itemRadiusTablet ?? config.itemRadius ?? prev.itemRadiusTablet,
      itemRadiusMobile: config.itemRadiusMobile ?? config.itemRadius ?? prev.itemRadiusMobile,
    }));
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Erro", description: "Dê um nome ao seu modelo.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
      }

      const config = activeWidgetType === 'whatsapp' ? whatsappConfig : 
                     activeWidgetType === 'banner' ? bannerConfig : menuConfig;

      const templateData = {
        name: templateName,
        type: activeWidgetType,
        config,
        user_id: user.id
      };

      let error;
      if (currentTemplateId) {
        const { error: updateError } = await supabase
          .from('widget_templates')
          .update(templateData)
          .eq('id', currentTemplateId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('widget_templates')
          .insert(templateData);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: "Sucesso", description: `Modelo "${templateName}" salvo!` });
      if (currentTemplateId) localStorage.removeItem(`widget_draft_${currentTemplateId}`);
      setDraftSavedAt(null);
      setTemplateName('');
      setCurrentTemplateId(null);
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (template: any) => {
    skipDraftRef.current = true;
    let cfg = template.config;
    let savedAt: string | null = null;
    try {
      const raw = localStorage.getItem(`widget_draft_${template.id}`);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.config) { cfg = d.config; savedAt = d.savedAt ?? null; }
      }
    } catch { /* ignore drafts corrompidos */ }

    setActiveWidgetType(template.type);
    setCurrentTemplateId(template.id);
    setTemplateName(template.name);
    applyConfig(template.type, cfg);
    setDraftSavedAt(savedAt);

    toast(savedAt
      ? { title: "Rascunho restaurado", description: `Alterações não salvas de "${template.name}".` }
      : { title: "Modelo carregado", description: `Editando: ${template.name}` });
  };

  // Sobrepõe o modelo no banco com o rascunho atual.
  const overwriteWithDraft = async () => {
    if (!currentTemplateId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('widget_templates')
        .update({ config: currentConfig() })
        .eq('id', currentTemplateId);
      if (error) throw error;
      localStorage.removeItem(`widget_draft_${currentTemplateId}`);
      setDraftSavedAt(null);
      toast({ title: "Modelo atualizado", description: "O rascunho sobrepôs o modelo." });
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Salva o rascunho atual como um novo modelo.
  const saveDraftAsNew = () => {
    if (currentTemplateId) localStorage.removeItem(`widget_draft_${currentTemplateId}`);
    setDraftSavedAt(null);
    setCurrentTemplateId(null);
    setTemplateName(prev => (prev ? `${prev} (cópia)` : ''));
    setIsDialogOpen(true);
  };


  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('widget_templates').delete().eq('id', id);
      if (error) throw error;
      setSavedTemplates(savedTemplates.filter(t => t.id !== id));
      if (currentTemplateId === id) {
        setCurrentTemplateId(null);
        setTemplateName('');
      }
      toast({ title: "Excluído", description: "Modelo removido com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };


  const WIDGET_DEMOS = {
    whatsapp: {
      phone: '5511999999999',
      text: 'Fale com nosso suporte',
      bgColor: '#25D366',
      textColor: '#ffffff',
      position: 'right',
      borderRadius: '50'
    },
    banner: {
      message: '🚀 Nova funcionalidade de submenus liberada! Confira agora.',
      bgColor: '#4f46e5',
      textColor: '#ffffff',
      link: '#',
      isDismissible: true
    },
    menu: {
      logoUrl: 'https://anabrasil.org/wp-content/uploads/2023/04/Ativo-3.webp',
      logoUrlMobile: '',
      logoColor: '',
      bgColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#4f46e5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 15,
      itemSpacing: 5,
      itemPadding: 15,
      hoverBgColor: '#f1f0fb',
      hoverTextColor: '#4f46e5',
      activeBorderColor: '#4f46e5',
      activeBorderWidth: 2,
      activeRadius: 30,
      activeRadiusTablet: 30,
      activeRadiusMobile: 30,
      itemRadius: 10,
      itemRadiusTablet: 10,
      itemRadiusMobile: 0,
      submenuGap: 0,
      submenuGapTablet: 0,
      submenuGapMobile: 0,
      shadowSize: 28,
      shadowIntensity: 22,
      tabletMenuMode: 'header',
      activeBgColor: 'transparent',
      activeTextColor: '#4f46e5',
      items: [
        { label: 'Início', link: '#' },
        { 
          label: 'Serviços', 
          link: '#', 
          children: [
            { label: 'Consultoria Especializada', link: '#' },
            { label: 'Desenvolvimento Web', link: '#' },
            { label: 'Marketing Digital', link: '#' }
          ] 
        },
        { 
          label: 'Soluções', 
          link: '#', 
          children: [
            { label: 'Sistemas ERP', link: '#' },
            { label: 'Aplicativos Mobile', link: '#' }
          ] 
        },
        { label: 'Sobre Nós', link: '#' }
      ],
      sticky: true,
      searchEnabled: true,
      searchRadius: 100,
      searchBgColor: '#00000010',
      searchIconColor: '#1f2937',
      hamburgerColor: '#1f2937',
      hamburgerBgColor: '#00000000',
      hamburgerRadius: 32,
      spotlightRadius: 24,
      searchIconSize: 16,
      hamburgerSize: 24,
      toggleSize: 38,
      spotlightPaddingX: 20,
      spotlightAlign: 'top',
      searchUrl: 'https://anabrasil.org/',
      enableAutoDetect: false,
      enableWpApi: false,
      wpApiUrl: '',
      testUrl: 'https://anabrasil.org/ana/'
    }
  };

  const loadDemo = (type: 'whatsapp' | 'banner' | 'menu') => {
    setActiveWidgetType(type);
    if (type === 'whatsapp') setWhatsappConfig(WIDGET_DEMOS.whatsapp);
    else if (type === 'banner') setBannerConfig(WIDGET_DEMOS.banner);
    else if (type === 'menu') setMenuConfig(WIDGET_DEMOS.menu);
    
    toast({
      title: `Demo de ${type === 'menu' ? 'Menu' : type} carregada`,
      description: "Você já pode ver o resultado no preview ao lado.",
    });
  };

  // Estados de configuração dos widgets
  const [whatsappConfig, setWhatsappConfig] = useState({
    phone: '5511999999999',
    text: 'Fale com nosso time',
    bgColor: '#25D366',
    textColor: '#ffffff',
    position: 'right', // 'left' ou 'right'
    borderRadius: '50'
  });

  const [bannerConfig, setBannerConfig] = useState({
    message: '🎉 Aproveite 20% de desconto usando o cupom PROMO20!',
    bgColor: '#111827',
    textColor: '#ffffff',
    link: 'https://seusite.com/promo',
    isDismissible: true
  });

  const [menuConfig, setMenuConfig] = useState({
    logoUrl: 'https://anabrasil.org/wp-content/uploads/2023/04/Ativo-3.webp',
    logoUrlMobile: '',
    logoColor: '',
    bgColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#4f46e5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 15,
    itemSpacing: 5,
    itemPadding: 15,
    hoverBgColor: '#f1f0fb',
    hoverTextColor: '#4f46e5',
    activeBorderColor: '#4f46e5',
    activeBorderWidth: 2,
    activeRadius: 30,
    activeRadiusTablet: 30,
    activeRadiusMobile: 30,
    itemRadius: 10,
    itemRadiusTablet: 10,
    itemRadiusMobile: 0,
    submenuGap: 0,
    submenuGapTablet: 0,
    submenuGapMobile: 0,
    shadowSize: 28,
    shadowIntensity: 22,
    tabletMenuMode: 'header',
    activeBgColor: 'transparent',
    activeTextColor: '#4f46e5',
    items: [
      { label: 'Início', link: '#', children: [] as any[] },
      { label: 'Sobre', link: '#', children: [] as any[] },
      { label: 'Serviços', link: '#', children: [] as any[] },
      { label: 'Contato', link: '#', children: [] as any[] }
    ] as any[],
    sticky: true,
    searchEnabled: true,
    searchRadius: 100,
    searchBgColor: '#00000010',
    searchIconColor: '#1f2937',
    hamburgerColor: '#1f2937',
    hamburgerBgColor: '#00000000',
    hamburgerRadius: 32,
    spotlightRadius: 24,
    searchIconSize: 16,
    hamburgerSize: 24,
    toggleSize: 38,
    spotlightPaddingX: 20,
    spotlightAlign: 'top',
    searchUrl: 'https://anabrasil.org/',
    enableAutoDetect: false,
    enableWpApi: true,
    wpApiUrl: '',
    testUrl: 'https://anabrasil.org/ana/'
  });

  // ===== Preview "demo" em tempo real =====
  // O documento (srcDoc) só é reconstruído quando a ESTRUTURA muda
  // (dispositivo, widget ou itens). Mudanças de estilo são injetadas via
  // <style id="live-style"> sem recarregar o iframe, preservando o estado
  // (ex.: menu hambúrguer aberto).
  const demoIframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [demoDoc, setDemoDoc] = useState('');
  const getDemoExtraCss = React.useCallback(() => {
    const pAct = deviceView === 'mobile' ? menuConfig.activeRadiusMobile : deviceView === 'tablet' ? menuConfig.activeRadiusTablet : menuConfig.activeRadius;
    const pItem = deviceView === 'mobile' ? menuConfig.itemRadiusMobile : deviceView === 'tablet' ? menuConfig.itemRadiusTablet : menuConfig.itemRadius;
    return `.menu-items a{border-radius:${(pItem/100*2.5).toFixed(3)}em !important;}.menu-items a.active{outline:2px solid ${menuConfig.activeBorderColor};outline-offset:-2px;border-radius:${(pAct/100*2.5).toFixed(3)}em !important;opacity:1 !important;}`;
  }, [deviceView, menuConfig]);
  const demoScript = `<script>window.open=function(){return null;};document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('.menu-items a');if(!a)return;e.preventDefault();e.stopPropagation();var sub=a.closest('.submenu');var top=sub?(sub.closest('.has-submenu')||a):a;var topLink=top.querySelector?(top.matches('a')?top:top.querySelector(':scope > a')):a;document.querySelectorAll('.menu-items a.active').forEach(function(x){x.classList.remove('active');});a.classList.add('active');if(topLink)topLink.classList.add('active');},true);</scr`+`ipt>`;
  // Reconstrói o documento apenas em mudanças estruturais.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDemoDoc(getGeneratedCode() + `<style id="live-style">${getDemoExtraCss()}</style>` + demoScript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceView, activeWidgetType, JSON.stringify(menuConfig.items)]);
  // Injeta o CSS atualizado em tempo real sem recarregar o iframe.
  useEffect(() => {
    try {
      const ifr = demoIframeRef.current;
      const doc = ifr && ifr.contentDocument;
      if (!doc || !doc.head) return;
      const full = getGeneratedCode();
      const m = full.match(/<style[\s\S]*?<\/style>/i);
      const css = (m ? m[0].replace(/<\/?style[^>]*>/gi, '') : '') + getDemoExtraCss();
      let live = doc.getElementById('live-style') as HTMLStyleElement | null;
      if (!live) { live = doc.createElement('style'); live.id = 'live-style'; doc.head.appendChild(live); }
      live.innerHTML = css;
    } catch {
      /* iframe ainda em origem opaca / não acessível; ignora */
    }
  });

  // ===== Auto-save de rascunho =====
  // Com um modelo selecionado, qualquer alteração salva automaticamente um
  // rascunho local (sem sobrepor o modelo no banco). O usuário decide depois
  // entre "Sobrepor modelo" ou "Salvar como novo".
  useEffect(() => {
    if (!currentTemplateId) return;
    if (skipDraftRef.current) { skipDraftRef.current = false; return; }
    const config = activeWidgetType === 'whatsapp' ? whatsappConfig :
      activeWidgetType === 'banner' ? bannerConfig : menuConfig;
    const t = setTimeout(() => {
      try {
        const at = new Date().toISOString();
        localStorage.setItem(`widget_draft_${currentTemplateId}`, JSON.stringify({ type: activeWidgetType, config, savedAt: at }));
        setDraftSavedAt(at);
      } catch { /* storage indisponível */ }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappConfig, bannerConfig, menuConfig, activeWidgetType, currentTemplateId]);





  const [jsonInput, setJsonInput] = useState('');

  // Fallback robusto: mesmo quando o JSON está truncado/inválido (ex.: colado
  // pela metade), tentamos extrair diretamente o HTML do menu que vem dentro
  // do campo content.rendered (formato wp_navigation do WordPress).
  const extractMenuFromRawText = (raw: string): any[] => {
    if (!raw) return [];
    // Captura todos os blocos "rendered":"...". Aceita conteúdo truncado.
    const matches = Array.from(raw.matchAll(/"rendered"\s*:\s*"((?:\\.|[^"\\])*)"?/g));
    let bestHtml = '';
    for (const m of matches) {
      // Desescapa a string JSON manualmente (a string pode estar incompleta).
      let html = m[1]
        .replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      // Só nos interessa o conteúdo que realmente parece um menu.
      if (/<li[\s>]/i.test(html) && html.length > bestHtml.length) bestHtml = html;
    }
    if (!bestHtml) return [];
    return extractWPItems([{ content: { rendered: bestHtml } }]);
  };

  const importMenuFromJson = () => {
    let items: any[] = [];
    try {
      const parsed = JSON.parse(jsonInput);
      items = extractWPItems(parsed);
    } catch {
      // JSON inválido/truncado — seguimos para o fallback de texto bruto.
    }

    // Se a leitura estruturada não retornou nada, tentamos extrair o HTML do menu.
    if (items.length === 0) {
      items = extractMenuFromRawText(jsonInput);
    }

    if (items.length > 0) {
      setMenuConfig(prev => ({ ...prev, items }));
      const subCount = countSubmenuItems(items);
      toast({
        title: 'Menu importado',
        description: `${items.length} item(ns) de topo e ${subCount} subitem(ns) detectado(s).`,
      });
    } else {
      toast({
        title: 'Nenhum item encontrado',
        description: 'Não foi possível extrair itens. Cole o JSON completo de /wp-json/wp/v2/navigation.',
        variant: 'destructive',
      });
    }
  };

  const importMenuFromUrl = async (url: string) => {
    if (!url.startsWith('http')) return false;

    try {
      const { data, error } = await supabase.functions.invoke('menu-html-proxy', {
        body: { url },
      });

      if (error) throw error;
      const html = typeof data?.html === 'string' ? data.html : '';
      const items = extractWPItems([{ content: { rendered: html } }]);
      const submenuCount = countSubmenuItems(items);

      if (items.length === 0) return false;

      setMenuConfig(prev => ({ ...prev, testUrl: url, items }));
      setMenuDetectionDetails({
        status: 'success',
        message: 'Menu detectado pela URL padrão via leitura completa do HTML.',
        endpoint: url,
        itemCount: items.length,
        submenuCount,
      });
      toast({
        title: 'Menu importado pela URL',
        description: `${items.length} item(ns) principais e ${submenuCount} subitem(ns) detectados.`,
      });
      return true;
    } catch (error: any) {
      setMenuDetectionDetails({
        status: 'warning',
        message: error?.message || 'Não foi possível ler a URL pelo proxy interno.',
        endpoint: url,
      });
      return false;
    }
  };

  // Carrega automaticamente o menu da URL padrão ao montar/recarregar a página.
  useEffect(() => {
    if (menuConfig.testUrl) {
      importMenuFromUrl(menuConfig.testUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const extractWPItems = (data: any): any[] => {
    if (!data) return [];
    
    const cleanLabel = (text: string) => {
      if (!text) return '';
      return text.toString().replace(/[\u25BC\u25BE\u25B6\u25B8\u2304\u22EE\u00BB\u203A\u25B2\u25BC]/g, '').trim();
    };

    const firstPresent = (...values: any[]) => values.find(value => value !== undefined && value !== null && value !== '');

    const normalizeLink = (value: any) => {
      if (!value) return undefined;
      if (typeof value === 'object') return value.rendered || value.url || value.href;
      return value;
    };

    const normalizeItems = (rawList: any[]) => {
      return rawList.map(item => {
        const id = (firstPresent(item.id, item.ID, item.db_id, item.object_id, item.key, item.node?.id) || Math.random().toString(36).substr(2, 9)).toString();
        const parent = (firstPresent(item.parent, item.menu_item_parent, item.parentId, item.meta?.menu_item_parent, item.node?.parentId) || 0).toString();
        const label = cleanLabel(item.title?.rendered || item.title || item.label || item.name || item.post_title || item.text || item.node?.title || 'Sem título');
        const link = normalizeLink(firstPresent(item.url, item.link, item.guid, item.href, item.node?.url)) || '#';
        const children = item.child_items || item.children || item.items || item.sub_items || item.nodes || item.edges || [];
        return { id, parent, label, link, children };
      });
    };

    const parseMenuHTML = (html: string): any[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const parseList = (root: Element): any[] => {
        const listItems = Array.from(root.children).filter(child => child.tagName === 'LI');

        if (listItems.length === 0) {
          return Array.from(root.querySelectorAll(':scope > a, :scope > .wp-block-navigation-item__content'))
            .map((a: any) => ({
              label: cleanLabel(a.querySelector?.('.wp-block-navigation-item__label')?.textContent || a.textContent || ''),
              link: a.getAttribute('href') || '#',
              children: []
            }))
            .filter(item => item.label);
        }

        return listItems.map((li: Element) => {
          const link = li.querySelector(':scope > a, :scope > .wp-block-navigation-item__content, :scope > div > a');
          const subList = li.querySelector(':scope > ul, :scope > ol, :scope > .wp-block-navigation__submenu-container, :scope > .sub-menu, :scope > div > ul');
          return {
            label: cleanLabel((link as HTMLElement)?.textContent || ''),
            link: (link as HTMLAnchorElement)?.getAttribute?.('href') || '#',
            children: subList ? parseList(subList) : []
          };
        }).filter(item => item.label);
      };

      // O endpoint /wp-json/wp/v2/navigation costuma devolver vários <li> irmãos
      // sem um <ul> raiz. Nessa situação, o menu correto é o body inteiro; se
      // deixarmos a pontuação escolher entre todos os <ul>, ela pode pegar sempre
      // apenas um submenu interno.
      const bodyHasDirectMenuItems = Array.from(doc.body.children).some(child => child.tagName === 'LI');
      if (bodyHasDirectMenuItems) {
        const bodyItems = parseList(doc.body);
        if (bodyItems.length > 0) return bodyItems;
      }

      // Em vez de pegar apenas a primeira lista (que costuma ser um subgrupo),
      // avaliamos TODOS os candidatos a container de menu e escolhemos o mais rico
      // (o que produz mais itens de topo + subitens). Esse é o mesmo princípio
      // de detecção usado nos itens que já funcionavam.
      const candidates = Array.from(
        doc.querySelectorAll(
          '#main-menu, .ha-navbar-nav, .elementor-nav-menu, .wp-block-navigation__container, nav ul, nav, ul[class*="menu"], ul[class*="nav"], ul, ol'
        )
      );

      const countDeep = (items: any[]): number =>
        items.reduce((acc, it) => acc + 1 + countDeep(it.children || []), 0);

      const hasMenuSignal = (element: Element): boolean => {
        const signature = `${element.id || ''} ${element.className || ''} ${element.getAttribute('role') || ''}`.toLowerCase();
        return /main-menu|nav|navbar|navigation|menu/.test(signature);
      };

      const isNestedSubmenuCandidate = (element: Element): boolean => {
        const tokens = Array.from(element.classList || []).map(token => token.toLowerCase());
        return tokens.some(token =>
          token === 'sub-menu' ||
          token === 'submenu' ||
          token === 'dropdown' ||
          token === 'children' ||
          token.includes('__submenu') ||
          token.includes('submenu-panel') ||
          token.includes('dropdown-menu') ||
          token.includes('wp-block-navigation-submenu')
        );
      };

      let best: any[] = [];
      let bestScore = -1;
      for (const candidate of candidates) {
        if (isNestedSubmenuCandidate(candidate)) continue;
        const parsed = parseList(candidate);
        const submenuScore = countSubmenuItems(parsed);
        const directScore = parsed.length;
        const signalScore = hasMenuSignal(candidate) ? 1000 : 0;
        const nestedPenalty = candidate.closest('li') ? 300 : 0;
        const submenuBonus = submenuScore > 0 ? 50 : 0;
        const score = signalScore + (directScore * 25) + (countDeep(parsed) * 2) + submenuBonus - nestedPenalty;
        // Priorizamos containers com assinatura clara de menu e submenus reais,
        // evitando aceitar uma lista de páginas/posts como se fosse navegação.
        if (score > bestScore) {
          bestScore = score;
          best = parsed;
        }
      }

      return best.length ? best : parseList(doc.body);
    };

    const buildTree = (flatItems: any[]) => {
      const normalized = normalizeItems(flatItems);

      // Caso os dados já venham aninhados (ex.: campo child_items dos plugins de menu),
      // preservamos a hierarquia recursivamente em vez de achatar tudo.
      const hasNested = normalized.some(i => Array.isArray(i.children) && i.children.length > 0);

      if (hasNested) {
        const ids = new Set(normalized.map(i => i.id));
        const rootItems = normalized.filter(i => i.parent === "0" || i.parent === "" || !ids.has(i.parent));
        const mapNested = (list: any[]): any[] => normalizeItems(list).map(i => ({
          ...i,
          children: Array.isArray(i.children) && i.children.length > 0 ? mapNested(i.children) : []
        }));
        return mapNested(rootItems.length > 0 ? rootItems : normalized);
      }

      const itemMap = new Map();
      const tree: any[] = [];
      normalized.forEach(item => itemMap.set(item.id, { ...item, children: [] }));
      normalized.forEach(item => {
        const node = itemMap.get(item.id);
        const pId = item.parent;
        const parentNode = itemMap.get(pId);
        if (pId !== "0" && pId !== "" && parentNode && pId !== item.id) {
          parentNode.children.push(node);
        } else {
          tree.push(node);
        }
      });
      return tree.length > 0 ? tree : normalized;
    };

    let itemsSource = data;
    if (!Array.isArray(data)) {
      itemsSource = data.items || data.children || data.menu_items || data.data || data.nodes || data.edges || [data];
    }

      if (Array.isArray(itemsSource)) {
        const renderedMenus = itemsSource
          .map(item => item?.content?.rendered)
          .filter((html): html is string => typeof html === 'string' && /<\s*(li|ul|nav|a)\b/i.test(html));
        if (renderedMenus.length > 0) {
          return renderedMenus.flatMap(html => parseMenuHTML(html));
      }
      return buildTree(itemsSource);
    }
    return [];
  };

  const countSubmenuItems = (items: any[]): number => {
    return items.reduce((total, item) => {
      const children = Array.isArray(item.children) ? item.children : [];
      return total + children.length + countSubmenuItems(children);
    }, 0);
  };

  const syncWithSystemMenu = () => {
    setMenuConfig({
      ...menuConfig,
      items: navItems.map(item => ({ label: item.label, link: item.to }))
    });
    toast({
      title: "Menu Sincronizado",
      description: "Os itens foram carregados apenas para referência no construtor.",
    });
  };


  // Função para copiar o código
  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "O código do widget foi copiado para sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // GERADORES DE CÓDIGO CRU (ANTI-ADBLOCK)
  // ==========================================

  const generateWhatsappCode = () => {
    const css = `<style>
  .custom-wa-widget-9982 {
    position: fixed;
    bottom: 24px;
    ${whatsappConfig.position}: 24px;
    background-color: ${whatsappConfig.bgColor};
    color: ${whatsappConfig.textColor};
    padding: 12px 20px;
    border-radius: ${whatsappConfig.borderRadius}px;
    text-decoration: none;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-weight: 500;
    font-size: 15px;
  }
  .custom-wa-widget-9982:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .custom-wa-widget-9982 svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
</style>`;

    const html = `
<!-- Início: Widget WhatsApp Nativo -->
<a href="https://wa.me/${whatsappConfig.phone.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" class="custom-wa-widget-9982">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
  <span>${whatsappConfig.text}</span>
</a>
<!-- Fim: Widget WhatsApp Nativo -->`;

    return css + "\n" + html;
  };

  const generateBannerCode = () => {
    const css = `<style>
  .custom-top-banner-773 {
    width: 100%;
    background-color: ${bannerConfig.bgColor};
    color: ${bannerConfig.textColor};
    text-align: center;
    padding: 12px 20px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    position: relative;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    z-index: 999998;
  }
  .custom-top-banner-773 a {
    color: inherit;
    font-weight: bold;
    text-decoration: underline;
  }
  .custom-top-banner-773 .close-btn {
    position: absolute;
    right: 16px;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 20px;
    opacity: 0.8;
  }
  .custom-top-banner-773 .close-btn:hover { opacity: 1; }
</style>`;

    const script = bannerConfig.isDismissible ? `
<script>
  function closeCustomBanner(el) {
    el.closest('.custom-top-banner-773').style.display = 'none';
  }
</script>` : '';

    const html = `
<!-- Início: Top Banner Nativo -->
<div class="custom-top-banner-773">
  <span>${bannerConfig.message}</span>
  ${bannerConfig.link ? `<a href="${bannerConfig.link}">Saiba mais</a>` : ''}
  ${bannerConfig.isDismissible ? `<button class="close-btn" onclick="closeCustomBanner(this)" aria-label="Fechar">&times;</button>` : ''}
</div>
<!-- Fim: Top Banner Nativo -->`;

    return css + "\n" + html + "\n" + script;
  };

  const generateMenuCode = () => {
    const activeRadiusDesktop = ((menuConfig.activeRadius ?? 0) / 100 * 2.5).toFixed(3);
    const activeRadiusTablet = ((menuConfig.activeRadiusTablet ?? menuConfig.activeRadius ?? 0) / 100 * 2.5).toFixed(3);
    const activeRadiusMobile = ((menuConfig.activeRadiusMobile ?? menuConfig.activeRadius ?? 0) / 100 * 2.5).toFixed(3);
    const itemRadiusDesktop = ((menuConfig.itemRadius ?? 0) / 100 * 2.5).toFixed(3);
    const itemRadiusTablet = ((menuConfig.itemRadiusTablet ?? menuConfig.itemRadius ?? 0) / 100 * 2.5).toFixed(3);
    const itemRadiusMobile = ((menuConfig.itemRadiusMobile ?? menuConfig.itemRadius ?? 0) / 100 * 2.5).toFixed(3);
    const submenuPanelRadiusDesktop = activeRadiusDesktop;
    const submenuPanelRadiusTablet = activeRadiusTablet;
    const submenuPanelRadiusMobile = activeRadiusMobile;
    const submenuGapDesktop = Math.max(0, Number(menuConfig.submenuGap ?? 0));
    const submenuGapTablet = Math.max(0, Number(menuConfig.submenuGapTablet ?? menuConfig.submenuGap ?? 0));
    const submenuGapMobile = Math.max(0, Number(menuConfig.submenuGapMobile ?? menuConfig.submenuGap ?? 0));
    const shadowSize = Math.max(0, Number(menuConfig.shadowSize ?? 28));
    const shadowIntensity = Math.min(100, Math.max(0, Number(menuConfig.shadowIntensity ?? 22)));
    const menuShadow = (shadowSize === 0 || shadowIntensity === 0)
      ? 'none'
      : `0 ${Math.round(shadowSize * 0.5)}px ${shadowSize}px rgba(0,0,0,${(shadowIntensity / 100).toFixed(3)})`;
    const tabletHamburger = (menuConfig.tabletMenuMode ?? 'header') === 'hamburger';
    const mobileRules = (p: string) => `
    ${p} {
      padding: 0 14px;
      min-height: 60px;
    }
    ${p} .logo img {
      height: 34px;
      max-width: 140px;
    }
    ${p} .logo .logo-svg {
      height: 34px;
      width: 140px;
      max-width: 140px;
    }
    ${menuConfig.logoUrlMobile ? `${p} .logo .logo-desktop { display: none; } ${p} .logo .logo-mobile { display: block; }` : ''}
    ${p} .mobile-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      order: 3;
    }
    ${p} .logo { order: 1; margin-right: auto; }
    ${p} .nav-search { display: none !important; }
    ${p} .search-toggle { display: flex !important; order: 2; margin-right: 8px; }
    ${p} .menu-items {
      position: absolute;
      top: 100%;
      left: 14px;
      width: calc(100% - 28px);
      background-color: ${menuConfig.bgColor};
      flex-direction: column;
      align-items: stretch;
      padding: 0 8px;
      gap: 0;
      box-shadow: none;
      border: 1px solid transparent;
      border-radius: ${activeRadiusMobile}em;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: max-height 0.35s ease, opacity 0.25s ease, transform 0.25s ease, padding 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      z-index: 999998;
    }
    ${p} .menu-items.active {
      max-height: 80vh;
      padding: 8px;
      box-shadow: ${menuShadow};
      border-color: rgba(0,0,0,0.08);
      overflow-y: auto;
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    ${p} .menu-items a {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 14px 22px;
      border-radius: ${itemRadiusMobile}em;
      font-size: 15.5px;
      border-left: 3px solid transparent;
      border-bottom: 1px solid rgba(0,0,0,0.04);
      justify-content: space-between;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    ${p} .menu-items > .has-submenu:last-child > a,
    ${p} .menu-items > a:last-child { border-bottom: none; }
    ${p} .menu-items .has-submenu {
      flex-direction: column;
      align-items: stretch !important;
    }
    ${p} .menu-items .has-submenu > a {
      width: 100%;
    }
    ${p} .submenu {
      position: static !important;
      width: calc(100% - 48px) !important;
      margin: 0 24px !important;
      box-shadow: none !important;
      border-radius: ${submenuPanelRadiusMobile}em !important;
      padding: 0 8px !important;
      background-color: ${menuConfig.bgColor} !important;
      border: 1px solid transparent !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      opacity: 0 !important;
      visibility: hidden !important;
      max-height: 0 !important;
      overflow: hidden !important;
      transform: none !important;
      clip-path: inset(0 -32px 100% -32px);
      transition: max-height 0.32s cubic-bezier(.2,.8,.2,1), clip-path 0.32s cubic-bezier(.2,.8,.2,1), opacity 0.25s ease, margin-top 0.25s ease, padding 0.25s ease, visibility 0.25s ease;
    }
    ${p} .has-submenu.open > .submenu {
      opacity: 1 !important;
      visibility: visible !important;
      max-height: 80vh !important;
      margin: ${submenuGapMobile}px 24px 18px !important;
      padding: 8px !important;
      box-shadow: ${menuShadow} !important;
      border-color: rgba(0,0,0,0.08) !important;
      clip-path: inset(0 -32px -32px -32px);
    }
    ${p} .has-submenu.open > a::after {
      transform: rotate(180deg);
    }
    ${p} .has-submenu.open > a {
      color: ${menuConfig.activeTextColor} !important;
      background-color: ${menuConfig.activeBgColor === 'transparent' ? 'rgba(0,0,0,0.05)' : menuConfig.activeBgColor} !important;
      border-radius: ${activeRadiusMobile}em !important;
    }
    ${p} .submenu a {
      padding: 10px 40px !important;
      font-size: 15px !important;
      border-radius: ${itemRadiusMobile}em !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    ${p} .menu-items a.active {
      border-left-color: ${menuConfig.activeBorderColor};
      color: ${menuConfig.activeTextColor};
      background-color: ${menuConfig.activeBgColor === 'transparent' ? 'rgba(0,0,0,0.05)' : menuConfig.activeBgColor};
      border-radius: ${activeRadiusMobile}em !important;
    }`;

    const css = `<style>
  .custom-nav-992 {
    width: 100%;
    background-color: ${menuConfig.bgColor};
    color: ${menuConfig.textColor};
    padding: 0 20px;
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: ${menuConfig.fontFamily};
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: ${menuConfig.sticky ? 'sticky' : 'relative'};
    top: 0;
    z-index: 999999;
    box-sizing: border-box;
    transition: all 0.3s ease;
  }
  .custom-nav-992 .logo img {
    height: 40px;
    max-width: 180px;
    width: auto;
    object-fit: contain;
    object-position: left center;
    display: block;
  }
  .custom-nav-992 .logo .logo-svg {
    height: 40px;
    width: 180px;
    max-width: 180px;
    display: block;
    transition: background-color 0.25s ease;
  }
  .custom-nav-992 .logo a:hover .logo-svg {
    background-color: ${menuConfig.hoverTextColor} !important;
  }
  .custom-nav-992 .logo .logo-mobile { display: none; }
  .custom-nav-992 .logo .logo-desktop { display: block; }
   .custom-nav-992 .menu-items {
     display: flex;
     flex-wrap: nowrap;
     gap: ${menuConfig.itemSpacing}px;
     align-items: center;
     align-self: stretch;
     justify-content: center;
     flex: 1 1 0;
     min-width: 0;
     white-space: nowrap !important;
     flex-wrap: nowrap !important;
     list-style: none !important;
     margin: 0 !important;
     padding: 0 !important;
   }
  .custom-nav-992 .nav-search {
    display: flex;
    align-items: center;
    background: ${menuConfig.searchBgColor};
    border-radius: ${(menuConfig.searchRadius/100*2.5).toFixed(3)}em;
    padding: 6px 12px;
    gap: 6px;
    flex-shrink: 0;
  }
  .custom-nav-992 .nav-search input {
    border: none;
    outline: none;
    background: transparent;
    color: ${menuConfig.searchIconColor};
    font-size: 14px;
    width: 130px;
  }
  .custom-nav-992 .nav-search svg {
    width: ${menuConfig.searchIconSize}px !important;
    height: ${menuConfig.searchIconSize}px !important;
    min-width: ${menuConfig.searchIconSize}px;
    min-height: ${menuConfig.searchIconSize}px;
    flex-shrink: 0;
    opacity: 0.7;
    fill: ${menuConfig.searchIconColor};
  }
  .custom-nav-992 .search-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: ${menuConfig.toggleSize}px;
    height: ${menuConfig.toggleSize}px;
    border: none;
    border-radius: ${(menuConfig.searchRadius/100*2.5).toFixed(3)}em;
    background: ${menuConfig.searchBgColor};
    color: ${menuConfig.searchIconColor};
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s ease, background 0.2s ease;
  }
  .custom-nav-992 .search-toggle:hover { transform: scale(1.08); filter: brightness(0.92); }
  .custom-nav-992 .search-toggle svg { width: ${menuConfig.searchIconSize + 2}px !important; height: ${menuConfig.searchIconSize + 2}px !important; min-width: ${menuConfig.searchIconSize + 2}px; min-height: ${menuConfig.searchIconSize + 2}px; flex-shrink: 0; fill: ${menuConfig.searchIconColor}; }
  .custom-spotlight-9982 {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: ${menuConfig.spotlightAlign === 'center' ? 'center' : menuConfig.spotlightAlign === 'bottom' ? 'flex-end' : 'flex-start'};
    justify-content: center;
    padding-left: ${menuConfig.spotlightPaddingX}px;
    padding-right: ${menuConfig.spotlightPaddingX}px;
    padding-top: ${menuConfig.spotlightAlign === 'top' ? '18vh' : '0'};
    padding-bottom: ${menuConfig.spotlightAlign === 'bottom' ? '18vh' : '0'};
    background: rgba(0,0,0,0.4);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  }
  .custom-spotlight-9982.open { opacity: 1; visibility: visible; }
  .custom-spotlight-9982 .spotlight-box {
    width: min(92vw, 600px);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: ${menuConfig.bgColor};
    color: ${menuConfig.textColor};
    border-radius: ${(menuConfig.spotlightRadius/100*2.5).toFixed(3)}em;
    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
    transform: translateY(-20px) scale(0.97);
    transition: transform 0.28s cubic-bezier(.2,.8,.2,1);
  }
  .custom-spotlight-9982.open .spotlight-box { transform: translateY(0) scale(1); }
  .custom-spotlight-9982 svg { width: 22px !important; height: 22px !important; min-width: 22px; min-height: 22px; opacity: 0.5; fill: currentColor; flex-shrink: 0; }
  .custom-spotlight-9982 input { flex: 1; border: none; outline: none; background: transparent; font-size: 18px; color: inherit; }

   .custom-nav-992 .menu-items a {
     color: inherit;
     text-decoration: none !important;
     font-size: ${menuConfig.fontSize}px;
     font-weight: 500;
     padding: 10px ${menuConfig.itemPadding}px;
     border-radius: ${itemRadiusDesktop}em;
     transition: all 0.2s;
     opacity: 0.8;
     white-space: nowrap !important;
     word-break: keep-all !important;
     overflow-wrap: normal !important;
     position: relative;
     display: flex;
     align-items: center;
     justify-content: space-between;
     gap: 6px;
     box-sizing: border-box;
     flex-shrink: 1;
     min-width: 0;
     overflow: hidden;
     text-overflow: ellipsis;
     line-height: 1.2 !important;
   }
  .custom-nav-992 .menu-items > a:hover,
  .custom-nav-992 .menu-items > .has-submenu > a:hover {
    color: ${menuConfig.hoverTextColor};
    background-color: ${menuConfig.hoverBgColor};
    opacity: 1;
      border-radius: ${itemRadiusDesktop}em;
  }
  .custom-nav-992 .menu-items > a.active,
  .custom-nav-992 .menu-items > .has-submenu > a.active {
    color: ${menuConfig.activeTextColor};
    opacity: 1;
    background-color: ${menuConfig.activeBgColor};
    border: ${menuConfig.activeBorderWidth}px solid ${menuConfig.activeBorderColor};
     border-radius: ${activeRadiusDesktop}em;
  }
  .custom-nav-992 .menu-items a:focus,
  .custom-nav-992 .menu-items a:focus-visible {
    outline: none;
  }
   .custom-nav-992 .menu-items .has-submenu {
     position: relative !important;
     display: flex;
     align-items: center;
     align-self: stretch;
     flex-shrink: 1;
     min-width: 0;
   }
  .custom-nav-992 .menu-items .has-submenu::before {
    content: "";
    position: absolute;
    left: 0;
    top: 100%;
    width: max(100%, 230px);
    height: ${submenuGapDesktop + 14}px;
    background: transparent;
    z-index: 2147483646;
  }
  .custom-nav-992 .menu-items .has-submenu > a::after {
    content: "";
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid currentColor;
    opacity: 0.5;
    transition: transform 0.2s ease;
  }
  .custom-nav-992 .submenu {
    position: absolute !important;
    top: calc(100% + ${submenuGapDesktop}px) !important;
    left: 0 !important;
    margin-top: 0 !important;
    background-color: ${menuConfig.bgColor} !important;
    box-shadow: ${menuShadow} !important;
    border-radius: ${submenuPanelRadiusDesktop}em !important;
    padding: 8px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    min-width: 230px !important;
     max-width: min(92vw, 420px) !important;
    z-index: 2147483647 !important;
    list-style: none !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    border: 1px solid rgba(0,0,0,0.08) !important;
    overflow: hidden !important;
    transform-origin: top center;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-8px);
    clip-path: inset(0 -32px 100% -32px);
    transition: opacity 0.25s ease, transform 0.28s cubic-bezier(.2,.8,.2,1), clip-path 0.3s cubic-bezier(.2,.8,.2,1), visibility 0.25s ease;
  }
  .custom-nav-992 .has-submenu:hover > .submenu,
  .custom-nav-992 .has-submenu:focus-within > .submenu {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
    clip-path: inset(0 -32px -32px -32px);
  }
  .custom-nav-992 .has-submenu:hover > a::after {
    transform: rotate(180deg);
  }
  .custom-nav-992 .has-submenu:hover > a,
  .custom-nav-992 .has-submenu:focus-within > a {
    color: ${menuConfig.activeTextColor} !important;
    background-color: ${menuConfig.activeBgColor === 'transparent' ? 'rgba(0,0,0,0.05)' : menuConfig.activeBgColor} !important;
    border-radius: ${activeRadiusDesktop}em !important;
    opacity: 1 !important;
  }
  .custom-nav-992 .submenu a {
    padding: 11px 16px !important;
    opacity: 0.9 !important;
    width: 100% !important;
    border-radius: ${itemRadiusDesktop}em !important;
    display: flex !important;
     align-items: center !important;
    text-align: left !important;
     white-space: nowrap !important;
     word-break: keep-all !important;
     overflow-wrap: normal !important;
     overflow: hidden !important;
     text-overflow: ellipsis !important;
     min-width: 0 !important;
    font-size: 14px !important;
    border-bottom: none !important;
  }
  .custom-nav-992 .submenu a:hover {
    background-color: ${menuConfig.hoverBgColor || 'rgba(0,0,0,0.04)'} !important;
    color: ${menuConfig.hoverTextColor || 'inherit'} !important;
    opacity: 1 !important;
  }
  .custom-nav-992 .mobile-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: ${menuConfig.toggleSize}px;
    height: ${menuConfig.toggleSize}px;
    background: ${menuConfig.hamburgerBgColor};
    border: none;
    color: ${menuConfig.hamburgerColor};
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    border-radius: ${(menuConfig.hamburgerRadius/100*2.5).toFixed(3)}em;
  }
  .custom-nav-992 .mobile-toggle:hover {
    filter: brightness(0.92);
  }
  .custom-nav-992 .mobile-toggle .bars {
    position: relative;
    width: ${menuConfig.hamburgerSize}px;
    height: ${(menuConfig.hamburgerSize * 0.75).toFixed(0)}px;
    display: block;
  }
  .custom-nav-992 .mobile-toggle .bars span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2.5px;
    border-radius: 2px;
    background-color: currentColor;
    transition: transform 0.3s ease, opacity 0.25s ease, top 0.3s ease;
  }
  .custom-nav-992 .mobile-toggle .bars span:nth-child(1) { top: 0; }
  .custom-nav-992 .mobile-toggle .bars span:nth-child(2) { top: ${((menuConfig.hamburgerSize*0.75 - 2.5)/2).toFixed(1)}px; }
  .custom-nav-992 .mobile-toggle .bars span:nth-child(3) { top: ${(menuConfig.hamburgerSize*0.75 - 2.5).toFixed(1)}px; }
  .custom-nav-992 .mobile-toggle.open .bars span:nth-child(1) { top: ${((menuConfig.hamburgerSize*0.75 - 2.5)/2).toFixed(1)}px; transform: rotate(45deg); }
  .custom-nav-992 .mobile-toggle.open .bars span:nth-child(2) { opacity: 0; }
  .custom-nav-992 .mobile-toggle.open .bars span:nth-child(3) { top: ${((menuConfig.hamburgerSize*0.75 - 2.5)/2).toFixed(1)}px; transform: rotate(-45deg); }

  
  /* ===== TABLET (1024px - 851px) ===== */
  @media (max-width: 1024px) and (min-width: 851px) {
    .custom-nav-992 {
      padding: 0 18px;
      min-height: 64px;
    }
    .custom-nav-992 .logo img {
      height: 36px;
      max-width: 150px;
    }
    .custom-nav-992 .logo .logo-svg {
      height: 36px;
      width: 150px;
      max-width: 150px;
    }
    ${menuConfig.logoUrlMobile ? `.custom-nav-992 .logo .logo-desktop { display: none; } .custom-nav-992 .logo .logo-mobile { display: block; }` : ''}
    ${tabletHamburger ? mobileRules('.custom-nav-992') : `
    .custom-nav-992 .menu-items {
      gap: 2px;
    }
    .custom-nav-992 .menu-items a {
      font-size: 13.5px;
      padding: 8px 10px;
      border-radius: ${itemRadiusTablet}em !important;
    }
    .custom-nav-992 .menu-items a.active {
      border-radius: ${activeRadiusTablet}em !important;
    }
    .custom-nav-992 .menu-items .has-submenu::before {
      height: ${submenuGapTablet + 14}px;
    }
    .custom-nav-992 .submenu {
      min-width: 200px !important;
      top: calc(100% + ${submenuGapTablet}px) !important;
      border-radius: ${submenuPanelRadiusTablet}em !important;
    }
    .custom-nav-992 .submenu a {
      border-radius: ${itemRadiusTablet}em !important;
    }
    .custom-nav-992 .has-submenu:hover > a,
    .custom-nav-992 .has-submenu:focus-within > a {
      border-radius: ${activeRadiusTablet}em !important;
    }
    `}
  }

  /* ===== MOBILE (<= 850px) ===== */
  @media (max-width: 850px) {
    ${mobileRules('.custom-nav-992')}
  }

  /* ===== AUTO-BREAK: quando itens não cabem (padding < 10px) ===== */
  ${mobileRules('.custom-nav-992.force-mobile')}
  ${tabletHamburger ? mobileRules('.custom-nav-992.force-tablet') : ''}
  @media (min-width: 851px) {
    .custom-nav-992.force-tablet .menu-items a {
      border-radius: ${itemRadiusTablet}em !important;
    }
    .custom-nav-992.force-tablet .menu-items a.active {
      border-radius: ${activeRadiusTablet}em !important;
    }
    .custom-nav-992.force-tablet .submenu {
      top: calc(100% + ${submenuGapTablet}px) !important;
      border-radius: ${submenuPanelRadiusTablet}em !important;
    }
    .custom-nav-992.force-tablet .submenu a {
      border-radius: ${itemRadiusTablet}em !important;
    }
    .custom-nav-992.force-tablet .has-submenu:hover > a,
    .custom-nav-992.force-tablet .has-submenu:focus-within > a {
      border-radius: ${activeRadiusTablet}em !important;
    }
    .custom-nav-992.force-mobile .menu-items a {
      border-radius: ${itemRadiusMobile}em !important;
    }
    .custom-nav-992.force-mobile .menu-items a.active {
      border-radius: ${activeRadiusMobile}em !important;
    }
  }
</style>`;

    let fetchScript = `
    async function initializeMenuDetection() {
      const menuContainer = document.querySelector('.custom-nav-992 .menu-items');
      if (!menuContainer) return;

      console.log('Iniciando detecção de menu...');

      function renderItems(list) {
        if (!Array.isArray(list)) return '';
        let html = '';
        list.forEach(item => {
          if (!item) return;

          let title = item.title?.rendered || item.title || item.label || item.name || item.post_title || item.text || '';
          if (!title || title.trim() === '') return;
          
          const children = item.child_items || item.children || item.items || item.sub_items || [];
          const link = item.url || item.link || item.guid || item.href || '#';

          if (children && children.length > 0) {
            html += \`<div class="has-submenu">
              <a href="\${link}">\${title}</a>
              <ul class="submenu">\${renderItems(children)}</ul>
            </div>\`;
          } else {
            html += \`<a href="\${link}">\${title}</a>\`;
          }
        });
        return html;
      }

      const wpApiUrl = '${menuConfig.wpApiUrl}';
      const enableAutoDetect = ${menuConfig.enableAutoDetect};
      if (wpApiUrl && wpApiUrl.length > 10) {
        try {
          console.log('Buscando via WP API:', wpApiUrl);
          const response = await fetch(wpApiUrl);
          if (response.ok) {
            let data = await response.json();

            // Se o endpoint for a LISTA de menus (sem itens), busca o detalhe com os child_items.
            try {
              const isMenuList = Array.isArray(data) && data.length > 0 && data[0]
                && (data[0].term_id || data[0].ID || data[0].id)
                && !data[0].url && !data[0].items && !data[0].child_items;
              if (isMenuList && wpApiUrl.indexOf('/wp-json/menus/v1/menus') !== -1) {
                const best = data.slice().sort((a, b) => (b.count || 0) - (a.count || 0))[0];
                const menuId = best.term_id || best.ID || best.id;
                const base = new URL(wpApiUrl).origin;
                const detailRes = await fetch(base + '/wp-json/menus/v1/menus/' + menuId);
                if (detailRes.ok) { data = await detailRes.json(); }
              }
            } catch (e) {}
            
            
            function buildTree(flatItems) {
              const firstPresent = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
              const normalizeLink = (value) => {
                if (!value) return undefined;
                if (typeof value === 'object') return value.rendered || value.url || value.href;
                return value;
              };
              const normalize = (items) => items.map(item => ({
                id: (firstPresent(item.id, item.ID, item.db_id, item.object_id, item.key, item.node?.id) || Math.random().toString(36).substr(2, 9)).toString(),
                parent: (firstPresent(item.parent, item.menu_item_parent, item.parentId, item.meta?.menu_item_parent, item.node?.parentId) || 0).toString(),
                title: (item.title?.rendered || item.title || item.label || item.name || item.post_title || item.text || item.node?.title || 'Sem título').toString(),
                link: normalizeLink(firstPresent(item.url, item.link, item.guid, item.href, item.node?.url)) || '#',
                children: item.child_items || item.children || item.items || item.sub_items || []
              }));

              const normalized = normalize(flatItems);
              const itemMap = new Map();
              const tree = [];

              normalized.forEach(item => {
                itemMap.set(item.id, { ...item, children: [] });
              });

              normalized.forEach(item => {
                const node = itemMap.get(item.id);
                const parentNode = itemMap.get(item.parent);
                if (item.parent !== "0" && parentNode) {
                  parentNode.children.push(node);
                } else {
                  tree.push(node);
                }
              });

              return tree.length > 0 ? tree : normalized;
            }

            function extractItems(source) {
              if (!source) return [];
              console.log('Widget: Analisando fonte de dados:', source);
              const firstPresent = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
              const normalizeLink = (value) => {
                if (!value) return undefined;
                if (typeof value === 'object') return value.rendered || value.url || value.href;
                return value;
              };
              
              function fromHTML(html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                function parseList(root) {
                  const listItems = Array.from(root.children || []).filter(child => child.tagName === 'LI');
                  if (listItems.length === 0) {
                    return Array.from(root.querySelectorAll(':scope > a, :scope > .wp-block-navigation-item__content'))
                      .map(a => ({
                        title: (a.querySelector?.('.wp-block-navigation-item__label')?.textContent || a.textContent || '').trim(),
                        link: a.getAttribute('href') || '#',
                        children: []
                      }))
                      .filter(i => i.title);
                  }

                  return listItems.map(li => {
                    const link = li.querySelector(':scope > a, :scope > .wp-block-navigation-item__content, :scope > div > a');
                    const subList = li.querySelector(':scope > ul, :scope > ol, :scope > .wp-block-navigation__submenu-container, :scope > .sub-menu, :scope > div > ul');
                    return {
                      title: (link?.querySelector?.('.wp-block-navigation-item__label')?.textContent || link?.textContent || '').trim(),
                      link: link?.getAttribute?.('href') || '#',
                      children: subList ? parseList(subList) : []
                    };
                  }).filter(i => i.title);
                }

                  const hasDirectMenuItems = Array.from(tempDiv.children || []).some(child => child.tagName === 'LI');
                  if (hasDirectMenuItems) {
                    const directItems = parseList(tempDiv);
                    if (directItems.length > 0) return directItems;
                  }

                const candidates = Array.from(
                  tempDiv.querySelectorAll('#main-menu, .ha-navbar-nav, .elementor-nav-menu, .wp-block-navigation__container, nav ul, nav, ul[class*="menu"], ul[class*="nav"], ul, ol')
                );
                function countDeep(items) {
                  return items.reduce((acc, it) => acc + 1 + countDeep(it.children || []), 0);
                }
                function countSubmenus(items) {
                  return items.reduce((acc, it) => acc + (it.children?.length || 0) + countSubmenus(it.children || []), 0);
                }
                function hasMenuSignal(element) {
                  const signature = ((element.id || '') + ' ' + (element.className || '') + ' ' + (element.getAttribute?.('role') || '')).toLowerCase();
                  return /main-menu|nav|navbar|navigation|menu/.test(signature);
                }
                  function isNestedSubmenuCandidate(element) {
                    const tokens = Array.from(element.classList || []).map(token => token.toLowerCase());
                    return tokens.some(token => token === 'sub-menu' || token === 'submenu' || token === 'dropdown' || token === 'children' || token.includes('__submenu') || token.includes('submenu-panel') || token.includes('dropdown-menu') || token.includes('wp-block-navigation-submenu'));
                  }
                let best = [], bestScore = -1;
                for (const candidate of candidates) {
                    if (isNestedSubmenuCandidate(candidate)) continue;
                  const parsed = parseList(candidate);
                  const nestedPenalty = candidate.closest('li') ? 300 : 0;
                  const submenuBonus = countSubmenus(parsed) > 0 ? 50 : 0;
                  const score = (hasMenuSignal(candidate) ? 1000 : 0) + (parsed.length * 25) + (countDeep(parsed) * 2) + submenuBonus - nestedPenalty;
                  if (score > bestScore) { bestScore = score; best = parsed; }
                }
                return best.length ? best : parseList(tempDiv);
              }

              let itemsSource = source;
              if (!Array.isArray(source)) {
                itemsSource = source.items || source.children || source.menu_items || source.data || source.nodes || source.edges || [source];
              }

              if (Array.isArray(itemsSource)) {
                const renderedMenus = itemsSource
                  .map(item => item?.content?.rendered)
                  .filter(html => typeof html === 'string' && /<\s*(li|ul|nav|a)\b/i.test(html));
                if (renderedMenus.length > 0) {
                  return renderedMenus.flatMap(html => fromHTML(html));
                }
                
                const hasParentRefs = itemsSource.some(item => 
                  (item.parent !== undefined && item.parent.toString() !== "0") || 
                  (item.menu_item_parent !== undefined && item.menu_item_parent.toString() !== "0") ||
                  (item.parentId !== undefined && item.parentId.toString() !== "0")
                );
                const hasNestedItems = itemsSource.some(item => {
                  const children = item.child_items || item.children || item.items || item.sub_items || item.nodes || item.edges || [];
                  return Array.isArray(children) && children.length > 0;
                });
                
                if (hasParentRefs && !hasNestedItems) return buildTree(itemsSource);
                if (hasParentRefs && hasNestedItems) {
                  const ids = new Set(itemsSource.map(item => (item.id || item.ID || item.db_id || item.object_id || item.key || item.node?.id || '').toString()).filter(Boolean));
                  itemsSource = itemsSource.filter(item => {
                    const parent = (firstPresent(item.parent, item.menu_item_parent, item.parentId, item.meta?.menu_item_parent, item.node?.parentId) || 0).toString();
                    return parent === '0' || parent === '' || !ids.has(parent);
                  });
                }
                
                return itemsSource.map(item => {
                  const title = item.title?.rendered || item.title || item.label || item.name || item.post_title || item.text || item.node?.title || 'Sem título';
                  const link = normalizeLink(firstPresent(item.url, item.link, item.guid, item.href, item.node?.url)) || '#';
                  const children = item.child_items || item.children || item.items || item.sub_items || item.nodes || item.edges || [];
                  return {
                    title,
                    link: link,
                    children: Array.isArray(children) && children.length > 0 ? extractItems(children) : []
                  };
                }).filter(i => i.title);
              }
              return [];
            }

            const items = extractItems(data);
            console.log('Widget: Itens extraídos:', items);

            const htmlContent = renderItems(items);
            if (htmlContent && htmlContent.trim().length > 5) {
              menuContainer.innerHTML = htmlContent;
              if (typeof highlightActiveLink === 'function') highlightActiveLink();
              return;
            }
          }
        } catch (e) { console.warn('WP API fail:', e.message); }
      }

      if (enableAutoDetect) {
        console.log('Tentando auto-detecção...');
        const selectors = [
          'nav', '.main-navigation', '.elementor-nav-menu', '.header-menu', '#site-navigation', 
          'ul[class*="menu"]', '.wp-block-navigation', '.navbar', '.nav-menu', '.navigation',
          '[role="navigation"]', 'header .links', '.header__nav', '#header-menu', '.menu-primary-container'
        ];
        const previewFrame = document.querySelector('iframe[title="Site Preview"]');
        let targetDoc = document;
        try {
          if (previewFrame && previewFrame.contentDocument) targetDoc = previewFrame.contentDocument;
          else if (previewFrame && previewFrame.contentWindow) targetDoc = previewFrame.contentWindow.document;
        } catch (e) { console.warn('CORS restrict'); }

        for (const selector of selectors) {
          const containers = targetDoc.querySelectorAll(selector);
          for (const container of containers) {
            function getDOMItems(el, depth = 0) {
              if (depth > 4) return [];
              const items = [];
              const listItems = Array.from(el.children).filter(child => child.tagName === 'LI');
              
              if (listItems.length === 0 && depth === 0) {
                const nestedUl = el.querySelector('ul');
                if (nestedUl) return getDOMItems(nestedUl, depth + 1);
              }

              if (listItems.length === 0 && depth === 0) {
                return Array.from(el.querySelectorAll('a'))
                  .filter(a => a.innerText.trim().length > 0)
                  .slice(0, 15)
                  .map(a => ({ title: a.innerText.trim(), link: a.href, children: [] }));
              }

              listItems.forEach(li => {
                const link = li.querySelector('a');
                if (link) {
                  const sub = li.querySelector('ul, [class*="sub-menu"], [class*="dropdown"]');
                  items.push({ 
                    title: (link.innerText || link.textContent || '').trim(), 
                    link: link.href, 
                    children: sub ? getDOMItems(sub, depth + 1) : [] 
                  });
                }
              });
              return items;
            }
            const items = getDOMItems(container);
            if (items.length >= 1) {
              const html = renderItems(items);
              if (html && html.trim().length > 5) {
                menuContainer.innerHTML = html;
                if (typeof highlightActiveLink === 'function') highlightActiveLink();
                return;
              }
            }
          }
        }
      }
      
      const manualItems = ${JSON.stringify(menuConfig.items)};
      if (manualItems && manualItems.length > 0) {
         console.log('Usando itens manuais:', manualItems);
         menuContainer.innerHTML = renderItems(manualItems);
      }
    }
    setTimeout(initializeMenuDetection, 2500);`;

    const script = `
<script>
  function toggleCustomMenu(btn) {
    const items = document.querySelector('.custom-nav-992 .menu-items');
    const open = items.classList.toggle('active');
    const toggle = btn || document.querySelector('.custom-nav-992 .mobile-toggle');
    if (toggle) toggle.classList.toggle('open', open);
  }

  function openCustomSpotlight() {
    const sp = document.querySelector('.custom-spotlight-9982');
    if (!sp) return;
    sp.classList.add('open');
    const input = sp.querySelector('input');
    setTimeout(() => input && input.focus(), 120);
  }
  function closeCustomSpotlight() {
    const sp = document.querySelector('.custom-spotlight-9982');
    if (sp) sp.classList.remove('open');
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCustomSpotlight();
  });

  // Lógica para submenus no Mobile (clique)
  document.addEventListener('click', function(e) {
    const hasSubmenu = e.target.closest('.custom-nav-992 .has-submenu');
    const navEl = document.querySelector('.custom-nav-992');
    const isMobileMode = window.innerWidth <= 850 || (navEl && navEl.classList.contains('force-mobile')) || (${tabletHamburger} && ((window.innerWidth <= 1024 && window.innerWidth >= 851) || (navEl && navEl.classList.contains('force-tablet'))));
    if (hasSubmenu && isMobileMode) {
      const link = e.target.closest('a');
      // Se clicou na seta ou no item pai e ele tem submenu, toggle
      if (link && link.parentElement === hasSubmenu) {
        e.preventDefault();
        hasSubmenu.classList.toggle('open');
      }
    }
  });

  function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    const links = document.querySelectorAll('.custom-nav-992 .menu-items a');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      // Checagem exata ou base
      const isExact = currentPath === href || currentUrl === href;
      const isBase = href !== '/' && (currentPath.startsWith(href) || currentUrl.startsWith(href));
      
      if (isExact || isBase) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function checkMenuFit() {
    const nav = document.querySelector('.custom-nav-992');
    if (!nav) return;
    if (window.innerWidth <= 850) { nav.classList.remove('force-mobile'); return; }
    // Mede no modo desktop: se o conteúdo não couber (itens ficariam apertados), quebra para mobile.
    nav.classList.remove('force-mobile');
    if (nav.scrollWidth > nav.clientWidth + 1) {
      nav.classList.add('force-mobile');
    }
  }

  function initMenu() {
    highlightActiveLink();
    ${fetchScript}
    checkMenuFit();
    window.addEventListener('resize', checkMenuFit);
    // Recalcula após carregar fontes/imagens.
    window.addEventListener('load', checkMenuFit);
    setTimeout(checkMenuFit, 300);

    // Fechar menu mobile ao clicar fora
    document.addEventListener('click', (e) => {
      const nav = document.querySelector('.custom-nav-992');
      const items = document.querySelector('.custom-nav-992 .menu-items');
      if (nav && !nav.contains(e.target) && items.classList.contains('active')) {
        items.classList.remove('active');
        const toggle = nav.querySelector('.mobile-toggle');
        if (toggle) toggle.classList.remove('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }
  window.addEventListener('popstate', highlightActiveLink);
</script>`;

    function renderHierarchicalItems(items) {
      if (!items || items.length === 0) return '';
      return items.map(item => {
        const hasChildren = item.children && item.children.length > 0;
        if (hasChildren) {
          return `<div class="has-submenu">
            <a href="${item.link}">${item.label}</a>
            <ul class="submenu">
              ${renderHierarchicalItems(item.children)}
            </ul>
          </div>`;
        }
        return `<a href="${item.link}">${item.label}</a>`;
      }).join('\n');
    }

    const isSvgUrl = (u: string) => /\.svg(\?|#|$)/i.test(u || '');
    const getLogoBaseColor = () => menuConfig.logoColor || menuConfig.textColor || '#000000';
    const svgLogoTag = (url: string, cls: string) => `<span class="${cls} logo-svg" role="img" aria-label="Logo" data-logo-color="${getLogoBaseColor()}" data-logo-hover="${menuConfig.hoverTextColor}" onmouseenter="this.style.backgroundColor=this.dataset.logoHover" onmouseleave="this.style.backgroundColor=this.dataset.logoColor" style="-webkit-mask:url('${url}') no-repeat left center / contain;mask:url('${url}') no-repeat left center / contain;background-color:${getLogoBaseColor()};"></span>`;
    const logoDesktopTag = isSvgUrl(menuConfig.logoUrl) ? svgLogoTag(menuConfig.logoUrl, 'logo-desktop') : `<img class="logo-desktop" src="${menuConfig.logoUrl}" alt="Logo">`;
    const logoMobileTag = menuConfig.logoUrlMobile ? (isSvgUrl(menuConfig.logoUrlMobile) ? svgLogoTag(menuConfig.logoUrlMobile, 'logo-mobile') : `<img class="logo-mobile" src="${menuConfig.logoUrlMobile}" alt="Logo">`) : '';
    const html = `
<!-- Início: Menu Responsivo Nativo -->
<nav class="custom-nav-992">
  <div class="logo">
    <a href="/">${logoDesktopTag}${logoMobileTag}</a>
  </div>
  <button class="mobile-toggle" onclick="toggleCustomMenu(this)" aria-label="Menu">
    <span class="bars"><span></span><span></span><span></span></span>
  </button>
  <div class="menu-items">
    ${menuConfig.items.length > 0 
      ? renderHierarchicalItems(menuConfig.items) // Force correct function call
      : '<!-- Aguardando carregamento... -->'
    }
  </div>
  ${menuConfig.searchEnabled ? `<form class="nav-search" role="search" method="get" action="${menuConfig.searchUrl}">
    <button type="submit" aria-label="Buscar" style="background:none;border:none;padding:0;cursor:pointer;color:inherit;display:flex;">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
    </button>
    <input type="search" name="s" placeholder="Buscar..." aria-label="Buscar">
  </form>
  <button class="search-toggle" onclick="openCustomSpotlight()" aria-label="Buscar">
    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
  </button>` : ''}
</nav>
${menuConfig.searchEnabled ? `<div class="custom-spotlight-9982" onclick="if(event.target===this)closeCustomSpotlight()">
  <form class="spotlight-box" role="search" method="get" action="${menuConfig.searchUrl}">
    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5 1.49-1.49-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
    <input type="search" name="s" placeholder="Buscar..." aria-label="Buscar">
  </form>
</div>` : ''}
<!-- Fim: Menu Responsivo Nativo -->`;

    return css + "\n" + html + "\n" + script;
  };


  // Função utilitária para obter o código gerado
  const getGeneratedCode = () => {
    if (activeWidgetType === 'whatsapp') return generateWhatsappCode();
    if (activeWidgetType === 'banner') return generateBannerCode();
    return generateMenuCode();
  };

  return (
    <div className="container mx-auto py-10 px-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Construtor de Widgets Externos</h1>
              <p className="text-muted-foreground">Crie ferramentas para usar em sites de terceiros (WordPress, Elementor, etc).</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-wider font-bold" onClick={() => loadDemo('whatsapp')}>Demo Whats</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-wider font-bold" onClick={() => loadDemo('banner')}>Demo Banner</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-wider font-bold border-primary/40 text-primary" onClick={() => loadDemo('menu')}>Demo Menu c/ Submenu</Button>
              </div>

            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" />
                  {currentTemplateId ? 'Atualizar Modelo' : 'Salvar Novo Modelo'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salvar Configuração do Widget</DialogTitle>
                  <DialogDescription>
                    Salve este modelo para usá-lo ou editá-lo novamente depois.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="name">Nome do Modelo</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Menu Principal Elementor" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={saveTemplate} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Confirmar Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="md:w-auto w-full" variant="secondary" onClick={() => setViewMode('code')}>
              Gerar Código para Copiar
            </Button>

          </div>
        </div>

        {currentTemplateId && draftSavedAt && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <Save className="h-4 w-4 text-amber-600" />
            <AlertTitle>Rascunho salvo automaticamente</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">
                Alterações não salvas em <strong>{templateName || 'modelo'}</strong> — salvas localmente às {new Date(draftSavedAt).toLocaleTimeString()}.
              </span>
              <span className="flex gap-2 shrink-0">
                <Button size="sm" variant="default" disabled={isSaving} onClick={overwriteWithDraft}>
                  Sobrepor modelo
                </Button>
                <Button size="sm" variant="outline" disabled={isSaving} onClick={saveDraftAsNew}>
                  Salvar como novo
                </Button>
              </span>
            </AlertDescription>
          </Alert>
        )}




        <Alert className="bg-primary/5 border-primary/20">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <AlertTitle>Foco em Implementação Externa</AlertTitle>
          <AlertDescription>
            Tudo o que você configurar aqui gera um código independente para ser colado em outros sites. Nenhuma alteração afetará este sistema atual.
          </AlertDescription>

        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Configurações */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Tipo de Widget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant={activeWidgetType === 'whatsapp' ? 'default' : 'outline'} 
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setActiveWidgetType('whatsapp')}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Botão WhatsApp</span>
                </Button>
                <Button 
                  variant={activeWidgetType === 'banner' ? 'default' : 'outline'} 
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setActiveWidgetType('banner')}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Banner de Aviso</span>
                </Button>
                <Button 
                  variant={activeWidgetType === 'menu' ? 'default' : 'outline'} 
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setActiveWidgetType('menu')}
                >
                  <MenuIcon className="h-5 w-5" />
                  <span>Menu Responsivo</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" /> Modelos Salvos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {savedTemplates.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum modelo salvo ainda.</p>
                ) : (
                  savedTemplates.map((template) => (
                    <div key={template.id} className={cn(
                      "flex items-center justify-between p-2 rounded-lg border text-sm transition-colors",
                      currentTemplateId === template.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                    )}>
                      <div className="flex flex-col truncate pr-2 cursor-pointer flex-1" onClick={() => loadTemplate(template)}>
                        <span className="font-medium truncate">{template.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{template.type}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadTemplate(template)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>

              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeWidgetType === 'whatsapp' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Número do WhatsApp</Label>
                      <Input 
                        value={whatsappConfig.phone}
                        onChange={(e) => setWhatsappConfig({...whatsappConfig, phone: e.target.value})}
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input 
                        value={whatsappConfig.text}
                        onChange={(e) => setWhatsappConfig({...whatsappConfig, text: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-1 cursor-pointer"
                            value={whatsappConfig.bgColor}
                            onChange={(e) => setWhatsappConfig({...whatsappConfig, bgColor: e.target.value})}
                          />
                          <span className="text-xs font-mono uppercase">{whatsappConfig.bgColor}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Texto</Label>
                        <div className="flex gap-2 items-center">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-1 cursor-pointer"
                            value={whatsappConfig.textColor}
                            onChange={(e) => setWhatsappConfig({...whatsappConfig, textColor: e.target.value})}
                          />
                          <span className="text-xs font-mono uppercase">{whatsappConfig.textColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Posição</Label>
                      <Select 
                        value={whatsappConfig.position} 
                        onValueChange={(val) => setWhatsappConfig({...whatsappConfig, position: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a posição" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">Canto Inferior Direito</SelectItem>
                          <SelectItem value="left">Canto Inferior Esquerdo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <Label>Arredondamento</Label>
                        <span className="text-xs text-muted-foreground">{whatsappConfig.borderRadius}px</span>
                      </div>
                      <Slider 
                        value={[parseInt(whatsappConfig.borderRadius)]} 
                        max={50} 
                        step={1} 
                        onValueChange={(vals) => setWhatsappConfig({...whatsappConfig, borderRadius: vals[0].toString()})} 
                      />
                    </div>
                  </>
                ) : activeWidgetType === 'banner' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea 
                        value={bannerConfig.message}
                        onChange={(e) => setBannerConfig({...bannerConfig, message: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link de Destino</Label>
                      <Input 
                        value={bannerConfig.link}
                        onChange={(e) => setBannerConfig({...bannerConfig, link: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={bannerConfig.bgColor}
                          onChange={(e) => setBannerConfig({...bannerConfig, bgColor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Texto</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={bannerConfig.textColor}
                          onChange={(e) => setBannerConfig({...bannerConfig, textColor: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="dismissible" className="cursor-pointer">Permitir fechar (X)</Label>
                      <Switch 
                        id="dismissible" 
                        checked={bannerConfig.isDismissible}
                        onCheckedChange={(val) => setBannerConfig({...bannerConfig, isDismissible: val})}
                      />
                    </div>
                  </>
                ) : null}

                {/* CONFIG: MENU */}
                {activeWidgetType === 'menu' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL do Logo (Desktop)</Label>
                      <Input 
                        value={menuConfig.logoUrl}
                        onChange={(e) => setMenuConfig({...menuConfig, logoUrl: e.target.value})}
                        placeholder="https://sua-logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL do Logo (Mobile / Tablet)</Label>
                      <Input 
                        value={menuConfig.logoUrlMobile}
                        onChange={(e) => setMenuConfig({...menuConfig, logoUrlMobile: e.target.value})}
                        placeholder="Opcional — logo alternativa em telas pequenas"
                      />
                      <p className="text-xs text-muted-foreground">Se vazio, usa o logo desktop também no mobile/tablet.</p>
                    </div>
                    {(/\.svg(\?|#|$)/i.test(menuConfig.logoUrl) || /\.svg(\?|#|$)/i.test(menuConfig.logoUrlMobile)) && (
                      <div className="space-y-2">
                        <Label>Cor do Logo (SVG)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            className="h-9 w-14 p-1"
                            value={menuConfig.logoColor || '#000000'}
                            onChange={(e) => setMenuConfig({...menuConfig, logoColor: e.target.value})}
                          />
                          <Input
                            value={menuConfig.logoColor}
                            onChange={(e) => setMenuConfig({...menuConfig, logoColor: e.target.value})}
                            placeholder="Ex: #4f46e5 (vazio = cor original)"
                          />
                          {menuConfig.logoColor && (
                            <Button variant="outline" size="sm" onClick={() => setMenuConfig({...menuConfig, logoColor: ''})}>Limpar</Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Detectado SVG: aplica esta cor ao logo. Deixe vazio para manter as cores originais.</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Fundo</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={menuConfig.bgColor}
                          onChange={(e) => setMenuConfig({...menuConfig, bgColor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Texto</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={menuConfig.textColor}
                          onChange={(e) => setMenuConfig({...menuConfig, textColor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Destaque</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={menuConfig.accentColor}
                          onChange={(e) => setMenuConfig({...menuConfig, accentColor: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fonte</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={menuConfig.fontFamily}
                        onChange={(e) => setMenuConfig({...menuConfig, fontFamily: e.target.value})}
                      >
                        <option value="system-ui, -apple-system, sans-serif">Sistema (padrão)</option>
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Poppins', sans-serif">Poppins</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Montserrat', sans-serif">Montserrat</option>
                        <option value="Georgia, serif">Georgia (serifada)</option>
                        <option value="'Courier New', monospace">Monoespaçada</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Fonte (px)</Label>
                        <Input 
                          type="number" min={10} max={24}
                          value={menuConfig.fontSize}
                          onChange={(e) => setMenuConfig({...menuConfig, fontSize: Number(e.target.value) || 15})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Espaço (px)</Label>
                        <Input 
                          type="number" min={0} max={40}
                          value={menuConfig.itemSpacing}
                          onChange={(e) => setMenuConfig({...menuConfig, itemSpacing: Number(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Padding (px)</Label>
                        <Input 
                          type="number" min={4} max={40}
                          value={menuConfig.itemPadding}
                          onChange={(e) => setMenuConfig({...menuConfig, itemPadding: Number(e.target.value) || 15})}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Mouse sobre o item (hover)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Fundo hover</Label>
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer"
                            value={menuConfig.hoverBgColor}
                            onChange={(e) => setMenuConfig({...menuConfig, hoverBgColor: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Texto hover</Label>
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer"
                            value={menuConfig.hoverTextColor}
                            onChange={(e) => setMenuConfig({...menuConfig, hoverTextColor: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Página ativa (borda)</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Cor</Label>
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer"
                            value={menuConfig.activeBorderColor}
                            onChange={(e) => setMenuConfig({...menuConfig, activeBorderColor: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Espessura</Label>
                          <Input type="number" min={0} max={6}
                            value={menuConfig.activeBorderWidth}
                            onChange={(e) => setMenuConfig({...menuConfig, activeBorderWidth: Number(e.target.value) || 0})} />
                       </div>
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Raio ativo PC (%): {menuConfig.activeRadius}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.activeRadius]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, activeRadius: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Raio ativo Tablet (%): {menuConfig.activeRadiusTablet}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.activeRadiusTablet]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, activeRadiusTablet: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Raio ativo Mobile (%): {menuConfig.activeRadiusMobile}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.activeRadiusMobile]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, activeRadiusMobile: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Arred. Itens PC (%): {menuConfig.itemRadius}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.itemRadius]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, itemRadius: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Arred. Itens Tablet (%): {menuConfig.itemRadiusTablet}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.itemRadiusTablet]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, itemRadiusTablet: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Arred. Itens Mobile (%): {menuConfig.itemRadiusMobile}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.itemRadiusMobile]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, itemRadiusMobile: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Espaçamento submenu PC (px): {menuConfig.submenuGap}px {menuConfig.submenuGap === 0 ? '(colado)' : ''}</Label>
                         <Slider min={0} max={40} step={1}
                           value={[menuConfig.submenuGap]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, submenuGap: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Espaçamento submenu Tablet (px): {menuConfig.submenuGapTablet}px {menuConfig.submenuGapTablet === 0 ? '(colado)' : ''}</Label>
                         <Slider min={0} max={40} step={1}
                           value={[menuConfig.submenuGapTablet]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, submenuGapTablet: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Espaçamento submenu Mobile (px): {menuConfig.submenuGapMobile}px {menuConfig.submenuGapMobile === 0 ? '(colado)' : ''}</Label>
                         <Slider min={0} max={40} step={1}
                           value={[menuConfig.submenuGapMobile]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, submenuGapMobile: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Tamanho da sombra (px): {menuConfig.shadowSize}px {menuConfig.shadowSize === 0 ? '(sem sombra)' : ''}</Label>
                         <Slider min={0} max={80} step={1}
                           value={[menuConfig.shadowSize]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, shadowSize: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Intensidade da sombra (%): {menuConfig.shadowIntensity}%</Label>
                         <Slider min={0} max={100} step={1}
                           value={[menuConfig.shadowIntensity]}
                           onValueChange={(v) => setMenuConfig({...menuConfig, shadowIntensity: v[0]})} />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs">Menu no Tablet</Label>
                         <div className="flex gap-2">
                           <Button type="button" size="sm" variant={(menuConfig.tabletMenuMode ?? 'header') === 'header' ? 'default' : 'outline'}
                             className="flex-1" onClick={() => setMenuConfig({...menuConfig, tabletMenuMode: 'header'})}>
                             Itens no cabeçalho (PC)
                           </Button>
                           <Button type="button" size="sm" variant={menuConfig.tabletMenuMode === 'hamburger' ? 'default' : 'outline'}
                             className="flex-1" onClick={() => setMenuConfig({...menuConfig, tabletMenuMode: 'hamburger'})}>
                             Hambúrguer
                           </Button>
                         </div>
                         <p className="text-xs text-muted-foreground">Escolha se o tablet mostra os itens de texto no cabeçalho (como no PC) ou o menu hambúrguer.</p>
                       </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Fundo (ativo)</Label>
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer"
                            value={menuConfig.activeBgColor === 'transparent' ? '#ffffff' : menuConfig.activeBgColor}
                            onChange={(e) => setMenuConfig({...menuConfig, activeBgColor: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Texto (ativo)</Label>
                          <Input type="color" className="w-full h-10 p-1 cursor-pointer"
                            value={menuConfig.activeTextColor}
                            onChange={(e) => setMenuConfig({...menuConfig, activeTextColor: e.target.value})} />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]"
                        onClick={() => setMenuConfig({...menuConfig, activeBgColor: 'transparent'})}>
                        Fundo transparente
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => {
                          const frame = document.querySelector('iframe[title="Site Preview"]') as HTMLIFrameElement;
                          if (frame) {
                            frame.src = frame.src; // Força recarregamento e nova detecção
                            toast({ title: "Sincronizando...", description: "Refazendo varredura visual do site." });
                          }
                        }}
                      >
                        <RefreshCw className="h-3 w-3" /> Forçar Varredura Visual
                      </Button>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <Label htmlFor="sticky">Menu Fixo (Sticky)</Label>
                      <Switch 
                        id="sticky" 
                        checked={menuConfig.sticky}
                        onCheckedChange={(val) => setMenuConfig({...menuConfig, sticky: val})}
                      />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <Label htmlFor="searchEnabled">Barra de Busca</Label>
                      <Switch 
                        id="searchEnabled" 
                        checked={menuConfig.searchEnabled}
                        onCheckedChange={(val) => setMenuConfig({...menuConfig, searchEnabled: val})}
                      />
                    </div>
                    {menuConfig.searchEnabled && (
                      <div className="space-y-2">
                        <Label>URL de Busca do Site</Label>
                        <Input 
                          value={menuConfig.searchUrl}
                          onChange={(e) => setMenuConfig({...menuConfig, searchUrl: e.target.value})}
                          placeholder="https://seusite.com/"
                        />
                        <p className="text-xs text-muted-foreground">No WordPress use a URL base do site (ex: https://anabrasil.org/). A busca envia o termo via parâmetro <code>?s=</code>.</p>
                        {/* ===== Seção: Busca ===== */}
                        <div className="rounded-lg border p-3 mt-3 space-y-3 text-center">
                          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Busca</p>
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="space-y-1">
                              <Label className="text-xs">Cor de Fundo</Label>
                              <Input type="color" value={(menuConfig.searchBgColor || "#ffffff").slice(0,7)} onChange={(e) => setMenuConfig({...menuConfig, searchBgColor: e.target.value})} className="h-9 p-1" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Cor do Ícone/Texto</Label>
                              <Input type="color" value={menuConfig.searchIconColor} onChange={(e) => setMenuConfig({...menuConfig, searchIconColor: e.target.value})} className="h-9 p-1" />
                            </div>
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Tamanho do Ícone Buscar: {menuConfig.searchIconSize}px</Label>
                            <Slider min={12} max={32} step={1} value={[menuConfig.searchIconSize]} onValueChange={([val]) => setMenuConfig({...menuConfig, searchIconSize: val})} />
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Arredondamento: {menuConfig.searchRadius}%</Label>
                            <Slider min={0} max={100} step={1} value={[menuConfig.searchRadius]} onValueChange={([val]) => setMenuConfig({...menuConfig, searchRadius: val})} />
                          </div>
                        </div>

                        {/* ===== Seção: Menu Hambúrguer (mobile/tablet) ===== */}
                        <div className="rounded-lg border p-3 mt-3 space-y-3 text-center">
                          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Menu Hambúrguer</p>
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="space-y-1">
                              <Label className="text-xs">Cor do Ícone</Label>
                              <Input type="color" value={menuConfig.hamburgerColor} onChange={(e) => setMenuConfig({...menuConfig, hamburgerColor: e.target.value})} className="h-9 p-1" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Cor de Fundo</Label>
                              <Input type="color" value={(menuConfig.hamburgerBgColor || "#ffffff").slice(0,7)} onChange={(e) => setMenuConfig({...menuConfig, hamburgerBgColor: e.target.value})} className="h-9 p-1" />
                            </div>
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Tamanho do Ícone: {menuConfig.hamburgerSize}px</Label>
                            <Slider min={16} max={40} step={1} value={[menuConfig.hamburgerSize]} onValueChange={([val]) => setMenuConfig({...menuConfig, hamburgerSize: val})} />
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Tamanho do Fundo (quadrado): {menuConfig.toggleSize}px</Label>
                            <Slider min={28} max={60} step={1} value={[menuConfig.toggleSize]} onValueChange={([val]) => setMenuConfig({...menuConfig, toggleSize: val})} />
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Arredondamento: {menuConfig.hamburgerRadius}%</Label>
                            <Slider min={0} max={100} step={1} value={[menuConfig.hamburgerRadius]} onValueChange={([val]) => setMenuConfig({...menuConfig, hamburgerRadius: val})} />
                          </div>
                        </div>

                        {/* ===== Seção: Busca Mobile/Tablet (Spotlight) ===== */}
                        <div className="rounded-lg border p-3 mt-3 space-y-3 text-center">
                          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Busca Mobile/Tablet (Spotlight)</p>
                          <div className="space-y-2 text-left">
                            <Label>Arredondamento: {menuConfig.spotlightRadius}%</Label>
                            <Slider min={0} max={100} step={1} value={[menuConfig.spotlightRadius]} onValueChange={([val]) => setMenuConfig({...menuConfig, spotlightRadius: val})} />
                          </div>
                          <div className="space-y-2 text-left">
                            <Label>Padding Lateral: {menuConfig.spotlightPaddingX}px</Label>
                            <Slider min={0} max={80} step={1} value={[menuConfig.spotlightPaddingX]} onValueChange={([val]) => setMenuConfig({...menuConfig, spotlightPaddingX: val})} />
                          </div>
                          <div className="space-y-1 text-left">
                            <Label>Alinhamento Vertical</Label>
                            <Select value={menuConfig.spotlightAlign} onValueChange={(val) => setMenuConfig({...menuConfig, spotlightAlign: val})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top">Superior</SelectItem>
                                <SelectItem value="center">Centro</SelectItem>
                                <SelectItem value="bottom">Inferior</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-2 border-t mt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Sincronizar via API WP</Label>
                          <p className="text-[10px] text-muted-foreground">Busca itens via JSON do WordPress.</p>
                        </div>
                        <Switch 
                          checked={menuConfig.enableWpApi}
                          onCheckedChange={(val) => setMenuConfig({...menuConfig, enableWpApi: val})}
                        />
                      </div>

                      {menuConfig.enableWpApi && (
                        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Endpoint WordPress (JSON)</Label>
                          <Input 
                            placeholder="Ex: https://site.com/wp-json/wp/v2/menu-items"
                            value={menuConfig.wpApiUrl}
                            onChange={(e) => setMenuConfig({...menuConfig, wpApiUrl: e.target.value})}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Auto-detecção via URL</Label>
                          <p className="text-[10px] text-muted-foreground">Varredura visual do site para achar menus.</p>
                        </div>
                        <Switch 
                          checked={menuConfig.enableAutoDetect}
                          onCheckedChange={(val) => setMenuConfig({...menuConfig, enableAutoDetect: val})}
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t mt-4">
                      <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <Code className="h-3 w-3" /> Importar via JSON
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Cole o JSON da API do WordPress (ex.: /wp-json/wp/v2/navigation) para detectar menu e subitens.
                      </p>
                      <Button size="sm" variant="outline" onClick={() => importMenuFromUrl(menuConfig.testUrl || 'https://anabrasil.org/ana/')}>
                        Importar pela URL padrão ANA
                      </Button>
                      <Textarea
                        placeholder='[{"id":2060,"content":{"rendered":"<li>...</li>"}}]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="font-mono text-[10px] min-h-[120px]"
                      />
                      <Button size="sm" onClick={importMenuFromJson} disabled={!jsonInput.trim()}>
                        Ler JSON e Importar Menu
                      </Button>
                    </div>

                    </div>

                    <div className="space-y-4 pt-2 border-t mt-4">
                      <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Ambiente de Teste
                      </Label>
                      <div className="space-y-2">
                        <Label className="text-xs">URL do Site para Preview</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://seusite.com"
                            value={menuConfig.testUrl}
                            onChange={(e) => {
                              const url = e.target.value;
                              setMenuConfig({...menuConfig, testUrl: url});
                              setMenuDetectionDetails(url.startsWith('http') ? {
                                status: 'checking',
                                message: 'Verificando endpoints do WordPress e procurando submenus...'
                              } : null);
                              
                              if (url && url.startsWith('http')) {
                                // Limpa timer anterior se existir
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                
                                debounceRef.current = setTimeout(async () => {
                                  try {
                                    const proxyDetected = await importMenuFromUrl(url);
                                    if (proxyDetected) return;

                                    const origin = new URL(url).origin;
                                    const endpoints = [
                                      '/wp-json/wp/v2/navigation',
                                      '/wp-json/wp/v2/menu-items',
                                      '/wp-json/menus/v1/menus',
                                       '/wp-json/menus/v1/locations/primary'
                                    ];

                                     let detected = false;
                                     let bestDetectedScore = 0;
                                     for (const endpoint of endpoints) {
                                      try {
                                        // Usar fetch normal primeiro, se falhar por CORS ele cai no catch
                                         const testRes = await fetch(`${origin}${endpoint}`, { method: 'GET', mode: 'cors' });
                                         if (testRes.ok) {
                                           let data = await testRes.json();
                                           let usedEndpoint = endpoint;

                                           // O endpoint /wp-json/menus/v1/menus retorna apenas a LISTA de menus
                                           // (term_id, name, count) SEM os itens. Os itens com submenus (child_items)
                                           // só vêm no detalhe: /wp-json/menus/v1/menus/{term_id}.
                                           // Por isso, ao detectar a lista, seguimos automaticamente para o detalhe.
                                           const isMenuList = Array.isArray(data) && data.length > 0
                                             && data[0] && (data[0].term_id || data[0].ID || data[0].id)
                                             && !data[0].url && !data[0].items && !data[0].child_items;

                                           if (isMenuList) {
                                             // Escolhe o menu com mais itens (count) ou o primeiro disponível.
                                             const best = [...data].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
                                             const menuId = best.term_id || best.ID || best.id;
                                             try {
                                               const detailRes = await fetch(`${origin}/wp-json/menus/v1/menus/${menuId}`, { method: 'GET', mode: 'cors' });
                                               if (detailRes.ok) {
                                                 const detailData = await detailRes.json();
                                                 console.log('Detalhe do menu detectado:', detailData);
                                                 data = detailData;
                                                 usedEndpoint = `/wp-json/menus/v1/menus/${menuId}`;
                                               }
                                             } catch (detailErr) { /* mantém data original */ }
                                           }

                                           if (data && (Array.isArray(data) || typeof data === 'object')) {
                                             console.log('Dados detectados via API:', data);
                                              const wpItems = extractWPItems(data);
                                             console.log('Itens extraídos (hierárquicos):', wpItems);
                                              const submenuCount = countSubmenuItems(wpItems);
                                               const detectedScore = wpItems.length + submenuCount;
                                             
                                             setMenuConfig(prev => ({
                                               ...prev, 
                                               wpApiUrl: `${origin}${usedEndpoint}`,
                                               items: wpItems.length > 0 ? wpItems : prev.items
                                             }));
                                              setMenuDetectionDetails({
                                                status: wpItems.length > 0 ? 'success' : 'warning',
                                                message: wpItems.length > 0
                                                  ? submenuCount > 0
                                                    ? 'Menu detectado com hierarquia preservada.'
                                                    : 'Menu detectado, mas nenhum subitem foi encontrado neste endpoint.'
                                                  : 'Endpoint encontrado, mas sem itens de menu legíveis.',
                                                endpoint: `${origin}${usedEndpoint}`,
                                                itemCount: wpItems.length,
                                                submenuCount
                                              });
                                             
                                             toast({
                                               title: "API Detectada!",
                                               description: wpItems.length > 0 
                                                 ? `Importamos ${wpItems.length} itens (com submenus) de ${usedEndpoint}`
                                                 : `Conectado ao endpoint ${usedEndpoint}`,
                                             });
                                              if (wpItems.length > 0) { detected = true; bestDetectedScore = Math.max(bestDetectedScore, detectedScore); break; }
                                           }
                                         }
                                      } catch (e) {
                                        // Se falhar por CORS, tentamos HEAD no-cors apenas para ver se o recurso existe
                                        try {
                                          const headRes = await fetch(`${origin}${endpoint}`, { method: 'HEAD', mode: 'no-cors' });
                                          // No modo no-cors o status é sempre 0, mas se não deu erro de rede é um sinal positivo
                                          if (headRes.type === 'opaque') {
                                             setMenuConfig(prev => ({...prev, wpApiUrl: `${origin}${endpoint}`}));
                                              setMenuDetectionDetails({
                                                status: 'warning',
                                                message: 'Endpoint existe, mas o site bloqueou leitura dos itens por CORS.',
                                                endpoint: `${origin}${endpoint}`
                                              });
                                             toast({
                                              title: "API Possível!",
                                              description: `Detectamos atividade em ${endpoint} (CORS restrito).`,
                                            });
                                            break;
                                          }
                                        } catch (innerE) {}
                                       }
                                     }

                                     // Fallback: muitos menus (Elementor/Happy Addons, etc.) NÃO são
                                     // expostos via REST. Nesses casos, lemos o HTML da própria página
                                     // através de um proxy CORS e extraímos o menu + subitens direto do DOM.
                                      if (url) {
                                       try {
                                          const proxyReaders = [
                                            async () => {
                                              const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                                              return res.ok ? res.text() : '';
                                            },
                                            async () => {
                                              const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                                              if (!res.ok) return '';
                                              const payload = await res.json();
                                              return payload?.contents || '';
                                            }
                                          ];

                                          for (const readHtml of proxyReaders) {
                                            const html = await readHtml();
                                            if (!html) continue;
                                           const wpItems = extractWPItems([{ content: { rendered: html } }]);
                                           const submenuCount = countSubmenuItems(wpItems);
                                           const htmlScore = wpItems.length + submenuCount;
                                           if (wpItems.length > 0 && htmlScore > bestDetectedScore) {
                                             setMenuConfig(prev => ({ ...prev, items: wpItems }));
                                             setMenuDetectionDetails({
                                               status: 'success',
                                               message: submenuCount > 0
                                                 ? 'Menu detectado a partir do HTML da página (com submenus).'
                                                 : 'Menu detectado a partir do HTML da página.',
                                               endpoint: `${origin} (HTML)`,
                                               itemCount: wpItems.length,
                                               submenuCount
                                             });
                                             toast({
                                               title: "Menu Detectado!",
                                               description: `Importamos ${wpItems.length} itens (com submenus) lendo o HTML da página.`,
                                             });
                                              detected = true;
                                               bestDetectedScore = htmlScore;
                                              break;
                                            } else if (!detected) {
                                             setMenuDetectionDetails({
                                               status: 'warning',
                                               message: 'Página lida, mas não encontramos uma estrutura de menu reconhecível.',
                                               endpoint: `${origin} (HTML)`
                                             });
                                           }
                                         }
                                          if (!detected) {
                                            setMenuDetectionDetails({
                                              status: 'warning',
                                              message: 'Não foi possível ler um HTML completo da página pelos proxies disponíveis.',
                                              endpoint: `${origin} (HTML)`
                                            });
                                          }
                                       } catch (htmlErr) {
                                         setMenuDetectionDetails({
                                           status: 'warning',
                                           message: 'Não foi possível ler o HTML da página (CORS/proxy indisponível).'
                                         });
                                       }
                                     }
                                  } catch (e) {
                                    setMenuDetectionDetails({
                                      status: 'error',
                                      message: 'URL inválida ou inacessível para detecção automática.'
                                    });
                                  }
                                }, 1000);
                              }
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">O site abrirá no frame abaixo e tentaremos identificar o endpoint e os itens automaticamente.</p>
                        {menuDetectionDetails && (
                          <Alert className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>
                              {menuDetectionDetails.status === 'checking' ? 'Detectando menu...' : 'Detalhe do menu detectado'}
                            </AlertTitle>
                            <AlertDescription className="space-y-1 text-xs">
                              <p>{menuDetectionDetails.message}</p>
                              {menuDetectionDetails.endpoint && (
                                <p className="break-all">Endpoint: {menuDetectionDetails.endpoint}</p>
                              )}
                              {typeof menuDetectionDetails.itemCount === 'number' && (
                                <p>
                                  Itens principais: {menuDetectionDetails.itemCount} · Subitens: {menuDetectionDetails.submenuCount || 0}
                                </p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Label>Itens do Menu</Label>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" 
                            title="Limpar tudo"
                            onClick={() => setMenuConfig({...menuConfig, items: []})}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-[10px] text-muted-foreground italic">(Sincronizados via API ou Manual)</span>
                      </div>
                      {menuConfig.items.map((item: any, idx) => (
                        <div key={idx} className="space-y-2 mb-4 p-3 border rounded-lg bg-muted/30">
                          <div className="flex gap-2">
                            <div className="flex-1 flex flex-col gap-2">
                              <Input 
                                placeholder="Label" 
                                value={item.label} 
                                onChange={(e) => {
                                  const newItems = [...menuConfig.items];
                                  newItems[idx].label = e.target.value;
                                  setMenuConfig({...menuConfig, items: newItems});
                                }}
                              />
                              <Input 
                                placeholder="Link" 
                                value={item.link}
                                onChange={(e) => {
                                  const newItems = [...menuConfig.items];
                                  newItems[idx].link = e.target.value;
                                  setMenuConfig({...menuConfig, items: newItems});
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="shrink-0 text-destructive"
                                title="Remover item"
                                onClick={() => {
                                  const newItems = [...menuConfig.items];
                                  newItems.splice(idx, 1);
                                  setMenuConfig({...menuConfig, items: newItems});
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="shrink-0 text-primary"
                                title="Adicionar subitem"
                                onClick={() => {
                                  const newItems = [...menuConfig.items];
                                  if (!newItems[idx].children) newItems[idx].children = [];
                                  newItems[idx].children.push({ label: 'Novo Subitem', link: '#' });
                                  setMenuConfig({...menuConfig, items: newItems});
                                }}
                              >
                                <MenuIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Render Sub-items if exist */}
                          {item.children && item.children.length > 0 && (
                            <div className="ml-6 space-y-2 border-l-2 pl-3 mt-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <MenuIcon className="h-3 w-3" /> Subitems ({item.children.length})
                              </p>
                              {item.children.map((child: any, cIdx: number) => (
                                <div key={cIdx} className="flex gap-2">
                                  <div className="flex-1 flex flex-col gap-1">
                                    <Input 
                                      className="h-8 text-xs"
                                      placeholder="Sub Label" 
                                      value={child.label}
                                      onChange={(e) => {
                                        const newItems = [...menuConfig.items];
                                        newItems[idx].children[cIdx].label = e.target.value;
                                        setMenuConfig({...menuConfig, items: newItems});
                                      }}
                                    />
                                    <Input 
                                      className="h-8 text-xs"
                                      placeholder="Sub Link" 
                                      value={child.link}
                                      onChange={(e) => {
                                        const newItems = [...menuConfig.items];
                                        newItems[idx].children[cIdx].link = e.target.value;
                                        setMenuConfig({...menuConfig, items: newItems});
                                      }}
                                    />
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => {
                                      const newItems = [...menuConfig.items];
                                      newItems[idx].children.splice(cIdx, 1);
                                      setMenuConfig({...menuConfig, items: newItems});
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setMenuConfig({
                          ...menuConfig, 
                          items: [...menuConfig.items, { label: 'Novo Item Manual', link: '#', children: [] }]
                        })}
                      >
                        + Adicionar Item Manual
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6 relative">
            <div className="sticky top-24 space-y-6">
              <Card className="overflow-hidden flex flex-col min-h-[600px]">
              <div className="border-b bg-muted/30 px-6 py-3 flex items-center justify-between shrink-0">
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-2">
                      <Code className="h-4 w-4" /> Código
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {viewMode === 'preview' && (
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                    <Button 
                      variant={deviceView === 'desktop' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8"
                      title="Desktop / UHD (16:9)"
                      onClick={() => setDeviceView('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={deviceView === 'tablet' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8"
                      title="Tablet"
                      onClick={() => setDeviceView('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={deviceView === 'mobile' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8"
                      title="Mobile"
                      onClick={() => setDeviceView('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-muted/10 overflow-auto p-4 md:p-8 flex flex-col justify-start items-center gap-4">
                {viewMode === 'preview' && (
                  <div className="w-full shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Demo Interativo do Widget (clique e teste aqui)</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div ref={demoRef} className="relative w-full h-[420px] rounded-lg border bg-background overflow-hidden flex justify-center">
                      {(() => {
                        const demoWidth = (DEVICE_RESOLUTIONS[deviceView] ?? DEVICE_RESOLUTIONS.desktop).width;
                        const scale = demoScale;
                        // Os raios de preview agora são aplicados via getDemoExtraCss em tempo real.
                        return (
                          <iframe
                            title="Demo isolado do widget"
                            className="border-none absolute top-0 left-1/2"
                            style={{
                              width: demoWidth,
                              height: 420 / scale,
                              transform: `translateX(-50%) scale(${scale})`,
                              transformOrigin: 'top center',
                            }}
                            sandbox="allow-scripts"
                            ref={demoIframeRef}
                            srcDoc={demoDoc}
                            key={'demo' + deviceView + activeWidgetType}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
                {viewMode === 'preview' ? (
                  <div
                    ref={frameRef}
                    className={cn(
                      "bg-background shadow-2xl border overflow-hidden relative shrink-0 transition-all duration-500 ease-in-out",
                      deviceView === 'mobile' && "w-[375px] max-w-full aspect-[390/844] rounded-[3rem] border-[8px] border-slate-900",
                      deviceView === 'tablet' && "w-[768px] max-w-full aspect-[810/1080] rounded-[1.5rem] border-[10px] border-slate-900",
                      deviceView === 'desktop' && "w-full max-w-5xl aspect-video rounded-lg"
                    )}
                  >
                    {/* Tela escalada: conteúdo renderizado em resolução nativa e reduzido para caber */}
                    <div
                      className="absolute top-0 left-0 flex flex-col bg-background"
                      style={{
                        width: (DEVICE_RESOLUTIONS[deviceView] ?? DEVICE_RESOLUTIONS.desktop).width,
                        height: (DEVICE_RESOLUTIONS[deviceView] ?? DEVICE_RESOLUTIONS.desktop).height,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                    {menuConfig.testUrl ? (
                      <div className="flex-1 w-full h-full relative">
                        <iframe 
                          src={menuConfig.testUrl} 
                          className="w-full h-full border-none"
                          title="Site Preview"
                          onLoad={(e) => {
                            // Tentar ler itens do DOM via injeção se possível (domínios amigáveis)
                            try {
                              const frame = e.currentTarget;
                              const doc = frame.contentDocument || frame.contentWindow?.document;
                              if (doc) {
                                  const selectors = [
                                    'nav', 
                                    '.main-navigation', 
                                    '.elementor-nav-menu', 
                                    '.header-menu', 
                                    '#site-navigation', 
                                    'ul[class*="menu"]', 
                                    '.wp-block-navigation',
                                    '.navbar',
                                    '.nav-menu',
                                    '.navigation',
                                    '[role="navigation"]',
                                    'header .links',
                                    '.header__nav',
                                    '#header-menu',
                                    '.menu-primary-container'
                                  ];
                                for (const sel of selectors) {
                                  const nav = doc.querySelector(sel);
                                  if (nav) {
                                    const cleanLabel = (text: string) => {
                                      return text.replace(/[\u25BC\u25BE\u25B6\u25B8\u2304\u22EE]/g, '').trim();
                                    };

                                    const getDOMItems = (el: Element, depth = 0): any[] => {
                                      if (depth > 5) return []; // Proteção contra recursão infinita
                                      
                                      const items: any[] = [];
                                      // Buscar apenas os LIs diretos deste nível
                                      const listItems = Array.from(el.children).filter(child => child.tagName === 'LI');
                                      
                                      // Se não tem LIs, procura o primeiro UL filho
                                      if (listItems.length === 0) {
                                        const firstUl = el.querySelector('ul');
                                        if (firstUl && firstUl !== el) return getDOMItems(firstUl, depth + 1);
                                      }

                                      // Fallback se ainda não houver LIs (menus baseados em DIVs ou links diretos)
                                      if (listItems.length === 0 && depth === 0) {
                                        return Array.from(el.querySelectorAll('a'))
                                          .filter(a => (a as HTMLElement).innerText.trim().length > 0)
                                          .slice(0, 12)
                                          .map(a => ({
                                            label: cleanLabel((a as HTMLElement).innerText),
                                            link: (a as HTMLAnchorElement).href,
                                            children: []
                                          }));
                                      }

                                      listItems.forEach(li => {
                                        const link = li.querySelector('a');
                                        if (link) {
                                          const label = cleanLabel((link as HTMLElement).innerText || link.textContent || '');
                                          if (label) {
                                            // Recursividade: busca submenus (qualquer UL, lista ou container de dropdown)
                                            const subMenu = li.querySelector('ul, [class*="sub-menu"], [class*="dropdown"], [class*="children"]');
                                            items.push({
                                              label: label,
                                              link: (link as HTMLAnchorElement).href,
                                              children: subMenu ? getDOMItems(subMenu, depth + 1) : []
                                            });
                                          }
                                        }
                                      });
                                      return items;
                                    };

                                    const detectedItems = getDOMItems(nav);
                                    
                                    if (detectedItems.length >= 2) {
                                      console.log('Itens detectados via DOM:', detectedItems);
                                      const isDefault = menuConfig.items.length === 4 && menuConfig.items[0].label === 'Início';
                                      if (isDefault || menuConfig.items.length === 0) {
                                        setMenuConfig(prev => ({...prev, items: detectedItems}));
                                        toast({ title: "Itens Detectados", description: `${detectedItems.length} itens (incluindo submenus) importados.` });
                                      } else {
                                        toast({ 
                                          title: "Menu Encontrado", 
                                          description: "Deseja importar a estrutura detectada?",
                                          action: (
                                            <Button size="sm" onClick={() => setMenuConfig(prev => ({...prev, items: detectedItems}))}>
                                              Importar
                                            </Button>
                                          )
                                        });
                                      }
                                      break;
                                    }
                                  }
                                }
                              }
                            } catch (err) {
                              console.warn("Não foi possível ler o DOM do iframe devido a restrições de CORS.");
                            }
                          }}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />
                        <div className="absolute inset-0 bg-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <>
                        {/* Mock Site Header */}
                        <div className="bg-muted/50 p-4 border-b flex items-center justify-between shrink-0">
                          <div className="w-24 h-6 bg-muted rounded"></div>
                          <div className="flex gap-3">
                            <div className="w-10 h-3 bg-muted rounded"></div>
                            <div className="w-10 h-3 bg-muted rounded"></div>
                          </div>
                        </div>

                        {/* Mock Site Content */}
                        <div className="p-8 flex-1 space-y-6 overflow-hidden">
                          <div className="w-3/4 h-8 bg-muted/40 rounded"></div>
                          <div className="space-y-2">
                            <div className="w-full h-3 bg-muted/30 rounded"></div>
                            <div className="w-full h-3 bg-muted/30 rounded"></div>
                            <div className="w-2/3 h-3 bg-muted/30 rounded"></div>
                          </div>
                          <div className="w-full h-40 bg-muted/20 rounded-xl"></div>
                          <div className="space-y-2">
                            <div className="w-full h-3 bg-muted/30 rounded"></div>
                            <div className="w-full h-3 bg-muted/30 rounded"></div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Widget Injection */}
                    <div className="absolute inset-0 pointer-events-none z-[1000000]">
                       <div 
                         className="relative w-full h-full pointer-events-auto" 
                          key={activeWidgetType}
                         dangerouslySetInnerHTML={{ __html: getGeneratedCode() }} 
                       />
                    </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono">
                    <div className="flex justify-between items-center px-4 py-3 bg-[#252526] border-b border-white/5">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                      </div>
                      <span className="text-white/40 text-[10px] uppercase tracking-widest">widget-snippet.html</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => handleCopyCode(getGeneratedCode())}
                      >
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <div className="p-6 overflow-auto text-sm text-[#d4d4d4] leading-relaxed max-h-[400px]">
                      <pre className="whitespace-pre-wrap">{getGeneratedCode()}</pre>
                    </div>
                    <div className="bg-[#2d2d2d] p-4 border-t border-white/5 flex items-start gap-3">
                      <Terminal className="text-primary h-5 w-5 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-white/60">
                        <strong>Anti-Adblock:</strong> Este código é 100% nativo e autossuficiente. Cole-o antes da tag <code className="text-primary-foreground bg-primary/20 px-1 rounded">&lt;/body&gt;</code> do site destino.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
