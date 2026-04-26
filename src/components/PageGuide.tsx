import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  ShieldCheck, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon, 
  UserCog, 
  Code2, 
  ChevronUp,
  MapPin
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface GuideSection {
  title: string;
  content: string;
  icon?: React.ReactNode;
}

interface LegendItem {
  title: string;
  content: string;
  color?: string;
}

interface GuideContent {
  title: string;
  description: string;
  sections: GuideSection[];
  footer?: {
    title: string;
    items: LegendItem[];
  };
  units?: {
    title: string;
    items: LegendItem[];
  };
}

const UNIT_LEGEND_ITEMS: LegendItem[] = [
  { title: 'DIC', content: 'Unidade DIC', color: 'bg-unit-dic' },
  { title: 'Nilópolis', content: 'Unidade Nilópolis', color: 'bg-unit-nilopolis' },
  { title: 'Santana', content: 'Unidade Santana', color: 'bg-unit-santana' },
  { title: 'Geral', content: 'Evento Geral do Grupo', color: 'bg-unit-geral' },
];

const GUIDES: Record<string, GuideContent | Record<string, GuideContent>> = {
  '/': {
    title: 'Guia da Visão Geral',
    description: 'Aprenda a navegar pelo painel principal de eventos.',
    sections: [
      {
        title: 'Indicadores em Tempo Real',
        content: 'Visualize o total de eventos, confirmados, pendentes e conflitos do mês selecionado. Clique nos cards para filtrar a lista.',
        icon: <Info className="h-4 w-4 text-blue-500" />
      },
      {
        title: 'Filtros Avançados',
        content: 'Filtre por unidade, status ou identifique conflitos de agenda instantaneamente com o botão "Conflitos".',
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
      },
      {
        title: 'Busca Inteligente',
        content: 'A barra de busca permite encontrar eventos por título, local ou descrição em todas as unidades.',
        icon: <Search className="h-4 w-4 text-primary" />
      },
      {
        title: 'Timeline Semanal',
        content: 'Acompanhe os próximos eventos da semana com cores identificando cada unidade do grupo.',
        icon: <BookOpen className="h-4 w-4 text-green-500" />
      }
    ],
    units: {
      title: 'Legenda de Unidades',
      items: UNIT_LEGEND_ITEMS
    },
    footer: {
      title: 'Legenda de Status',
      items: [
        { title: 'Confirmado', content: 'Evento validado e pronto para realização.', color: 'bg-green-500' },
        { title: 'Pendente', content: 'Aguardando aprovação ou detalhes finais.', color: 'bg-amber-500' },
        { title: 'Conflito', content: 'Horários sobrepostos em uma mesma unidade.', color: 'bg-destructive' },
        { title: 'Marketing', content: 'Eventos que possuem solicitação de cobertura.', color: 'bg-blue-500' }
      ]
    }
  },
  '/calendario': {
    'month': {
      title: 'Guia do Calendário (Mensal)',
      description: 'Visualize todos os eventos do mês de forma organizada.',
      sections: [
        {
          title: 'Navegação e Data',
          content: 'Navegue entre os meses ou selecione uma data específica no seletor central.',
          icon: <LayoutGrid className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Drag and Drop',
          content: 'Arraste e solte eventos entre os dias para reagendar rapidamente (apenas computadores).',
          icon: <Info className="h-4 w-4 text-primary" />
        },
        {
          title: 'Ações em Massa',
          content: 'Selecione múltiplos eventos para excluir ou alterar status simultaneamente.',
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
        }
      ],
      units: {
        title: 'Legenda de Unidades',
        items: UNIT_LEGEND_ITEMS
      },
      footer: {
        title: 'Cores e Identificação',
        items: [
          { title: 'Status', content: 'Cores de fundo e bordas indicam se está Confirmado ou Pendente.', color: 'bg-amber-500' },
          { title: 'Conflitos', content: 'Dias com múltiplos eventos no mesmo horário são destacados.', color: 'bg-destructive' },
          { title: 'Hoje', content: 'O dia atual é destacado com um fundo suave azulado.', color: 'bg-blue-400' }
        ]
      }
    },
    'week': {
      title: 'Guia do Calendário (Semanal)',
      description: 'Foque nos eventos da semana selecionada.',
      sections: [
        {
          title: 'Visão Detalhada',
          content: 'Visualize a distribuição horária dos eventos ao longo de cada dia da semana.',
          icon: <CalendarIcon className="h-4 w-4 text-blue-500" />
        }
      ],
      units: {
        title: 'Legenda de Unidades',
        items: UNIT_LEGEND_ITEMS
      }
    },
    'list': {
      title: 'Guia do Calendário (Lista)',
      description: 'Visualize os eventos em formato de lista cronológica.',
      sections: [
        {
          title: 'Fácil Leitura',
          content: 'Ideal para uma visualização rápida e sequencial dos próximos compromissos em todas as unidades.',
          icon: <List className="h-4 w-4 text-blue-500" />
        }
      ],
      units: {
        title: 'Legenda de Unidades',
        items: UNIT_LEGEND_ITEMS
      }
    }
  },
  '/usuarios': {
    'users': {
      title: 'Gerenciamento de Usuários',
      description: 'Administre o acesso e as permissões de todos os colaboradores.',
      sections: [
        {
          title: 'Níveis de Acesso',
          content: 'Admin Geral (acesso total), Gestor (sua unidade), Editor e Visualizador.',
          icon: <ShieldCheck className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Aprovação de Cadastros',
          content: 'Gerencie solicitações de novos usuários que aguardam permissão para acessar o sistema.',
          icon: <UserCog className="h-4 w-4 text-green-500" />
        }
      ],
      footer: {
        title: 'Regras de Segurança',
        items: [
          { title: 'Ativação', content: 'Usuários inativos não podem realizar login, mesmo com senha correta.', color: 'bg-slate-400' },
          { title: 'Hierarquia', content: 'Gestores não podem alterar permissões de Administradores.', color: 'bg-primary' }
        ]
      }
    },
    'view-configs': {
      title: 'Configurações de Visualização',
      description: 'Personalize as restrições de acesso padrão por cargo.',
      sections: [
        {
          title: 'Visualização por Perfil',
          content: 'Defina quais unidades cada tipo de cargo (ex: Visualizador) pode ver por padrão.',
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
        },
        {
          title: 'Sistema Híbrido',
          content: 'Escolha entre usar restrições rígidas por cargo ou permissões manuais individualizadas.',
          icon: <Info className="h-4 w-4 text-blue-500" />
        }
      ],
      footer: {
        title: 'Funcionamento',
        items: [
          { title: 'Por Cargo', content: 'Ignora restrições manuais em favor do padrão hierárquico.', color: 'bg-primary' },
          { title: 'Manual', content: 'Prioriza as restrições personalizadas de cada perfil individual.', color: 'bg-amber-500' }
        ]
      }
    },
    'embed': {
      title: 'Integração e Embed',
      description: 'Incorpore o calendário em portais externos ou intranets.',
      sections: [
        {
          title: 'Links Públicos',
          content: 'Gere links que não exigem login Lovable para visualização externa.',
          icon: <Code2 className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Personalização',
          content: 'Oculte cabeçalhos ou menus para uma integração limpa em iFrames.',
          icon: <Search className="h-4 w-4 text-primary" />
        }
      ],
      footer: {
        title: 'Dica de Publicação',
        items: [
          { title: 'Domínio', content: 'Sempre use a URL de produção para evitar pedidos de login.', color: 'bg-green-600' },
          { title: 'iFrame', content: 'Use width="100%" para garantir a responsividade do widget.', color: 'bg-primary' }
        ]
      }
    }
  },
  '/auditoria': {
    title: 'Logs de Auditoria',
    description: 'Rastreabilidade completa de todas as ações importantes no sistema.',
    sections: [
      {
        title: 'Histórico de Ações',
        content: 'Veja quem criou, editou ou excluiu qualquer evento, incluindo a data e hora exata.',
        icon: <Clock className="h-4 w-4 text-blue-500" />
      },
      {
        title: 'Detalhes Técnicos',
        content: 'A coluna "Detalhes" mostra exatamente quais campos foram alterados durante a edição.',
        icon: <Info className="h-4 w-4 text-primary" />
      }
    ],
    footer: {
      title: 'Privacidade e Controle',
      items: [
        { title: 'Imutabilidade', content: 'Os logs de auditoria não podem ser editados ou excluídos.', color: 'bg-destructive' },
        { title: 'Retenção', content: 'O sistema mantém o histórico recente de todas as unidades.', color: 'bg-info' }
      ]
    }
  }
};

