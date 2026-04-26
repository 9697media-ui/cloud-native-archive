import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Info, Shield, Hammer, Users, Calendar, LayoutDashboard, History, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LegendItem {
  title: string;
  description: string;
  icon: any;
}

interface PageLegend {
  title: string;
  description: string;
  functions: LegendItem[];
  roles: LegendItem[];
  tools: LegendItem[];
}

const legends: Record<string, PageLegend> = {
  '/': {
    title: 'Visão Geral (Dashboard)',
    description: 'Central de controle e resumo de todas as atividades do grupo anabrasil.',
    functions: [
      { title: 'Monitoramento Central', description: 'Visualização rápida do volume de eventos, pendências e conflitos de agenda em todas as unidades.', icon: LayoutDashboard },
      { title: 'Gestão de Status', description: 'Acompanhamento do ciclo de vida dos eventos, desde a sugestão (pendente) até a realização (confirmado).', icon: Info },
    ],
    roles: [
      { title: 'Administradores', description: 'Visão total de todas as unidades e poder de decisão sobre qualquer evento.', icon: Shield },
      { title: 'Gestores de Unidade', description: 'Responsáveis por alimentar e organizar a agenda de sua unidade específica.', icon: Users },
    ],
    tools: [
      { title: 'Timeline Semanal', description: 'Exibição cronológica dos próximos 7 dias para evitar sobreposição de atividades.', icon: Calendar },
      { title: 'Alertas de Conflito', description: 'Sistema automático que detecta quando dois eventos tentam ocupar o mesmo espaço/tempo.', icon: Hammer },
    ]
  },
  '/calendario': {
    title: 'Calendário de Eventos',
    description: 'Interface visual para planejamento a longo prazo e organização detalhada.',
    functions: [
      { title: 'Planejamento Mensal/Semanal', description: 'Visualização em grade que facilita a percepção de datas livres e períodos de alta demanda.', icon: Calendar },
      { title: 'Ajuste Dinâmico', description: 'Capacidade de mover eventos rapidamente para novas datas via arrastar e soltar.', icon: Hammer },
    ],
    roles: [
      { title: 'Criadores e Editores', description: 'Podem inserir novos eventos e modificar detalhes como horários, locais e descrições.', icon: Users },
      { title: 'Visualizadores', description: 'Acesso para consulta de datas e horários sem permissão de alteração.', icon: Info },
    ],
    tools: [
      { title: 'Ações em Massa', description: 'Ferramenta para excluir ou alterar o status de vários eventos simultaneamente, economizando tempo.', icon: Hammer },
      { title: 'Filtros Avançados', description: 'Refinamento por Unidade, Status, Tipo de Evento ou apenas Conflitos.', icon: LayoutDashboard },
    ]
  },
  '/usuarios': {
    title: 'Painel de Controle e Usuários',
    description: 'Gestão de acessos, segurança do sistema e integrações externas.',
    functions: [
      { title: 'Controle de Acessos', description: 'Definição de quem pode ver, editar ou administrar cada parte do sistema.', icon: Shield },
      { title: 'Integração (Embed)', description: 'Geração de códigos para exibir o calendário em outros sites ou portais da unidade.', icon: Hammer },
    ],
    roles: [
      { title: 'Admin Geral', description: 'Configura o sistema, gerencia permissões críticas e resolve solicitações de acesso.', icon: Shield },
      { title: 'Solicitantes', description: 'Usuários novos que aguardam aprovação para entrar no sistema com um perfil específico.', icon: Users },
    ],
    tools: [
      { title: 'Impersonação', description: 'Recurso para administradores testarem o sistema com a visão exata de outro usuário.', icon: Users },
      { title: 'Solicitações de Aprovação', description: 'Fila de análise para novos cadastros ou mudanças de cargo.', icon: Info },
    ]
  },
  '/auditoria': {
    title: 'Registro de Auditoria',
    description: 'Histórico completo de transparência e rastreabilidade de todas as ações.',
    functions: [
      { title: 'Rastreabilidade', description: 'Saber exatamente QUEM alterou O QUÊ e em QUAL MOMENTO.', icon: History },
      { title: 'Recuperação de Informação', description: 'Consulta de valores antigos caso ocorra algum erro ou alteração indevida.', icon: Info },
    ],
    roles: [
      { title: 'Auditores/Admins', description: 'Apenas perfis de alta confiança têm acesso a este log detalhado de segurança.', icon: Shield },
    ],
    tools: [
      { title: 'Linha do Tempo de Log', description: 'Lista ordenada de eventos do sistema com detalhes técnicos e operacionais.', icon: History },
      { title: 'Busca por Usuário', description: 'Filtro para analisar o histórico de ações de uma pessoa específica.', icon: Users },
    ]
  },
  '/login': {
    title: 'Acesso ao Sistema',
    description: 'Porta de entrada para membros autorizados da anabrasil.',
    functions: [
      { title: 'Autenticação Segura', description: 'Validação de identidade via e-mail e senha cadastrados.', icon: LogIn },
      { title: 'Recuperação de Senha', description: 'Fluxo automático para redefinir o acesso caso o usuário esqueça a senha.', icon: Hammer },
    ],
    roles: [
      { title: 'Membros Cadastrados', description: 'Funcionários e parceiros que já possuem uma conta ativa.', icon: Users },
    ],
    tools: [
      { title: 'Magic Link', description: 'Opção de login rápido via link enviado diretamente ao e-mail.', icon: LogIn },
    ]
  }
};

export default function FooterLegend() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const path = location.pathname;
  const legend = legends[path] || legends['/']; // Fallback to Dashboard if path not found

  return (
    <div className="mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-accent/50 transition-all duration-300 backdrop-blur-sm",
          isExpanded && "rounded-b-none border-b-0 bg-accent/30"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-foreground tracking-tight">Guia da Página: {legend.title}</span>
            <span className="text-xs text-muted-foreground">Clique para entender funções, cargos e ferramentas desta tela</span>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform duration-500",
          isExpanded ? "rotate-180" : ""
        )} />
      </button>

      {isExpanded && (
        <Card className="rounded-t-none border-t-0 bg-card/30 backdrop-blur-md animate-in slide-in-from-top-2 duration-500 overflow-hidden">
          <CardContent className="p-6 pt-2 space-y-8">
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
              {legend.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Funções */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Hammer className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Principais Funções</h4>
                </div>
                <div className="space-y-4">
                  {legend.functions.map((f, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 rounded bg-muted group-hover:bg-primary/20 transition-colors">
                          <f.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground leading-none">{f.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cargos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Quem Atua Aqui</h4>
                </div>
                <div className="space-y-4">
                  {legend.roles.map((r, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 rounded bg-muted group-hover:bg-primary/20 transition-colors">
                          <r.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground leading-none">{r.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ferramentas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-wider text-foreground">Ferramentas de Apoio</h4>
                </div>
                <div className="space-y-4">
                  {legend.tools.map((t, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 rounded bg-muted group-hover:bg-primary/20 transition-colors">
                          <t.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground leading-none">{t.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
