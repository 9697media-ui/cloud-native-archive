import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Type, 
  Layout, 
  Component as ComponentIcon, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  MousePointer2,
  Accessibility,
  RefreshCw,
  Plus,
  LayoutGrid,
  List,
  Search,
  LayoutDashboard,
  Download,
  FileText,
  MousePointerClick,
  Info,
  Layers,
  Table as TableIcon,
  ChevronRight,
  AlertTriangle,
  Zap,
  Lock,
  Eye,
  Settings,
  Grid
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "sonner";

export default function DesignManualPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [isExporting, setIsExporting] = useState(false);

  const isMktUser = user?.email === 'mkt@anabrasil.org';
  const hasAccess = isAdmin || isMktUser;

  const exportToPDF = async () => {
    const element = document.getElementById('design-manual-content');
    if (!element) return;

    setIsExporting(true);
    toast.info("Gerando PDF, aguarde...");

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('anabrasil-design-manual.pdf');
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-2xl font-bold tracking-tight">Acesso Restrito</h1>
        <p className="text-muted-foreground mt-2">
          Esta página é um manual técnico acessível apenas para administradores e equipe de marketing.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 space-y-8 animate-in fade-in duration-500" id="design-manual-content">
      <PageHeader 
        title="Manual de UX/UI Design" 
        description="Diretrizes visuais e de experiência do usuário do ecossistema anabrasil."
        actions={
          <Button onClick={exportToPDF} disabled={isExporting} variant="outline" className="gap-2">
            {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sumário</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              {[
                { label: "Identidade Visual", icon: Palette, id: "identidade" },
                { label: "Tipografia", icon: Type, id: "tipografia" },
                { label: "Componentes", icon: ComponentIcon, id: "componentes" },
                { label: "Layout & Grid", icon: Layout, id: "layout" },
                { label: "Interações & Animação", icon: Zap, id: "interacoes" },
                { label: "Permissões & UX", icon: Lock, id: "permissoes" },
                { label: "Acessibilidade", icon: Accessibility, id: "acessibilidade" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent text-left transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3 space-y-16">
          <section id="identidade" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Identidade Visual</h2>
                <p className="text-muted-foreground text-sm">Cores, sombras e fundamentos visuais.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Paleta de Cores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cores Base</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="h-16 w-full rounded-xl bg-primary shadow-sm ring-1 ring-black/5 flex items-end p-2">
                          <span className="text-[10px] font-bold text-primary-foreground bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">Primary</span>
                        </div>
                        <p className="text-[10px] font-mono text-center">#B0EBE0</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 w-full rounded-xl bg-accent shadow-sm ring-1 ring-black/5 flex items-end p-2">
                          <span className="text-[10px] font-bold text-accent-foreground bg-black/5 px-1.5 py-0.5 rounded backdrop-blur-sm">Accent</span>
                        </div>
                        <p className="text-[10px] font-mono text-center">#F9E7B8</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 w-full rounded-xl bg-background border shadow-sm flex items-end p-2">
                          <span className="text-[10px] font-bold text-foreground bg-black/5 px-1.5 py-0.5 rounded backdrop-blur-sm">Bg</span>
                        </div>
                        <p className="text-[10px] font-mono text-center">#FAF7F0</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Elevação e Superfícies
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-4 p-3 bg-white rounded-xl shadow-sm border border-border/50">
                      <div className="p-2 bg-muted rounded-lg"><Layers className="h-4 w-4 text-muted-foreground" /></div>
                      <div>
                        <p className="font-bold text-sm">Cards (Base)</p>
                        <p className="text-xs text-muted-foreground">Radius: 0.75rem (xl), Shadow: shadow-sm, Border: 1px border</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-white rounded-xl shadow-md border border-border/50">
                      <div className="p-2 bg-primary/10 rounded-lg"><Layers className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="font-bold text-sm">Dialogs & Popovers</p>
                        <p className="text-xs text-muted-foreground">Shadow: shadow-md, Backdrop: blur-sm (8px)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="tipografia" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <Type className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Tipografia</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="text-4xl font-bold tracking-tighter lowercase mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    anabrasil (Poppins Bold)
                  </h3>
                  <p className="text-sm text-muted-foreground">Usada para branding e títulos.</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xl font-medium mb-1">Inter (Interface & Body)</p>
                  <p className="text-muted-foreground">Fonte padrão otimizada para legibilidade.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Componentes */}
          <section id="componentes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <ComponentIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Componentes do Sistema</h2>
            </div>

            <div className="space-y-8">
              {/* Buttons */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Botões e Ações
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button variant="default">Principal</Button>
                      <Button variant="secondary">Secundário</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">Variantes de Botão</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
                    <div className="flex gap-2">
                      <Button size="sm">Pequeno</Button>
                      <Button size="default">Padrão</Button>
                      <Button size="lg">Grande</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">Escala de Tamanhos</p>
                  </Card>
                </div>
              </div>

              {/* Data Display */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Exibição de Dados (Badges & Tags)
                </h3>
                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Status de Eventos</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-300">Confirmado</Badge>
                        <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20 border-yellow-300">Pendente</Badge>
                        <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/20 border-red-300">Cancelado</Badge>
                        <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20 border-blue-300">Concluído</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Cores das Unidades (Dots & Cards)</p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-3 w-3 rounded-full bg-[#00a3ff]" /> DIC
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#00a3ff</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-3 w-3 rounded-full bg-[#81e2cf]" /> Nilópolis
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#81e2cf</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-3 w-3 rounded-full bg-[#fbce00]" /> Santana
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#fbce00</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="h-3 w-3 rounded-full bg-[#f37964]" /> Geral
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#f37964</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Form Elements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Entradas e Formulários
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Input de Texto</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Buscar no sistema..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Select</label>
                      <Select defaultValue="all">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Unidades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium uppercase text-muted-foreground">Tabs de Navegação</label>
                      <Tabs defaultValue="grid">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="grid" className="gap-2"><LayoutGrid className="h-4 w-4" /> Grid</TabsTrigger>
                          <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4" /> Lista</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </Card>
                </div>
              </div>
              {/* Other System Elements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Diálogos e Modais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Diálogo de Confirmação</p>
                      <p className="text-xs text-muted-foreground">Usado para exclusões ou ações críticas.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Cancelar</Button>
                      <Button variant="destructive" size="sm">Excluir</Button>
                    </div>
                  </Card>
                  <Card className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Painel Lateral (Sheet)</p>
                      <p className="text-xs text-muted-foreground">Para detalhes sem perder contexto.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      Ver detalhes <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Card>
                  <Card className="p-4 flex flex-col gap-3">
                    <p className="text-sm font-medium">Banners de Aviso</p>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2 items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-900 font-medium">Faltam informações no banner...</span>
                    </div>
                  </Card>
                  <Card className="p-4 flex flex-col gap-3">
                    <p className="text-sm font-medium">Test Mode / Impersonation</p>
                    <div className="bg-primary px-3 py-1.5 rounded-full flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-tight">Modo de Teste Ativo</span>
                      <RefreshCw className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Navigation Elements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Navegação e Menus
                </h3>
                <Card className="p-6 bg-slate-900 text-white rounded-xl">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-md border border-primary/30">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Auditoria</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <Layers className="h-4 w-4" />
                      <span className="text-sm font-medium">Unidades</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Layout & Grid */}
          <section id="layout" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <Layout className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Layout & Grid</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">
                  Utilizamos um sistema de container responsivo com largura máxima de <code className="bg-muted px-1 rounded">max-w-7xl</code> para páginas de conteúdo denso.
                </p>
                <div className="grid grid-cols-12 gap-2 h-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-primary/5 border border-primary/10 rounded flex items-center justify-center text-[10px] text-primary/40 font-mono">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Grid de 12 colunas padrão Tailwind CSS.</p>
              </CardContent>
            </Card>
          </section>

          {/* Interações */}
          <section id="interacoes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <MousePointer2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Interações & Micro-momentos</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex gap-4">
                <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-bold text-blue-900">Feedback Imediato</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Toda ação do usuário deve resultar em uma resposta visual clara. 
                    Botões de carregamento (loading states) e toasts de confirmação são obrigatórios para operações assíncronas.
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex gap-4">
                <RefreshCw className="h-6 w-6 text-indigo-600 shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-900">Estados de Transição</h4>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    Utilizamos <code className="bg-indigo-100/50 px-1 rounded text-xs">animate-in fade-in duration-500</code> para entrada de páginas e componentes modais para evitar saltos visuais bruscos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Acessibilidade */}
          <section id="acessibilidade" className="space-y-6 scroll-mt-24 pb-20">
            <div className="flex items-center gap-2 border-b pb-2">
              <Accessibility className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Acessibilidade (a11y)</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span><strong>Contraste:</strong> Garantimos que a proporção de contraste entre texto e fundo atenda aos padrões WCAG AA.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span><strong>Touch Targets:</strong> Elementos clicáveis em telas menores possuem área mínima de 44x44 pixels.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Type className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span><strong>Alt Text:</strong> Todas as imagens e logotipos possuem descrições alternativas para leitores de tela.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          <footer className="pt-12 pb-24 text-center space-y-6">
            <div className="flex flex-col items-center gap-4 py-8 border-t border-slate-100 bg-slate-50/30 rounded-2xl">
              <Button onClick={exportToPDF} disabled={isExporting} className="gap-2">
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Manual Design System (PDF)
              </Button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
