import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertTriangle
} from "lucide-react";
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
    toast.info("Gerando PDF premium, aguarde...");

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
      pdf.save('anabrasil-design-system.pdf');
      toast.success("Manual baixado com sucesso!");
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
        <ShieldCheck className="h-20 w-20 text-slate-200 mb-6" />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Acesso Restrito</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto font-medium">
          Este manual técnico é confidencial e acessível apenas para administradores e equipe de marketing autorizada.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-12 space-y-16 animate-in fade-in duration-700" id="design-manual-content">
      <PageHeader 
        title="Design Manual" 
        description="O guia definitivo de identidade visual e experiência do usuário para o ecossistema anabrasil. Criado para garantir consistência, elegância e performance."
        actions={
          <Button onClick={exportToPDF} disabled={isExporting} size="lg" className="gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl">
            {isExporting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Download PDF Premium
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <aside className="md:col-span-1">
          <Card className="sticky top-28 border-none bg-slate-100/40 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/40">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Sumário</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-2 p-4">
              {[
                { label: "Identidade Visual", icon: Palette, id: "identidade" },
                { label: "Tipografia", icon: Type, id: "tipografia" },
                { label: "Componentes", icon: ComponentIcon, id: "componentes" },
                { label: "Layout & Grid", icon: Layout, id: "layout" },
                { label: "Interações", icon: MousePointer2, id: "interacoes" },
                { label: "Acessibilidade", icon: Accessibility, id: "acessibilidade" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-4 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 text-left transition-all group w-full"
                >
                  <item.icon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-slate-500 group-hover:text-slate-900 transition-colors">{item.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3 space-y-32 pb-20">
          {/* Identidade Visual */}
          <section id="identidade" className="space-y-10 scroll-mt-28">
            <div className="flex items-end justify-between border-b-2 border-slate-100 pb-6">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">Foundations</Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Identidade Visual</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2rem] p-4">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Cores de Marca</CardTitle>
                  <CardDescription className="font-medium">O uso estratégico de cores para transmitir confiança.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="group flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-primary shadow-2xl shadow-primary/40 ring-4 ring-primary/10 transition-transform group-hover:scale-110" />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Primary Blue</p>
                        <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">#3b82f6</p>
                      </div>
                    </div>
                  </div>
                  <div className="group flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-900 shadow-2xl shadow-slate-900/40 ring-4 ring-slate-900/10 transition-transform group-hover:scale-110" />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Deep Night</p>
                        <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">#020617</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2rem] p-4">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Formas & Bordas</CardTitle>
                  <CardDescription className="font-medium">Suavidade que guia a navegação.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center p-8">
                    <div className="w-full h-full bg-white shadow-2xl rounded-3xl flex items-center justify-center font-bold text-slate-400 text-sm">
                      Radius: 1.5rem / 24px
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tipografia */}
          <section id="tipografia" className="space-y-10 scroll-mt-28">
            <div className="flex items-end justify-between border-b-2 border-slate-100 pb-6">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">Typography</Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Tipografia</h2>
              </div>
            </div>
            <Card className="border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.08)] bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="bg-slate-950 p-16 text-white space-y-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Fonte Principal</span>
                      <h3 className="text-9xl font-black tracking-tighter" style={{ fontFamily: 'Poppins, sans-serif' }}>Aa</h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-5xl font-black tracking-tighter">Poppins</p>
                      <p className="text-slate-400 leading-relaxed font-medium">Poppins é uma tipografia geométrica, moderna e internacional que equilibra perfeitamente técnica e amabilidade.</p>
                    </div>
                  </div>
                  <div className="p-16 flex flex-col justify-center space-y-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Heading Large</label>
                      <p className="text-5xl font-black tracking-tighter text-slate-900 lowercase leading-none">anabrasil</p>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Body Content</label>
                      <p className="text-xl font-medium text-slate-600 leading-relaxed">Desenvolvemos experiências que conectam pessoas e simplificam processos institucionais complexos.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Componentes */}
          <section id="componentes" className="space-y-10 scroll-mt-28">
            <div className="flex items-end justify-between border-b-2 border-slate-100 pb-6">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">Components</Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Componentes</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Action Buttons
                </h4>
                <div className="p-10 bg-slate-50 rounded-[2.5rem] flex flex-wrap gap-4 items-center justify-center border border-slate-100">
                  <Button size="lg" className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">Principal</Button>
                  <Button variant="secondary" size="lg" className="rounded-2xl font-bold bg-white shadow-sm border-none">Subtle</Button>
                  <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-white"><Plus className="h-6 w-6 text-primary" /></Button>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Status & Indicators
                </h4>
                <div className="p-10 bg-slate-50 rounded-[2.5rem] flex flex-wrap gap-4 items-center justify-center border border-slate-100">
                  <Badge className="bg-green-500/10 text-green-600 border-none px-4 py-1.5 rounded-full font-bold">Confirmado</Badge>
                  <Badge className="bg-amber-500/10 text-amber-600 border-none px-4 py-1.5 rounded-full font-bold">Pendente</Badge>
                  <Badge className="bg-red-500/10 text-red-600 border-none px-4 py-1.5 rounded-full font-bold">Cancelado</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Interações */}
          <section id="interacoes" className="space-y-10 scroll-mt-28">
            <div className="flex items-end justify-between border-b-2 border-slate-100 pb-6">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">Motion</Badge>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Micro-interações</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Hover Effects", desc: "Transições suaves de 300ms em estados interativos.", icon: MousePointerClick, bg: "bg-blue-50" },
                { title: "Fluid Entradas", desc: "Animações de fade-in e slide-up para novos conteúdos.", icon: RefreshCw, bg: "bg-indigo-50" },
                { title: "Active States", desc: "Feedback tátil visual via redução de escala em cliques.", icon: Smartphone, bg: "bg-violet-50" },
              ].map((item) => (
                <div key={item.title} className={cn("p-8 rounded-[2rem] space-y-4 border border-white shadow-sm", item.bg)}>
                  <item.icon className="h-8 w-8 text-primary" />
                  <div className="space-y-2">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-24 pb-12 border-t border-slate-100 text-center space-y-8">
            <div className="flex flex-col items-center gap-6 p-12 bg-slate-900 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20">
              <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <Download className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black tracking-tighter">Pronto para Offline?</h4>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">Salve este manual em PDF de alta qualidade para consultas rápidas em qualquer lugar.</p>
              </div>
              <Button onClick={exportToPDF} disabled={isExporting} size="lg" className="bg-white text-slate-950 hover:bg-slate-100 rounded-2xl h-14 px-10 font-bold transition-all hover:scale-105 active:scale-95">
                {isExporting ? "Gerando PDF..." : "Baixar Manual Completo"}
              </Button>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">© 2026 anabrasil Design System</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