interface PageGuideProps {
  activeTab?: string;
}

export default function PageGuide({ activeTab }: PageGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  
  const getGuideContent = (): GuideContent | null => {
    const guide = GUIDES[path];
    if (!guide) return null;
    
    if ('title' in guide) {
      return guide as GuideContent;
    }
    
    if (activeTab && (guide as Record<string, GuideContent>)[activeTab]) {
      return (guide as Record<string, GuideContent>)[activeTab];
    }
    
    const firstTab = Object.keys(guide)[0];
    return (guide as Record<string, GuideContent>)[firstTab];
  };

  const content = getGuideContent();

  if (!content) return null;

  return (
    <div className="mt-12 mb-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 print:hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-foreground">Legenda e Funcionamento do Sistema</h3>
                  <p className="text-xs text-muted-foreground">{content.title}</p>
                </div>
              </div>
              
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "gap-2 transition-all rounded-lg",
                    isOpen && "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <span className="text-xs font-medium">{isOpen ? "Ocultar Detalhes" : "Ver Funcionamento"}</span>
                  <ChevronUp className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Informações da Página */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.sections.map((section, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-lg border border-border bg-accent/5 hover:bg-accent/10 transition-colors">
                        <div className="mt-0.5 shrink-0 p-2 rounded-md bg-background shadow-sm">
                          {section.icon || <Info className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">{section.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legendas */}
                <div className="space-y-6 lg:border-l lg:border-border/50 lg:pl-8">
                  {content.units && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{content.units.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                        {content.units.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-md bg-accent/5 border border-border/50">
                            <div className={cn("h-3 w-3 rounded-full shadow-sm", item.color || 'bg-primary')} />
                            <span className="text-xs font-medium text-foreground">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {content.footer && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{content.footer.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {content.footer.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-2 rounded-md bg-background border shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-2 w-2 rounded-full", item.color || 'bg-primary')} />
                              <span className="text-xs font-bold text-primary">{item.title}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-tight pl-4">{item.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
