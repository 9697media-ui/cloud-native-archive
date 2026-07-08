import { Link } from 'react-router-dom';
import { History, BookOpen, FileSearch, LayoutDashboard, Megaphone, Lock } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

const tools = [
  {
    to: '/auditoria',
    label: 'Auditoria',
    description: 'Histórico de ações e registros do sistema.',
    icon: History,
  },
  {
    to: '/design-manual',
    label: 'Manual Design',
    description: 'Diretrizes visuais e identidade da marca.',
    icon: BookOpen,
  },
  {
    to: '/portal-transparencia',
    label: 'Portal Transparência',
    description: 'Configuração e gestão do portal de transparência.',
    icon: FileSearch,
  },
  {
    to: '/admin-toolbox',
    label: 'Widgets',
    description: 'Ferramentas e widgets administrativos.',
    icon: LayoutDashboard,
  },
];

export default function MarketingHubPage() {
  const { isMarketing, loading } = useUserRole();

  if (loading) return null;

  if (!isMarketing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          Esta área é exclusiva para o setor de Marketing.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
      <PageHeader
        icon={Megaphone}
        title="Marketing"
        description="Central de ferramentas exclusivas do setor de Marketing."
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.to} to={tool.to} className="group">
            <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <tool.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{tool.label}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
