import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Accessibility
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function DesignManualPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const isMktUser = user?.email === 'mkt@anabrasil.org';
  const hasAccess = isAdmin || isMktUser;

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
    <div className="container max-w-7xl py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Manual de UX/UI Design" 
        description="Diretrizes visuais e de experiência do usuário do ecossistema anabrasil."
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
                { label: "Interações", icon: MousePointer2, id: "interacoes" },
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
          {/* Identidade Visual */}
          <section id="identidade" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <Palette className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Identidade Visual</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cores Primárias</CardTitle>
                  <CardDescription>Cores que definem a marca anabrasil.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary shadow-sm ring-1 ring-black/5" />
                    <div>
                      <p className="font-mono text-sm font-bold">Primary (Blue)</p>
                      <p className="text-xs text-muted-foreground">#0070f3 / HSL(221.2 83.2% 53.3%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white border shadow-sm" />
                    <div>
                      <p className="font-mono text-sm font-bold">Background</p>
                      <p className="text-xs text-muted-foreground">#FFFFFF / HSL(0 0% 100%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sistema de Card</CardTitle>
                  <CardDescription>Padronização de bordas e sombras.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Bordas arredondadas: <code className="bg-muted px-1 rounded">0.75rem (xl)</code>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Sombra suave: <code className="bg-muted px-1 rounded">shadow-sm</code>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Borda: <code className="bg-muted px-1 rounded">1px solid border</code>
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tipografia */}
          <section id="tipografia" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <Type className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Tipografia</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Badge variant="outline" className="mb-2">Headers</Badge>
                  <h3 className="text-4xl font-bold tracking-tighter lowercase mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    anabrasil (Poppins Bold)
                  </h3>
                  <p className="text-sm text-muted-foreground">Usada para branding, logotipos e títulos de alto nível.</p>
                </div>
                <Separator />
                <div>
                  <Badge variant="outline" className="mb-2">Interface & Body</Badge>
                  <p className="text-xl font-medium mb-1">Inter (Default System Font)</p>
                  <p className="text-muted-foreground mb-4">A fonte Inter é otimizada para legibilidade em telas. Usada para todo o corpo de texto, botões e campos de entrada.</p>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                    <div className="p-3 bg-muted rounded">Font-Weight: 400 (Regular)</div>
                    <div className="p-3 bg-muted rounded">Font-Weight: 600 (Semi-bold)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Componentes */}
          <section id="componentes" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-2 border-b pb-2">
              <ComponentIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Componentes Base</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Botões (Buttons)</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium">Default</div>
                  <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">Secondary</div>
                  <div className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium">Outline</div>
                </div>
                <p className="text-xs text-muted-foreground italic">Botões utilizam transições de 200ms para hover states.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Badges</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>Admin</Badge>
                  <Badge variant="secondary">Editor</Badge>
                  <Badge variant="outline">Viewer</Badge>
                </div>
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

          {/* Rodapé do Manual */}
          <footer className="pt-12 text-center text-sm text-muted-foreground">
            <p>© 2026 anabrasil Design System. Documentação gerada via Lovable Cloud.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
