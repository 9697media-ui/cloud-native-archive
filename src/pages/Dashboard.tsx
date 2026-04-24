import { useMemo, useState } from 'react';
import { getStatusBadgeClass } from '@/lib/statusColors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppEvent, EventStatus, UNITS, Unit } from '@/types';
import { CalendarDays, CheckCircle2, Clock, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Camera, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import EventFormDialog from '@/components/EventFormDialog';
import EventDetailPanel from '@/components/EventDetailPanel';
import ConflictDialog from '@/components/ConflictDialog';
import FilteredEventsDialog from '@/components/FilteredEventsDialog';
import BulkActionBar from '@/components/BulkActionBar';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const unitDotColors: Record<Unit, string> = {
  'DIC': 'bg-unit-dic',
  'Nilópolis': 'bg-unit-nilopolis',
  'Santana': 'bg-unit-santana',
  'Evento Geral do Grupo': 'bg-unit-geral',
};

const unitBorderColors: Record<Unit, string> = {
  'DIC': 'border-l-unit-dic',
  'Nilópolis': 'border-l-unit-nilopolis',
  'Santana': 'border-l-unit-santana',
  'Evento Geral do Grupo': 'border-l-unit-geral',
};

export default function Dashboard() {
  const { events, selectedMonth, setSelectedMonth, setSelectedEvent, deleteEvent, updateEvent } = useApp();
  const { isAuthenticated } = useAuth();
  const { canEdit } = useUserRole();
  const isMobile = useIsMobile();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [showConflicts, setShowConflicts] = useState(false);
  const [showFiltered, setShowFiltered] = useState<'marketing' | 'partners' | 'confirmed' | 'pending' | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const toggleEventSelection = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    selectedEvents.forEach(id => deleteEvent(id));
    setSelectedEvents(new Set());
  };

  const handleBulkStatusChange = (status: EventStatus) => {
    events.filter(e => selectedEvents.has(e.id)).forEach(e => {
      updateEvent({ ...e, status, updated_at: new Date().toISOString() });
    });
    setSelectedEvents(new Set());
  };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const threeDaysAgo = subDays(new Date(), 3);

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
    marketing: activeEvents.filter(e => e.marketing_request).length,
    partners: activeEvents.filter(e => e.partner_involved).length,
  }), [monthEvents, activeEvents]);

  const unitStats = useMemo(() => UNITS.map(unit => {
    const unitEvents = monthEvents.filter(e => e.unit === unit);
    return {
      unit,
      total: unitEvents.length,
      confirmed: unitEvents.filter(e => e.status === 'confirmado').length,
      pending: unitEvents.filter(e => e.status === 'pendente').length,
      cancelled: unitEvents.filter(e => e.status === 'cancelado').length,
    };
  }), [monthEvents]);

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

  const toggleUnit = (unit: string) => {
    setOpenUnits(prev => ({ ...prev, [unit]: !prev[unit] }));
  };

  const getUnitEvents = (unit: Unit) =>
    monthEvents.filter(e => e.unit === unit).sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  const statCards = [
    { label: 'Total de Eventos', value: stats.total, icon: CalendarDays, color: 'text-info', onClick: undefined },
    { label: 'Confirmados', value: stats.confirmed, icon: CheckCircle2, color: 'text-success', onClick: () => setShowFiltered('confirmed') },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-warning', onClick: () => setShowFiltered('pending') },
    { label: 'Com Conflito', value: stats.conflict, icon: AlertCircle, color: 'text-destructive', onClick: () => setShowConflicts(true) },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Visão Geral Consolidada</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Programação institucional de todas as unidades</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {canEdit && (
            <Button onClick={() => setShowNewEvent(true)} className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" /> <span className="sm:inline">Nova Programação</span>
            </Button>
          )}
          <div className="flex items-center justify-between gap-1 rounded-lg border border-border bg-card px-2 py-1.5 sm:px-3 sm:py-2">
            <button onClick={prevMonth} className="p-1 hover:bg-accent rounded"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-1.5 rounded px-2 py-0.5 hover:bg-accent transition-colors min-w-[120px] sm:min-w-[160px]">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0 sm:h-4 sm:w-4" />
                  <span className="text-xs font-medium capitalize text-foreground sm:text-sm">
                    {format(selectedMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
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
            <button onClick={nextMonth} className="p-1 hover:bg-accent rounded"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        {statCards.map(s => (
          <Card
            key={s.label}
            className={cn(
              "transition-shadow hover:shadow-md",
              s.onClick ? 'cursor-pointer' : ''
            )}
            onClick={s.onClick}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground sm:text-xs uppercase tracking-wider">{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color} opacity-70 shrink-0 sm:h-6 sm:w-6`} />
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground sm:mt-2 sm:text-3xl">{s.value}</p>
              {s.label === 'Total de Eventos' && (
                <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 sm:mt-3 sm:gap-4 sm:pt-3">
                  <button
                    className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                    title="Solicitações de Marketing"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('marketing'); }}
                  >
                    <Camera className="h-3.5 w-3.5 text-info sm:h-4 sm:w-4" />
                    <span className="text-xs font-semibold text-foreground sm:text-sm">{stats.marketing}</span>
                  </button>
                  <button
                    className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                    title="Parceiros Envolvidos"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('partners'); }}
                  >
                    <Handshake className="h-3.5 w-3.5 text-info sm:h-4 sm:w-4" />
                    <span className="text-xs font-semibold text-foreground sm:text-sm">{stats.partners}</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk action bar for events */}
      {canEdit && (
        <BulkActionBar
          type="events"
          count={selectedEvents.size}
          onClearSelection={() => setSelectedEvents(new Set())}
          onDelete={handleBulkDelete}
          onChangeStatus={handleBulkStatusChange}
        />
      )}

      {/* Timeline da Semana Atual */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Timeline da Semana Atual</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {UNITS.map(u => (
                <div key={u} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${unitDotColors[u]} shrink-0 sm:h-2.5 sm:w-2.5`} />
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{u === 'Evento Geral do Grupo' ? 'Geral' : u}</span>
                </div>
              ))}
            </div>
          </div>
          {weekEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento nesta semana</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {weekEvents.slice(0, 6).map(e => (
                <div key={e.id} className="flex w-full items-center gap-2 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-accent sm:gap-3 sm:p-3">
                  {canEdit && (
                    <Checkbox
                      checked={selectedEvents.has(e.id)}
                      onCheckedChange={() => toggleEventSelection(e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                      className="h-4 w-4"
                    />
                  )}
                  <button onClick={() => handleEventClick(e)} className="flex flex-1 items-center gap-2 text-left sm:gap-3">
                    <span className={`h-2 w-2 rounded-full ${unitDotColors[e.unit]} shrink-0 sm:h-2.5 sm:w-2.5`} />
                    <span className="flex-1 text-xs font-medium text-foreground line-clamp-1 sm:text-sm">{e.title}</span>
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap sm:text-xs">
                        {format(new Date(e.start_datetime), 'dd/MM HH:mm')}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize sm:text-xs sm:px-2.5 sm:py-0.5", getStatusBadgeClass(e.status))}>
                        {e.status}
                      </Badge>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit blocks - collapsible FAQ style */}
      <div className="space-y-3">
        {unitStats.map(u => {
          const unitEvents = getUnitEvents(u.unit);
          return (
            <Collapsible key={u.unit} open={openUnits[u.unit] || false} onOpenChange={() => toggleUnit(u.unit)}>
              <Card className={`border-l-4 ${unitBorderColors[u.unit]} transition-shadow hover:shadow-md`}>
                <CollapsibleTrigger className="w-full text-left">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${unitDotColors[u.unit]} shrink-0 sm:h-3 sm:w-3`} />
                        <span className="text-sm font-semibold text-foreground sm:text-base">{u.unit}</span>
                      </div>
                      <Badge className={cn("text-[10px] px-1.5 py-0 sm:text-xs sm:px-2 sm:py-0.5", unitDotColors[u.unit], "text-primary-foreground")}>
                        {u.total} eventos
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:gap-5 sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success sm:h-4 sm:w-4" />
                        <span className="text-muted-foreground">{u.confirmed} <span className="hidden sm:inline">confirmados</span></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-warning sm:h-4 sm:w-4" />
                        <span className="text-muted-foreground">{u.pending} <span className="hidden sm:inline">pendentes</span></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive sm:h-4 sm:w-4" />
                        <span className="text-muted-foreground">{u.cancelled} <span className="hidden sm:inline">cancelados</span></span>
                      </span>
                      <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 sm:h-5 sm:w-5", openUnits[u.unit] ? 'rotate-180' : '')} />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border px-5 pb-5">
                    {unitEvents.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">Nenhum evento para esta unidade</p>
                    ) : (
                      <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
                        {unitEvents.map(e => (
                          <div key={e.id} className="flex w-full items-center gap-2 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-accent sm:gap-3 sm:p-3">
                            {canEdit && (
                              <Checkbox
                                checked={selectedEvents.has(e.id)}
                                onCheckedChange={() => toggleEventSelection(e.id)}
                                onClick={(ev) => ev.stopPropagation()}
                                className="h-4 w-4"
                              />
                            )}
                            <button onClick={() => handleEventClick(e)} className="flex flex-1 items-center gap-2 text-left sm:gap-3">
                              <span className={`h-2 w-2 rounded-full ${unitDotColors[e.unit]} shrink-0 sm:h-2.5 sm:w-2.5`} />
                              <span className="flex-1 text-xs font-medium text-foreground line-clamp-1 sm:text-sm">{e.title}</span>
                              <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap sm:text-xs">
                                  {format(new Date(e.start_datetime), 'dd/MM HH:mm')}
                                </span>
                                {e.has_conflict && <AlertTriangle className="h-3 w-3 text-destructive sm:h-3.5 sm:w-3.5" />}
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize sm:text-xs sm:px-2.5 sm:py-0.5", getStatusBadgeClass(e.status))}>
                                  {e.status}
                                </Badge>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

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
