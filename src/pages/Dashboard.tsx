import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStatusBadgeClass } from '@/lib/statusColors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useFilteredEvents } from '@/hooks/useFilteredEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppEvent, EventStatus, UNITS, Unit } from '@/types';
import { CalendarDays, CheckCircle2, Clock, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Camera, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import EventFormDialog from '@/components/EventFormDialog';
import EventDetailPanel from '@/components/EventDetailPanel';
import ConflictDialog from '@/components/ConflictDialog';
import FilteredEventsDialog from '@/components/FilteredEventsDialog';

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const unitDotColors: Record<Unit, string> = {
  'DIC': 'bg-unit-dic',
  'Nilópolis': 'bg-unit-nilopolis',
  'Santana': 'bg-unit-santana',
  'Evento Geral do Grupo': 'bg-unit-geral',
};


export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const hideTitle = searchParams.get('hideTitle') === 'true';
  const { events: rawEvents, selectedMonth, setSelectedMonth, setSelectedEvent, deleteEvent, updateEvent } = useApp();
  const events = useFilteredEvents();
  const { isAuthenticated } = useAuth();
  const { canEdit } = useUserRole();
  const isMobile = useIsMobile();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  
  const [showConflicts, setShowConflicts] = useState(false);
  const [showFiltered, setShowFiltered] = useState<'marketing' | 'partners' | 'confirmed' | 'pending' | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const threeDaysAgo = useMemo(() => subDays(new Date(), 3), []);

  const monthEvents = useMemo(() => events.filter(e => {
    const d = new Date(e.start_datetime);
    return d >= monthStart && d <= monthEnd;
  }), [events, monthStart, monthEnd]);

  // Events from 3 days ago onwards (no end limit) for total count
  const activeEvents = useMemo(() => events.filter(e => {
    const d = new Date(e.start_datetime);
    return d >= threeDaysAgo;
  }), [events, threeDaysAgo]);

  const weekEvents = useMemo(() => events.filter(e => {
    const d = new Date(e.start_datetime);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }), [events, weekStart, weekEnd]);

  const stats = useMemo(() => ({
    total: monthEvents.length,
    confirmed: monthEvents.filter(e => e.status === 'confirmado').length,
    pending: monthEvents.filter(e => e.status === 'pendente').length,
    conflict: monthEvents.filter(e => e.has_conflict).length,
    marketing: monthEvents.filter(e => e.marketing_request).length,
    partners: monthEvents.filter(e => e.partner_involved).length,
  }), [monthEvents, activeEvents]);


  const prevMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));

  const handleEventClick = (event: AppEvent) => {
    setDetailEvent(event);
    setShowDetail(true);
  };

  const handleEdit = (event: AppEvent) => {
    setShowDetail(false);
    setSelectedEvent(event);
    setEditingEvent(event);
    setShowEdit(true);
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    setShowDetail(false);
  };

  const handleConflictEventClick = (event: AppEvent) => {
    setShowConflicts(false);
    setTimeout(() => handleEventClick(event), 200);
  };


  const statCards = [
    { label: 'Total de Eventos', value: stats.total, icon: CalendarDays, color: 'text-info', onClick: undefined },
    { label: 'Confirmados', value: stats.confirmed, icon: CheckCircle2, color: 'text-success', onClick: () => setShowFiltered('confirmed') },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-warning', onClick: () => setShowFiltered('pending') },
    { label: 'Com Conflito', value: stats.conflict, icon: AlertCircle, color: 'text-destructive', onClick: () => setShowConflicts(true) },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!hideTitle && (
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Visão Geral</h1>
            <p className="text-sm text-muted-foreground">Programação institucional de todas as unidades</p>
          </div>
        )}
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", hideTitle && "ml-auto")}>
          {canEdit && (
            <Button onClick={() => setShowNewEvent(true)} className="w-full gap-2 sm:w-auto shadow-sm hover:shadow-md transition-all active:scale-95">
              <Plus className="h-4 w-4" /> <span className="sm:inline font-medium">Nova Programação</span>
            </Button>
          )}
          <div className="flex items-center justify-between gap-1 rounded-xl border border-border bg-card/50 backdrop-blur-sm px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-accent rounded-lg transition-colors"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-2 rounded-lg px-3 py-1 hover:bg-accent transition-all min-w-[120px] sm:min-w-[180px]">
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold capitalize text-foreground tracking-tight">
                    {format(selectedMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-border shadow-xl rounded-xl" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  defaultMonth={selectedMonth}
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <button onClick={nextMonth} className="p-1.5 hover:bg-accent rounded-lg transition-colors"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <Card
            key={s.label}
            className={cn(
              "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-xl hover:-translate-y-1",
              s.onClick ? 'cursor-pointer' : ''
            )}
            style={{ animationDelay: `${i * 100}ms` }}
            onClick={s.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <div className={cn("rounded-full p-2 bg-background shadow-inner transition-colors group-hover:bg-primary/10", s.color)}>
                  <s.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
              </div>
              
              {s.label === 'Total de Eventos' && (
                <div className="mt-6 flex items-center gap-4 border-t border-border/50 pt-4">
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                    title="Solicitações de Marketing"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('marketing'); }}
                  >
                    <Camera className="h-4 w-4 text-primary/70" />
                    <span className="text-sm font-bold text-foreground">{stats.marketing}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                    title="Parceiros Envolvidos"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('partners'); }}
                  >
                    <Handshake className="h-4 w-4 text-primary/70" />
                    <span className="text-sm font-bold text-foreground">{stats.partners}</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline da Semana Atual */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-border/50 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Timeline Semanal</h2>
                <p className="text-xs text-muted-foreground">Próximos compromissos agendados</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 py-1.5 rounded-full bg-muted/30">
              {UNITS.map(u => (
                <div key={u} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${unitDotColors[u]} shadow-sm`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{u === 'Evento Geral do Grupo' ? 'Geral' : u}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6">
            {weekEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nenhum evento programado para esta semana</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {weekEvents.slice(0, 6).map((e, i) => (
                  <button 
                    key={e.id} 
                    onClick={() => handleEventClick(e)}
                    className="group flex w-full items-center gap-4 rounded-xl border border-border/40 bg-background/50 p-4 text-left transition-all hover:border-primary/30 hover:shadow-md hover:bg-accent/50"
                  >
                    <div className={cn("h-10 w-1 rounded-full", unitDotColors[e.unit])} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{e.title}</h3>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(e.start_datetime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" />
                          {format(new Date(e.start_datetime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("ml-auto text-[10px] uppercase tracking-widest px-2.5 py-1 font-bold border-border/50", getStatusBadgeClass(e.status))}>
                      {e.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      <EventFormDialog open={showNewEvent} onOpenChange={setShowNewEvent} />
      <EventFormDialog open={showEdit} onOpenChange={(v) => { setShowEdit(v); if (!v) setEditingEvent(null); }} event={editingEvent} />
      <EventDetailPanel event={detailEvent} open={showDetail} onOpenChange={setShowDetail} onEdit={canEdit ? handleEdit : undefined} onDelete={canEdit ? handleDelete : undefined} />
      <ConflictDialog events={monthEvents} selectedMonth={selectedMonth} open={showConflicts} onOpenChange={setShowConflicts} onEventClick={handleConflictEventClick} />
      {showFiltered && (
        <FilteredEventsDialog
          events={showFiltered === 'marketing' || showFiltered === 'partners' ? activeEvents : monthEvents}
          filterType={showFiltered}
          selectedMonth={selectedMonth}
          open={!!showFiltered}
          onOpenChange={(v) => { if (!v) setShowFiltered(null); }}
          onEventClick={(e) => { setShowFiltered(null); setTimeout(() => handleEventClick(e), 200); }}
        />
      )}
    </div>
  );
}
