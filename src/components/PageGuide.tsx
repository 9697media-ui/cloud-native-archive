import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Info, BookOpen, Lightbulb } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface GuideSection {
  title: string;
  content: string;
  icon?: React.ReactNode;
}

interface GuideContent {
  title: string;
  description: string;
  sections: GuideSection[];
}

const GUIDES: Record<string, GuideContent | Record<string, GuideContent>> = {
  '/': {
    title: 'Guia da Visão Geral',
    description: 'Aprenda a navegar pelo painel principal de eventos.',
    sections: [
      {
        title: 'Resumo de Eventos',
        content: 'Visualize o total de eventos, confirmados, pendentes e conflitos do mês selecionado.',
        icon: <Info className="h-4 w-4 text-blue-500" />
      },
      {
        title: 'Filtros e Busca',
        content: 'Utilize os filtros por unidade, status e a barra de busca para encontrar eventos específicos rapidamente.',
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
      },
      {
        title: 'Timeline da Semana',
        content: 'Acompanhe os próximos eventos da semana atual de forma cronológica.',
        icon: <BookOpen className="h-4 w-4 text-green-500" />
      }
    ]
  },
  '/calendario': {
    title: 'Guia do Calendário',
    description: 'Como utilizar o calendário interativo.',
    sections: [
      {
        title: 'Navegação',
        content: 'Alterne entre os meses utilizando as setas no topo ou selecione uma data específica.',
        icon: <Info className="h-4 w-4 text-blue-500" />
      },
      {
        title: 'Criação de Eventos',
        content: 'Clique em um dia vazio ou no botão "Novo" para agendar um novo evento.',
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
      },
      {
        title: 'Detalhes do Evento',
        content: 'Clique em um evento existente para ver detalhes, editar ou excluir.',
        icon: <BookOpen className="h-4 w-4 text-green-500" />
      }
    ]
  },
  '/usuarios': {
    'users': {
      title: 'Guia de Gerenciamento de Usuários',
      description: 'Administre os usuários e suas permissões.',
      sections: [
        {
          title: 'Lista de Usuários',
          content: 'Visualize e busque todos os usuários cadastrados no sistema.',
          icon: <Info className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Permissões',
          content: 'Edite o nível de acesso de cada usuário (Admin, Gestor, Editor, etc).',
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
        },
        {
          title: 'Aprovação de Acessos',
          content: 'Analise e aprove novas solicitações de acesso de novos usuários.',
          icon: <BookOpen className="h-4 w-4 text-green-500" />
        }
      ]
    },
    'view-configs': {
      title: 'Guia de Configurações de Visualização',
      description: 'Personalize como as informações são exibidas.',
      sections: [
        {
          title: 'Filtros Padrão',
          content: 'Defina quais filtros devem estar ativos por padrão ao abrir as páginas.',
          icon: <Info className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Preferências de Layout',
          content: 'Ajuste elementos visuais para melhor atender às necessidades da sua unidade.',
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
        }
      ]
    },
    'embed': {
      title: 'Guia de Integração (Embed)',
      description: 'Como incorporar o sistema em outros sites.',
      sections: [
        {
          title: 'Código de Incorporação',
          content: 'Copie o código HTML gerado para exibir o calendário ou dashboard em portais externos.',
          icon: <Info className="h-4 w-4 text-blue-500" />
        },
        {
          title: 'Parâmetros de URL',
          content: 'Utilize parâmetros como hideTitle=true para remover elementos desnecessários no embed.',
          icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
        }
      ]
    }
  },
  '/auditoria': {
    title: 'Guia de Auditoria',
    description: 'Acompanhe o histórico de alterações no sistema.',
    sections: [
      {
        title: 'Logs de Alteração',
        content: 'Veja quem criou, editou ou excluiu eventos e quando isso ocorreu.',
        icon: <Info className="h-4 w-4 text-blue-500" />
      },
      {
        title: 'Rastreabilidade',
        content: 'Mantenha a segurança e o controle sobre todas as modificações importantes.',
        icon: <Lightbulb className="h-4 w-4 text-yellow-500" />
      }
    ]
  }
};

interface PageGuideProps {
  activeTab?: string;
}

export default function PageGuide({ activeTab }: PageGuideProps) {
  const [open, setOpen] = useState(false);
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
    
    // Fallback to first tab or a default if it's a multi-tab guide
    const firstTab = Object.keys(guide)[0];
    return (guide as Record<string, GuideContent>)[firstTab];
  };

  const content = getGuideContent();

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9 border-primary/20 hover:bg-primary/5 text-primary"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Guia da Página</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {content.description}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-4 pt-4">
            {content.sections.map((section, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border bg-accent/30">
                <div className="mt-0.5 shrink-0">
                  {section.icon || <Info className="h-4 w-4 text-primary" />}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border bg-accent/10 flex justify-end">
          <DialogClose asChild>
            <Button variant="default" size="sm">
              Entendi
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
