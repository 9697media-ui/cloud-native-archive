import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
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
  ChevronDown 
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface GuideSection {
  title: string;
  content: string;
  icon?: React.ReactNode;
}

interface GuideContent {
  title: string;
  description: string;
  sections: GuideSection[];
  footer?: {
    title: string;
    items: Array<{
      title: string;
      content: string;
      color?: string;
    }>;
  };
}

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
    footer: {
      title: 'Legenda e Funcionamento',
      items: [
        { title: 'Confirmado', content: 'Evento validado e pronto para realização.', color: 'bg-green-500' },
        { title: 'Pendente', content: 'Aguardando aprovação ou detalhes finais.', color: 'bg-amber-500' },
        { title: 'Conflito', content: 'Horários sobrepostos em uma mesma unidade.', color: 'bg-destructive' },
        { title: 'Marketing', content: 'Eventos que possuem solicitação de cobertura.', color: 'bg-blue-500' },
        { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
        { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
        { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
        { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
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
      footer: {
        title: 'Legenda e Funcionamento',
        items: [
          { title: 'Status', content: 'Cores de fundo e bordas indicam se está Confirmado ou Pendente.', color: 'bg-amber-500' },
          { title: 'Conflitos', content: 'Dias com múltiplos eventos no mesmo horário são destacados.', color: 'bg-destructive' },
          { title: 'Hoje', content: 'O dia atual é destacado com um fundo suave azulado.', color: 'bg-blue-400' },
          { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
          { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
          { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
          { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
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
      footer: {
        title: 'Legenda e Funcionamento',
        items: [
          { title: 'Horários', content: 'Visualize a ocupação diária por faixas de horário.', color: 'bg-primary' },
          { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
          { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
          { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
          { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
        ]
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
      footer: {
        title: 'Legenda e Funcionamento',
        items: [
          { title: 'Cronologia', content: 'Eventos ordenados do mais próximo para o futuro.', color: 'bg-primary' },
          { title: 'Filtros', content: 'A lista respeita todos os filtros ativos no topo.', color: 'bg-amber-500' },
          { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
          { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
          { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
          { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
        ]
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
        title: 'Legenda e Funcionamento',
        items: [
          { title: 'Ativação', content: 'Usuários inativos não podem realizar login, mesmo com senha correta.', color: 'bg-slate-400' },
          { title: 'Hierarquia', content: 'Gestores não podem alterar permissões de Administradores.', color: 'bg-primary' },
          { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
          { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
          { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
          { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
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
        title: 'Legenda e Funcionamento do Sistema',
        items: [
          { title: 'Sistema por Cargo Ativo', content: 'Quando Ligado, o sistema segue estritamente os padrões definidos por Cargo abaixo, ignorando restrições manuais.', color: 'bg-primary' },
          { title: 'Sistema por Cargo Inativo', content: 'Quando Desligado, o sistema permite que você defina Restrições Individuais personalizadas por usuário.', color: 'bg-amber-500' },
          { title: 'DIC', content: 'Unidade DIC do grupo.', color: 'bg-unit-dic' },
          { title: 'Nilópolis', content: 'Unidade Nilópolis do grupo.', color: 'bg-unit-nilopolis' },
          { title: 'Santana', content: 'Unidade Santana do grupo.', color: 'bg-unit-santana' },
          { title: 'Evento Geral', content: 'Evento que abrange todas as unidades do grupo.', color: 'bg-unit-geral' }
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
        title: 'Legenda e Funcionamento',
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
      title: 'Legenda e Funcionamento',
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
  const [expanded, setExpanded] = useState(false);
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
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-card hover:bg-accent/50 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-foreground">Guia de Uso</span>
            <span className="text-xs text-muted-foreground">
              {content.title} - Saiba como utilizar os recursos desta página
            </span>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 p-6 rounded-lg border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-300 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {content.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {content.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {content.sections.map((section, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-accent/50">
                  {section.icon || <Info className="h-4 w-4 text-primary" />}
                </div>
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {content.footer && (
            <div className="space-y-4 pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{content.footer.title}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.footer.items.map((item, idx) => (
                  <div key={idx} className="space-y-2 p-4 rounded-lg bg-background border shadow-sm">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color || 'bg-primary'}`} />
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(false)}
              className="text-xs"
            >
              Recolher Guia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
