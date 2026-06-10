import React, { useState } from 'react';
import { Settings, Code, Eye, Copy, Check, MessageCircle, AlertTriangle, Monitor, Smartphone, ShieldAlert, Lock, Terminal, Menu as MenuIcon } from 'lucide-react';
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

export default function AdminToolboxPage() {
  const { toast } = useToast();
  // Estado geral
  const [activeWidgetType, setActiveWidgetType] = useState('whatsapp');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' ou 'code'
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' ou 'mobile'
  const [copied, setCopied] = useState(false);

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
    sticky: true
  });

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
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: ${menuConfig.sticky ? 'sticky' : 'relative'};
    top: 0;
    z-index: 999997;
    box-sizing: border-box;
  }
  .custom-nav-992 .logo img {
    height: 40px;
    width: auto;
    display: block;
  }
  .custom-nav-992 .menu-items {
    display: flex;
    gap: 25px;
  }
  .custom-nav-992 .menu-items a {
    color: inherit;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  .custom-nav-992 .menu-items a:hover { opacity: 0.7; }
  .custom-nav-992 .mobile-toggle {
    display: none;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 24px;
    cursor: pointer;
  }
  @media (max-width: 768px) {
    .custom-nav-992 .menu-items {
      display: none;
      position: absolute;
      top: 70px;
      left: 0;
      width: 100%;
      background-color: ${menuConfig.bgColor};
      flex-direction: column;
      padding: 20px;
      gap: 15px;
      box-shadow: 0 10px 15px rgba(0,0,0,0.05);
    }
    .custom-nav-992 .menu-items.active { display: flex; }
    .custom-nav-992 .mobile-toggle { display: block; }
  }
</style>`;

    const script = `
<script>
  function toggleCustomMenu() {
    const items = document.querySelector('.custom-nav-992 .menu-items');
    items.classList.toggle('active');
  }
</script>`;

    const html = `
<!-- Início: Menu Responsivo Nativo -->
<nav class="custom-nav-992">
  <div class="logo">
    <img src="${menuConfig.logoUrl}" alt="Logo">
  </div>
  <button class="mobile-toggle" onclick="toggleCustomMenu()">☰</button>
  <div class="menu-items">
    ${menuConfig.items.map(item => `<a href="${item.link}">${item.label}</a>`).join('\n    ')}
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
              <h1 className="text-3xl font-bold tracking-tight">Construtor de Widgets</h1>
              <p className="text-muted-foreground">Área restrita para criação e implementação de ferramentas nativas.</p>
            </div>
          </div>
          <Button className="md:w-auto w-full">
            Salvar no Sistema
          </Button>
        </div>

        <Alert className="bg-primary/5 border-primary/20">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <AlertTitle>Ambiente de Desenvolvimento</AlertTitle>
          <AlertDescription>
            Crie widgets nativos que não são detectados por adblockers para uso em sites externos.
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
                ) : (
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
                )}

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
                    <div className="space-y-2 pt-2">
                      <Label>Itens do Menu</Label>
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
                        + Adicionar Item
                      </Button>
                    </div>
                  </div>
                )}
                      <Label htmlFor="dismissible" className="cursor-pointer">Permitir fechar (X)</Label>
                      <Switch 
                        id="dismissible" 
                        checked={bannerConfig.isDismissible}
                        onCheckedChange={(val) => setBannerConfig({...bannerConfig, isDismissible: val})}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Área Principal Preview/Código */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="flex-1 overflow-hidden flex flex-col min-h-[600px]">
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

                    {/* Widget Injection */}
                    <div className="absolute inset-0 pointer-events-none">
                       <div className="relative w-full h-full overflow-hidden pointer-events-auto" dangerouslySetInnerHTML={{ __html: getGeneratedCode() }} />
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
  );
}
