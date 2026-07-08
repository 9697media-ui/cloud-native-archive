import { useState } from 'react';
import { Globe, LayoutDashboard, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PublicEventsPage from '@/pages/PublicEventsPage';
import Dashboard from '@/pages/Dashboard';
import CalendarPage from '@/pages/CalendarPage';

const tabs = [
  { value: 'programacoes', label: 'Programações', icon: Globe, Component: PublicEventsPage },
  { value: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard, Component: Dashboard },
  { value: 'calendario', label: 'Calendário', icon: Calendar, Component: CalendarPage },
];

export default function EventsHubPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('programacoes');

  // Usuários não logados veem apenas a página de eventos, sem pílulas.
  if (!isAuthenticated) {
    return <PublicEventsPage />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="h-10 w-max">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="h-8 gap-1.5">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <tab.Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
