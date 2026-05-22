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
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cores das Unidades</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="h-10 w-full rounded-lg bg-[#00a3ff]" />
                        <p className="text-[9px] font-bold text-center">DIC</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-10 w-full rounded-lg bg-[#81e2cf]" />
                        <p className="text-[9px] font-bold text-center">Nilópolis</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-10 w-full rounded-lg bg-[#fbce00]" />
                        <p className="text-[9px] font-bold text-center">Santana</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-10 w-full rounded-lg bg-[#f37964]" />
                        <p className="text-[9px] font-bold text-center">Geral</p>
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

          <section id="componentes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <ComponentIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Componentes do Sistema</h2>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Botões</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </Card>
                <Card className="p-4 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Badges de Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500/15 text-green-700 border-green-300">Confirmado</Badge>
                    <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">Pendente</Badge>
                    <Badge className="bg-red-500/15 text-red-700 border-red-300">Cancelado</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section id="layout" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <Layout className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Layout & Grid</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">Grid de 12 colunas padrão Tailwind CSS.</p>
                <div className="grid grid-cols-12 gap-2 h-16">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-[10px] text-primary/60 font-mono">{i+1}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="interacoes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Interações & Animação</h2>
                <p className="text-muted-foreground text-sm">Estados dinâmicos e micro-interações.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Animações de Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-red-500 animate-conflict-pulse" /><span className="text-sm">Conflito</span></div>
                  <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-yellow-500 animate-pending-pulse" /><span className="text-sm">Pendente</span></div>
                  <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-green-500 animate-confirmed-pulse" /><span className="text-sm">Confirmado</span></div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section id="permissoes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Permissões & UX</h2>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1"><h4 className="font-bold">Admin</h4><p className="text-xs text-muted-foreground">Acesso total e gestão.</p></div>
                <div className="space-y-1"><h4 className="font-bold">Gestor</h4><p className="text-xs text-muted-foreground">Acesso restrito à unidade.</p></div>
                <div className="space-y-1"><h4 className="font-bold">Editor</h4><p className="text-xs text-muted-foreground">Criação e edição básica.</p></div>
              </CardContent>
            </Card>
          </section>

          <section id="acessibilidade" className="space-y-6 scroll-mt-24 pb-20">
            <div className="flex items-center gap-2 border-b pb-2">
              <Accessibility className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Acessibilidade</h2>
            </div>
            <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">O sistema segue padrões WCAG AA de contraste e suporta navegação por teclado.</p></CardContent></Card>
          </section>

          <footer className="pt-12 pb-24 text-center space-y-6">
            <div className="flex flex-col items-center gap-4 py-8 border-t border-slate-100 bg-slate-50/30 rounded-2xl">
              <Button onClick={exportToPDF} disabled={isExporting} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Manual Design System (PDF)
              </Button>
              <p className="text-sm text-muted-foreground">© 2026 anabrasil Design System. Documentação gerada via Lovable Cloud.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}