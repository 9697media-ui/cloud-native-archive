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
        subtitle="Diretrizes visuais e de experiência do usuário do ecossistema anabrasil."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sumário</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              {[
                { label: "Identidade Visual", icon: Palette },
                { label: "Tipografia", icon: Type },
                { label: "Componentes", icon: ComponentIcon },
                { label: "Layout & Grid", icon: Layout },
                { label: "Interações", icon: MousePointer2 },
                { label: "Acessibilidade", icon: Accessibility },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent text-left transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3 space-y-12">
          {/* Identidade Visual */}
          <section className="space-y-6">
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
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <Type className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Tipografia</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Badge variant="outline" className="mb-2">Headers</Badge>
                  <h3 className="text-3xl font-bold tracking-tighter lowercase mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    anabrasil (Poppins Bold)
                  </h3>
                  <p className="text-sm text-muted-foreground">Usada para branding e títulos principais.</p>
                </div>
                <Separator />
                <div>
                  <Badge variant="outline" className="mb-2">Interface</Badge>
                  <p className="text-lg font-medium mb-1">Inter (Default System Font)</p>
                  <p className="text-sm text-muted-foreground">Utilizada para legibilidade em dados e controles.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Componentes */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <ComponentIcon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Princípios de UX</h2>
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

              <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl flex gap-4">
                <Smartphone className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-900">Mobile First</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    A interface deve ser totalmente funcional em dispositivos móveis. 
                    Utilizamos o hook <code className="bg-amber-100/50 px-1 rounded text-xs">useIsMobile</code> para adaptar visualizações complexas como tabelas para listas de cards.
                  </p>
                </div>
              </div>
            </div>
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
