import React, { useState, useEffect } from 'react';
import { Settings, Code, Eye, Copy, Check, MessageCircle, AlertTriangle, Monitor, Smartphone, ShieldAlert, Lock, Terminal, Menu as MenuIcon, RefreshCw, Globe, LayoutDashboard, Save, FolderOpen, Trash2, Edit } from 'lucide-react';
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
  
  // Ref para controle de debounce na detecção de URL
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

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
    setActiveWidgetType(template.type);
    setCurrentTemplateId(template.id);
    setTemplateName(template.name);
    
    if (template.type === 'whatsapp') setWhatsappConfig(template.config);
    else if (template.type === 'banner') setBannerConfig(template.config);
    else if (template.type === 'menu') setMenuConfig(template.config);

    toast({ title: "Modelo carregado", description: `Editando: ${template.name}` });
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
    logoUrl: 'https://anabrasil.org/logo.png',
    bgColor: '#ffffff',
    textColor: '#1f2937',
    items: [
      { label: 'Início', link: '#' },
      { label: 'Sobre', link: '#' },
      { label: 'Serviços', link: '#' },
      { label: 'Contato', link: '#' }
    ],
    sticky: true,
    autoDetect: false,
    wpApiUrl: '',
    testUrl: ''
  });

  const extractWPItems = (data: any): { label: string, link: string }[] => {
    if (!data) return [];
    
    // Lista de palavras que indicam que o item é apenas um título de menu/wrapper
    const wrapperKeywords = ['menu', 'navegação', 'navigation', 'principal', 'main', 'header', 'footer', 'topo', 'rodapé', 'sidebar'];

    // Função auxiliar recursiva para encontrar arrays de itens em qualquer profundidade
    const findItemsArray = (obj: any): any[] => {
      if (!obj) return [];
      
      // Se for o bloco moderno de navegação (FSE)
      if (obj.content?.rendered) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(obj.content.rendered, 'text/html');
        const links = doc.querySelectorAll('.wp-block-navigation-item__content, a');
        if (links.length > 0) {
          return Array.from(links).map((a: any) => ({
            label: (a.querySelector('.wp-block-navigation-item__label')?.textContent || a.textContent || '').trim(),
            link: a.getAttribute('href') || '#'
          })).filter(i => i.label);
        }
      }

      if (Array.isArray(obj)) {
        // Se o array tem apenas um item e ele tem filhos, o primeiro item pode ser o título do menu
        if (obj.length === 1) {
          const firstItem = obj[0];
          const label = (firstItem.title?.rendered || firstItem.title || firstItem.label || firstItem.name || '').toString().toLowerCase();
          const hasChildren = firstItem.items || firstItem.children || firstItem.menu_items;
          
          if (hasChildren && (wrapperKeywords.some(k => label.includes(k)) || !firstItem.url || firstItem.url === '#')) {
            return findItemsArray(hasChildren);
          }
        }
        return obj;
      }

      // Procura em propriedades comuns
      const commonProps = ['items', 'children', 'menu_items', 'navigation', 'data'];
      for (const prop of commonProps) {
        if (obj[prop]) {
          const label = (obj.title?.rendered || obj.title || obj.label || obj.name || '').toString().toLowerCase();
          // Se o objeto pai parece ser um wrapper de menu, mergulha direto nos itens
          if (wrapperKeywords.some(k => label.includes(k)) || !obj.url || obj.url === '#') {
             return findItemsArray(obj[prop]);
          }
          return findItemsArray(obj[prop]);
        }
      }

      // Se for um objeto com chaves numéricas
      const keys = Object.keys(obj);
      if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
        return Object.values(obj);
      }

      return [];
    };

    const rawItems = findItemsArray(data);
    if (!Array.isArray(rawItems)) return [];

    return rawItems.map((item: any) => {
      if (item.label && item.link) return item;

      let label = '';
      if (item.title && typeof item.title === 'object' && item.title.rendered) label = item.title.rendered;
      else if (item.title && typeof item.title === 'string') label = item.title;
      else if (item.label) label = item.label;
      else if (item.name) label = item.name;
      else if (item.post_title) label = item.post_title;
      else if (item.text) label = item.text;

      const link = item.url || item.link || item.guid || item.href || '#';
      
      return { label, link };
    }).filter(i => {
      if (!i.label) return false;
      const lowerLabel = i.label.toLowerCase();
      // Filtra itens que são claramente apenas o nome do menu no nível de item
      const isJustMenuName = wrapperKeywords.some(k => lowerLabel === k || lowerLabel === `menu ${k}` || lowerLabel === `${k} menu`);
      return !isJustMenuName;
    });
  };

  const fetchAndProcessWPItems = async (url: string) => {
    if (!url || url.length < 10) return;
    
    try {
      console.log('Fetching WP items from:', url);
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      if (response.ok) {
        const data = await response.json();
        console.log('WP API Data received:', data);
        const wpItems = extractWPItems(data);
        if (wpItems.length > 0) {
          setMenuConfig(prev => ({
            ...prev,
            items: wpItems,
            wpApiUrl: url // Garante que a URL correta fique salva
          }));
          toast({
            title: "Itens Sincronizados",
            description: `Importamos ${wpItems.length} itens do endpoint informado.`,
          });
          return true;
        }
      }
    } catch (e) {
      console.warn('Falha ao buscar endpoint diretamente:', e);
    }
    return false;
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
    font-family: system-ui, -apple-system, sans-serif;
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
    display: block;
  }
  .custom-nav-992 .menu-items {
    display: flex;
    gap: 10px;
    align-items: center;
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .custom-nav-992 .menu-items a {
    color: inherit;
    text-decoration: none !important;
    font-size: 15px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s;
    opacity: 0.8;
    white-space: nowrap;
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
  }
  .custom-nav-992 .menu-items .has-submenu {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    height: 100% !important;
  }
  .custom-nav-992 .menu-items .has-submenu > a::after {
    content: "";
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid currentColor;
    opacity: 0.5;
    margin-left: 4px;
  }
  .custom-nav-992 .submenu {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    background-color: ${menuConfig.bgColor} !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
    border-radius: 8px !important;
    padding: 10px 0 !important;
    display: none !important;
    flex-direction: column !important;
    min-width: 220px !important;
    z-index: 9999999 !important;
    list-style: none !important;
    margin: 0 !important;
    border: 1px solid rgba(0,0,0,0.05) !important;
  }
  /* Força a exibição no hover do PAI */
  .custom-nav-992 .menu-items .has-submenu:hover > .submenu {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .custom-nav-992 .submenu a {
    padding: 12px 20px !important;
    opacity: 0.9 !important;
    width: 100% !important;
    border-radius: 0 !important;
    display: block !important;
    text-align: left !important;
    white-space: normal !important;
  }
  .custom-nav-992 .submenu a:hover {
    background-color: rgba(0,0,0,0.05) !important;
    opacity: 1 !important;
  }
  .custom-nav-992 .mobile-toggle {
    display: none;
    background: transparent;
    border: none;
    color: inherit;
    padding: 10px;
    cursor: pointer;
    border-radius: 8px;
  }
  .custom-nav-992 .mobile-toggle:hover {
    background-color: rgba(0,0,0,0.05);
  }
  .custom-nav-992 .mobile-toggle svg {
    width: 24px;
    height: 24px;
    display: block;
    fill: currentColor;
  }
  
  @media (max-width: 1024px) {
    .custom-nav-992 {
      padding: 0 15px;
    }
    .custom-nav-992 .menu-items {
      gap: 10px;
    }
    .custom-nav-992 .menu-items a {
      font-size: 14px;
      padding: 6px 10px;
    }
  }

  @media (max-width: 850px) {
    .custom-nav-992 .mobile-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-nav-992 .menu-items {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background-color: ${menuConfig.bgColor};
      flex-direction: column;
      padding: 15px 0;
      gap: 5px;
      box-shadow: 0 10px 15px rgba(0,0,0,0.1);
      max-height: 80vh;
      overflow-y: auto;
      z-index: 999998;
    }
    .custom-nav-992 .menu-items.active {
      display: flex;
    }
    .custom-nav-992 .menu-items a {
      width: 100%;
      padding: 12px 25px;
      border-radius: 0;
      font-size: 16px;
      border-left: 4px solid transparent;
    }
    .custom-nav-992 .menu-items a.active {
      border-left-color: currentColor;
      background-color: rgba(0,0,0,0.05);
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

          let title = '';
          if (item.title && typeof item.title === 'object' && item.title.rendered) title = item.title.rendered;
          else if (item.title && typeof item.title === 'string') title = item.title;
          else if (item.label) title = item.label;
          else if (item.name) title = item.name;
          else if (item.post_title) title = item.post_title;
          else if (item.text) title = item.text;
          
          if (!title || title.trim() === '') return;
          
          const lowerTitle = title.trim().toLowerCase();
          const children = item.children || item.items || item.sub_items || [];
          const link = item.url || item.link || item.guid || item.href || '#';

          // Se tiver apenas UM item na lista e ele tiver filhos, mergulha direto
          if (list.length === 1 && children.length > 0) {
            const childrenHtml = renderItems(children);
            if (childrenHtml && childrenHtml.trim().length > 0) {
              html += childrenHtml;
              return;
            }
          }

          // Se tiver filhos e o link for apenas '#' ou o título for um "wrapper" conhecido, mergulha nos filhos
          const isWrapper = (link === '#' || link === '' || link.endsWith('/') || 
                            lowerTitle.includes("principal") || lowerTitle.includes("menu") || 
                            lowerTitle.includes("navegação") || lowerTitle.includes("main") ||
                            lowerTitle.includes("topo") || lowerTitle.includes("header") ||
                            lowerTitle.includes("footer") || lowerTitle.includes("rodapé"));
          
          if (children && children.length > 0 && isWrapper) {
            const childrenHtml = renderItems(children);
            if (childrenHtml && childrenHtml.trim().length > 0) {
              html += childrenHtml;
              return;
            }
          }

          if (children.length > 0) {
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
      if (wpApiUrl && wpApiUrl.length > 10) {
        try {
          console.log('Buscando via WP API:', wpApiUrl);
          const response = await fetch(wpApiUrl);
          if (response.ok) {
            const data = await response.json();
            let items = [];
            if (Array.isArray(data)) {
              items = data;
            } else if (data.items || data.children || data.menu_items || data.data) {
              items = data.items || data.children || data.menu_items || data.data;
            }

            
            // Função para extrair itens de estruturas aninhadas do WordPress
            function extractItems(source) {
              if (!source) return [];
              
              console.log('Analisando fonte de dados:', source);

              // Se for um objeto com propriedade de itens, mergulha nela
              if (source.items && Array.isArray(source.items)) return source.items;
              if (source.children && Array.isArray(source.children)) return source.children;
              if (source.menu_items && Array.isArray(source.menu_items)) return source.menu_items;
              if (source.navigation && source.navigation.items) return source.navigation.items;
              if (source.data && Array.isArray(source.data)) return source.data;
              if (source.nodes && Array.isArray(source.nodes)) return source.nodes;
              if (source.edges && Array.isArray(source.edges)) return source.edges;
              
              // Se for um array
              if (Array.isArray(source)) {
                // Se o array tem 1 item e esse item tem sub-itens, mergulha
                if (source.length === 1 && (source[0].items || source[0].children || source[0].menu_items)) {
                  return extractItems(source[0]);
                }
                return source;
              }
              
              // Se for um objeto com chaves numéricas (comum em APIs PHP/WP antigas)
              if (typeof source === 'object') {
                const keys = Object.keys(source);
                if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
                  return Object.values(source);
                }
              }

              // Caso o objeto em si tenha itens/children (segunda checagem)
              const possibleItems = source.items || source.children || source.menu_items;
              if (Array.isArray(possibleItems)) return possibleItems;

              return [];
            }

            items = extractItems(data);


            const htmlContent = renderItems(items);
            if (htmlContent && htmlContent.trim().length > 5) {
              menuContainer.innerHTML = htmlContent;
              if (typeof highlightActiveLink === 'function') highlightActiveLink();
              return;
            }
          }
        } catch (e) { console.warn('WP API fail:', e.message); }
      }

      if (${menuConfig.autoDetect}) {
        console.log('Tentando auto-detecção...');
        const selectors = ['nav', '.main-navigation', '.elementor-nav-menu', '.header-menu', '#site-navigation', 'ul[class*="menu"]', '.wp-block-navigation'];
        const previewFrame = document.querySelector('iframe[title="Site Preview"]');
        let targetDoc = document;
        try {
          if (previewFrame && previewFrame.contentDocument) targetDoc = previewFrame.contentDocument;
          else if (previewFrame && previewFrame.contentWindow) targetDoc = previewFrame.contentWindow.document;
        } catch (e) { console.warn('CORS restrict'); }

        for (const selector of selectors) {
          const containers = targetDoc.querySelectorAll(selector);
          for (const container of containers) {
            function getDOMItems(el) {
              const uls = el.querySelectorAll('ul');
              const mainUl = Array.from(uls).find(ul => !ul.parentElement.closest('li')) || el.querySelector('ul') || (el.tagName === 'UL' ? el : null);
              if (!mainUl) return [];
              return Array.from(mainUl.children).filter(li => li.tagName === 'LI').map(li => {
                const link = li.querySelector('a');
                if (!link) return null;
                const sub = li.querySelector('ul, .sub-menu, .dropdown-menu');
                return { title: link.innerText.trim(), link: link.href, children: sub ? getDOMItems(li) : [] };
              }).filter(i => i && i.title);
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
  function toggleCustomMenu() {
    const items = document.querySelector('.custom-nav-992 .menu-items');
    const toggle = document.querySelector('.custom-nav-992 .mobile-toggle');
    items.classList.toggle('active');
  }

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

  function initMenu() {
    highlightActiveLink();
    ${fetchScript}
    
    // Fechar menu mobile ao clicar fora
    document.addEventListener('click', (e) => {
      const nav = document.querySelector('.custom-nav-992');
      const items = document.querySelector('.custom-nav-992 .menu-items');
      if (nav && !nav.contains(e.target) && items.classList.contains('active')) {
        items.classList.remove('active');
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

    const html = `
<!-- Início: Menu Responsivo Nativo -->
<nav class="custom-nav-992">
  <div class="logo">
    <a href="/"><img src="${menuConfig.logoUrl}" alt="Logo"></a>
  </div>
  <button class="mobile-toggle" onclick="toggleCustomMenu()" aria-label="Menu">
    <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
  </button>
  <div class="menu-items">
    ${menuConfig.items.length > 0 
      ? menuConfig.items.map(item => `<a href="${item.link}">${item.label}</a>`).join('\n    ')
      : '<!-- Aguardando carregamento... -->'
    }
  </div>
</nav>
<!-- Fim: Menu Responsivo Nativo -->`;

    return css + "\n" + html + "\n" + script;
  };


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
                      <Label>URL do Logo</Label>
                      <Input 
                        value={menuConfig.logoUrl}
                        onChange={(e) => setMenuConfig({...menuConfig, logoUrl: e.target.value})}
                        placeholder="https://sua-logo.png"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cor de Fundo</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={menuConfig.bgColor}
                          onChange={(e) => setMenuConfig({...menuConfig, bgColor: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Texto</Label>
                        <Input 
                          type="color" 
                          className="w-full h-10 p-1 cursor-pointer"
                          value={menuConfig.textColor}
                          onChange={(e) => setMenuConfig({...menuConfig, textColor: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="sticky-menu" className="cursor-pointer">Menu Fixo (Sticky)</Label>
                      <Switch 
                        id="sticky-menu" 
                        checked={menuConfig.sticky}
                        onCheckedChange={(val) => setMenuConfig({...menuConfig, sticky: val})}
                      />
                    </div>
                    <div className="space-y-4 pt-2 border-t mt-4">
                      <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" /> Automação de Itens
                      </Label>
                      
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={syncWithSystemMenu}
                      >
                        <RefreshCw className="h-4 w-4" /> Importar do Sistema Atual
                      </Button>

                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-detect" className="cursor-pointer">Auto-detectar Menu</Label>
                          <p className="text-[10px] text-muted-foreground">Tenta ler links do site onde for inserido.</p>
                        </div>
                        <Switch 
                          id="auto-detect" 
                          checked={menuConfig.autoDetect}
                          onCheckedChange={(val) => setMenuConfig({...menuConfig, autoDetect: val})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Endpoint WordPress (JSON)</Label>
                        <Input 
                          placeholder="Ex: https://site.com/wp-json/wp/v2/menu-items"
                          value={menuConfig.wpApiUrl}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setMenuConfig({...menuConfig, wpApiUrl: newUrl});
                            
                            // Gatilho automático ao colar ou digitar uma URL completa
                            if (newUrl.startsWith('http')) {
                              if (debounceRef.current) clearTimeout(debounceRef.current);
                              debounceRef.current = setTimeout(() => {
                                fetchAndProcessWPItems(newUrl);
                              }, 800);
                            }
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground">URL da API REST do WordPress para sincronização em tempo real.</p>
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
                              
                              if (url && url.startsWith('http')) {
                                // Limpa timer anterior se existir
                                if (debounceRef.current) clearTimeout(debounceRef.current);
                                
                                debounceRef.current = setTimeout(async () => {
                                  try {
                                    const origin = new URL(url).origin;
                                    const endpoints = [
                                      '/wp-json/wp/v2/navigation',
                                      '/wp-json/wp/v2/menu-items',
                                      '/wp-json/menus/v1/menus',
                                      '/wp-json/menus/v1/locations/primary',
                                      '/wp-json/wp/v2/pages'
                                    ];

                                    for (const endpoint of endpoints) {
                                      try {
                                        const testRes = await fetch(`${origin}${endpoint}`, { method: 'GET', mode: 'cors' });
                                        if (testRes.ok) {
                                          const data = await testRes.json();
                                          if (data) {
                                            const wpItems = extractWPItems(data);
                                            if (wpItems.length > 0) {
                                              setMenuConfig(prev => ({
                                                ...prev, 
                                                wpApiUrl: `${origin}${endpoint}`,
                                                items: wpItems
                                              }));
                                              
                                              toast({
                                                title: "API Detectada e Sincronizada!",
                                                description: `Importamos ${wpItems.length} itens do endpoint ${endpoint}`,
                                              });
                                              break;
                                            }
                                          }
                                        }
                                      } catch (e) {
                                        // Se falhar por CORS, tentamos HEAD no-cors apenas para ver se o recurso existe
                                        try {
                                          const headRes = await fetch(`${origin}${endpoint}`, { method: 'HEAD', mode: 'no-cors' });
                                          // No modo no-cors o status é sempre 0, mas se não deu erro de rede é um sinal positivo
                                          if (headRes.type === 'opaque') {
                                             setMenuConfig(prev => ({...prev, wpApiUrl: `${origin}${endpoint}`}));
                                             toast({
                                              title: "API Possível!",
                                              description: `Detectamos atividade em ${endpoint} (CORS restrito).`,
                                            });
                                            break;
                                          }
                                        } catch (innerE) {}
                                      }
                                    }
                                  } catch (e) { /* invalid url */ }
                                }, 1000);
                              }
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">O site abrirá no frame abaixo e tentaremos identificar o endpoint e os itens automaticamente.</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Itens do Menu</Label>
                        <span className="text-[10px] text-muted-foreground italic">(Sincronizados via API ou Manual)</span>
                      </div>
                      {menuConfig.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
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
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setMenuConfig({
                          ...menuConfig, 
                          items: [...menuConfig.items, { label: 'Novo Item', link: '#' }]
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
                      onClick={() => setDeviceView('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={deviceView === 'mobile' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setDeviceView('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-muted/10 overflow-auto p-4 md:p-8 flex justify-center items-start">
                {viewMode === 'preview' ? (
                  <div className={cn(
                    "bg-background shadow-2xl border overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col",
                    deviceView === 'mobile' ? "w-[375px] h-[667px] rounded-[3rem] border-[8px] border-slate-900" : "w-full max-w-4xl h-[550px] rounded-lg"
                  )}>
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
                                const selectors = ['nav', '.main-navigation', '.elementor-nav-menu', 'ul[class*="menu"]'];
                                for (const sel of selectors) {
                                  const nav = doc.querySelector(sel);
                                  if (nav) {
                                    const links = Array.from(nav.querySelectorAll('a')).slice(0, 10);
                                    if (links.length > 0) {
                                      const detectedItems = links.map(a => ({
                                        label: (a as HTMLElement).innerText.trim(),
                                        link: (a as HTMLAnchorElement).href
                                      })).filter(i => i.label);
                                      
                                      if (detectedItems.length > 0) {
                                        // Substituir apenas se os itens atuais forem os padrão ou estiverem vazios
                                        const isDefault = menuConfig.items.length === 4 && menuConfig.items[0].label === 'Início';
                                        if (isDefault || menuConfig.items.length === 0) {
                                          setMenuConfig(prev => ({...prev, items: detectedItems}));
                                          toast({ title: "Itens Detectados", description: `${detectedItems.length} links importados do preview.` });
                                        } else {
                                          toast({ 
                                            title: "Preview Carregado", 
                                            description: "Links detectados no site. Deseja substituir os atuais?",
                                            action: (
                                              <Button size="sm" onClick={() => setMenuConfig(prev => ({...prev, items: detectedItems}))}>
                                                Substituir
                                              </Button>
                                            )
                                          });
                                        }
                                        break;
                                      }
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
                         key={getGeneratedCode().length} // Force re-render when code changes
                         dangerouslySetInnerHTML={{ __html: getGeneratedCode() }} 
                       />
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
