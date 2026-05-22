import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStatusBadgeClass } from '@/lib/statusColors';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useFilteredEvents } from '@/hooks/useFilteredEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppEvent, EventStatus, UNITS, EVENT_STATUSES, Unit } from '@/types';
import { CalendarDays, CheckCircle2, Clock, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Camera, Handshake, Search, LayoutGrid, List, Calendar as CalendarIcon, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import EventFormDialog from '@/components/EventFormDialog';
import EventDetailPanel from '@/components/EventDetailPanel';
import ConflictDialog from '@/components/ConflictDialog';
import FilteredEventsDialog from '@/components/FilteredEventsDialog';
import PageHeader from '@/components/PageHeader';
import PageGuide from '@/components/PageGuide';

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
  const { canEdit, canCreate, unit } = useUserRole();
  const isMobile = useIsMobile();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState<AppEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [conflictOnly, setConflictOnly] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showFiltered, setShowFiltered] = useState<'marketing' | 'partners' | 'confirmed' | 'pending' | null>(null);

  // Sync filter unit with user unit when it changes (useful for test mode)
  useEffect(() => {
    if (unit && unit !== 'Evento Geral do Grupo') {
      setFilterUnit(unit);
    } else {
      setFilterUnit('all');
    }
  }, [unit]);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const threeDaysAgo = useMemo(() => subDays(new Date(), 3), []);

  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/);

    return events.filter(e => {
      // 1. Unit filter
      if (filterUnit !== 'all' && e.unit !== filterUnit) return false;
      
      // 2. Status filter
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      
      // 3. Conflict filter
      if (conflictOnly && !e.has_conflict) return false;
      
      // 4. Search filter (multi-word support)
      if (searchTerm) {
        const title = e.title.toLowerCase();
        const location = (e.location || '').toLowerCase();
        const description = (e.description || '').toLowerCase();
        
        return searchWords.every(word => 
          title.includes(word) || location.includes(word) || description.includes(word)
        );
      }
      
      return true;
    });
  }, [events, filterUnit, filterStatus, conflictOnly, search]);

  const monthEvents = useMemo(() => filtered.filter(e => {
    const d = new Date(e.start_datetime);
    return d >= monthStart && d <= monthEnd;
  }), [filtered, monthStart, monthEnd]);

  const activeEvents = useMemo(() => filtered.filter(e => {
    const d = new Date(e.start_datetime);
    return d >= threeDaysAgo;
  }), [filtered, threeDaysAgo]);

  const weekEvents = useMemo(() => filtered.filter(e => {
    const d = new Date(e.start_datetime);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }), [filtered, weekStart, weekEnd]);

  const stats = useMemo(() => {
    return monthEvents.reduce((acc, e) => {
      acc.total++;
      if (e.status === 'confirmado') acc.confirmed++;
      if (e.status === 'pendente') acc.pending++;
      if (e.has_conflict) acc.conflict++;
      if (e.marketing_request) acc.marketing++;
      if (e.partner_involved) acc.partners++;
      return acc;
    }, { total: 0, confirmed: 0, pending: 0, conflict: 0, marketing: 0, partners: 0 });
  }, [monthEvents]);


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
    { label: 'Total de Eventos', value: stats.total, icon: CalendarDays, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20', onClick: undefined },
    { label: 'Confirmados', value: stats.confirmed, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20', onClick: () => setShowFiltered('confirmed') },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20', onClick: () => setShowFiltered('pending') },
    { label: 'Com Conflito', value: stats.conflict, icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20', onClick: () => setShowConflicts(true) },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title={hideTitle ? "" : "Visão Geral"}
        description={hideTitle ? "" : "Programação institucional de todas as unidades"}
        hidden={hideTitle}
        className="mb-4"
        actions={
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3 w-full">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 shadow-sm h-10">
                <button onClick={prevMonth} className="p-1 hover:bg-accent rounded transition-colors"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center justify-center gap-1.5 rounded px-2 py-0.5 hover:bg-accent transition-colors min-w-[120px] sm:min-w-[160px]">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium capitalize text-foreground">
                        {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
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
                <button onClick={nextMonth} className="p-1 hover:bg-accent rounded transition-colors"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedMonth(new Date())}
                className="h-10 px-3 shadow-sm border-muted-foreground/20 bg-background"
              >
                Hoje
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="h-10 w-[130px] shadow-sm bg-background"><SelectValue placeholder="Unidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 w-[110px] shadow-sm bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {EVENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
                
                <Button 
                  variant={conflictOnly ? 'destructive' : 'outline'} 
                  size="default" 
                  onClick={() => setConflictOnly(!conflictOnly)} 
                  className={cn(
                    "h-10 shadow-sm whitespace-nowrap bg-background border-muted-foreground/20",
                    conflictOnly && "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
                  )}
                >
                  Conflitos
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 h-10 shadow-sm border-muted-foreground/20 focus-visible:ring-primary bg-background" 
                />
              </div>

              {canCreate && (
                <Button 
                  onClick={() => setShowNewEvent(true)} 
                  className="gap-2 h-10 shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Novo
                </Button>
              )}
            </div>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        {statCards.map(s => (
          <Card
            key={s.label}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-200/60",
              s.onClick ? 'cursor-pointer active:scale-95' : ''
            )}
            onClick={s.onClick}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl transition-colors duration-300", s.bgColor)}>
                  <s.icon className={cn("h-6 w-6 shrink-0", s.color)} />
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">{s.value}</p>
              </div>
              
              {s.label === 'Total de Eventos' && (
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors group/btn"
                    title="Solicitações de Marketing"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('marketing'); }}
                  >
                    <Camera className="h-4 w-4 text-primary opacity-60 group-hover/btn:opacity-100" />
                    <span className="text-sm font-bold text-foreground/80">{stats.marketing}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors group/btn"
                    title="Parceiros Envolvidos"
                    onClick={(ev) => { ev.stopPropagation(); setShowFiltered('partners'); }}
                  >
                    <Handshake className="h-4 w-4 text-primary opacity-60 group-hover/btn:opacity-100" />
                    <span className="text-sm font-bold text-foreground/80">{stats.partners}</span>
                  </button>
                </div>
              )}
            </CardContent>
            {/* Subtle gradient background for premium feel */}
            <div className={cn("absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-br", s.color === 'text-primary' ? 'from-primary to-transparent' : '')} />
          </Card>
        ))}
      </div>


      {/* Timeline da Semana */}
      <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:grid md:grid-cols-5 min-h-[400px]">
            <div className="p-8 bg-slate-50 border-r border-slate-100 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Timeline</h2>
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atividade da Semana</p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Legenda Unidades</p>
                <div className="space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  {UNITS.map(u => (
                    <div key={u} className="flex items-center gap-3 group">
                      <span className={cn("h-3 w-3 rounded-full shrink-0 transition-transform group-hover:scale-125", unitDotColors[u])} />
                      <span className="text-xs font-bold text-slate-600 truncate">{u === 'Evento Geral do Grupo' ? 'Geral' : u}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-4 p-8">
              {weekEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <CalendarIcon className="h-10 w-10 text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Nenhum evento programado para esta semana.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weekEvents.slice(0, 9).map((e, idx) => (
                    <button 
                      key={e.id} 
                      onClick={() => handleEventClick(e)}
                      className="group flex flex-col p-5 rounded-3xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-500 text-left animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", unitDotColors[e.unit])}>
                          {e.visibility === 'publico' ? (
                            <Globe className="h-5 w-5 text-white" />
                          ) : (
                            <Lock className="h-5 w-5 text-white opacity-90" />
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 border-none", getStatusBadgeClass(e.status))}>
                          {e.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">{e.title}</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {format(new Date(e.start_datetime), "EEEE, d 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-xs font-bold text-slate-500">
                            {format(new Date(e.start_datetime), 'HH:mm')}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
      <PageGuide />
    </div>
  );
}
