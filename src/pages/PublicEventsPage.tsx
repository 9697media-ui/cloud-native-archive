import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilteredEvents } from '@/hooks/useFilteredEvents';
import { useUserRole } from '@/hooks/useUserRole';
import { useApp } from '@/contexts/AppContext';
import { AppEvent, UNIT_BG_COLORS } from '@/types';
import { CalendarDays, MapPin, Clock, Search, ExternalLink, ChevronLeft, ChevronRight, LayoutPanelTop, Eye, EyeOff, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/PageHeader';
import logoImg from '@/assets/logo.png';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EventDetailDialog } from '@/components/EventDetailDialog';
import EventFormDialog from '@/components/EventFormDialog';

export default function PublicEventsPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<AppEvent | null>(null);
  const { isAdmin } = useUserRole();
  const { updateEvent, setSelectedEvent, selectedEvent } = useApp();
  // Only confirmed events for public view
  const events = useFilteredEvents(true);

  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return events;

    return events.filter(e => 
      e.title.toLowerCase().includes(searchTerm) || 
      (e.location || '').toLowerCase().includes(searchTerm) ||
      (e.description || '').toLowerCase().includes(searchTerm)
    );
  }, [events, search]);

  // Sort by date (nearest first)
  const sortedEvents = useMemo(() => {
    return [...filtered].sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
  }, [filtered]);

  const bannerEvents = useMemo(() => {
    // Show events that have show_in_banner explicitly enabled by admin
    return events.filter(e => e.show_in_banner);
  }, [events]);

  const handleToggleBanner = (event: AppEvent) => {
    const updated = { ...event, show_in_banner: !event.show_in_banner };
    updateEvent(updated);
    toast.success(updated.show_in_banner ? 'Evento adicionado ao banner' : 'Evento removido do banner');
  };

  useEffect(() => {
    const slug = searchParams.get('slug');
    if (slug && events.length > 0) {
      const found = events.find(e => e.slug === slug || e.id === slug);
      if (found) {
        if (isAuthenticated && isAdmin) {
          setSelectedEvent(found);
        } else {
          setSelectedEventForDetail(found);
        }
      }
    }
  }, [searchParams, events, isAuthenticated, isAdmin, setSelectedEvent]);

  useEffect(() => {
    if (bannerEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [bannerEvents.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % bannerEvents.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + bannerEvents.length) % bannerEvents.length);

  const handleCardClick = (event: AppEvent) => {
    if (isAuthenticated && isAdmin) {
      setSelectedEvent(event);
    } else {
      setSelectedEventForDetail(event);
      // Update URL without full refresh to support sharing the specific open state
      setSearchParams({ slug: event.slug || event.id });
    }
  };

  const closeDetail = () => {
    setSelectedEventForDetail(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('slug');
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!isAuthenticated && (
        <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="anabrasil" className="h-10 w-10 rounded-xl" />
              <h1 className="text-xl font-bold tracking-tighter lowercase text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                anabrasil eventos
              </h1>
            </div>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
              Área Restrita <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>
      )}

      {bannerEvents.length > 0 && (
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-slate-900">
          {bannerEvents.map((event, index) => (
            <div 
              key={event.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Desktop Banner (21:9 preferencial, fallback para capa 16:9) */}
              {(event.banner_image_desktop || event.banner_url_desktop || event.banner_url_mobile) ? (
                <>
                  <img 
                    src={event.banner_image_desktop || event.banner_url_desktop || event.banner_url_mobile} 
                    alt={event.title}
                    className="hidden md:block w-full h-full object-cover opacity-60"
                  />
                  {/* Mobile Banner (9:16 preferencial, fallback para capa 4:3) */}
                  <img 
                    src={event.banner_image_mobile || event.banner_url_mobile || event.banner_url_desktop} 
                    alt={event.title}
                    className="block md:hidden w-full h-full object-cover opacity-60"
                  />
                </>
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center opacity-40"
                  style={{ backgroundColor: event.custom_color || '#1e293b' }}
                >
                  <CalendarDays className="h-32 w-32 text-white/20" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
                <Badge className={`${UNIT_BG_COLORS[event.unit]} text-white border-none mb-4`}>
                  {event.unit}
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
                  {event.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-slate-200 text-sm md:text-base mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>{format(new Date(event.start_datetime), "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <Button size="lg" className="rounded-full px-8 shadow-xl">
                    Saber mais
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleBanner(event);
                      }}
                    >
                      <EyeOff className="h-5 w-5 mr-2" /> Remover do Banner
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {bannerEvents.length > 1 && (
            <>
              <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {bannerEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 transition-all rounded-full ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <PageHeader 
            title="Programação de Eventos" 
            description="Confira os próximos eventos confirmados em todas as nossas unidades."
          />
          
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por título, local ou descrição..." 
              className="pl-10 h-12 shadow-sm border-slate-200 focus-visible:ring-primary bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Esta é a visualização pública</p>
                <p className="text-xs text-slate-500">Apenas eventos confirmados e marcados como públicos aparecem aqui.</p>
              </div>
            </div>
            <Link to="/login">
              <Button size="sm" variant="outline">Acessar Área Restrita</Button>
            </Link>
          </div>
        )}

        {sortedEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Nenhum evento encontrado</h3>
            <p className="text-slate-500">Tente ajustar sua busca ou volte mais tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map(event => (
              <Card 
                key={event.id} 
                className="overflow-hidden border-slate-200 hover:shadow-lg transition-shadow bg-white flex flex-col group cursor-pointer"
                onClick={() => handleCardClick(event)}
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {event.banner_url_desktop || event.banner_url_mobile ? (
                    <img 
                      src={event.banner_url_desktop || event.banner_url_mobile} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white/50"
                      style={{ backgroundColor: event.custom_color || '#94a3b8' }}
                    >
                      <CalendarDays className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                  <div className={`absolute top-0 left-0 h-1 w-full ${UNIT_BG_COLORS[event.unit]}`} />
                  <Badge className={`absolute top-3 left-3 ${UNIT_BG_COLORS[event.unit]} text-white border-none shadow-sm`}>
                    {event.unit}
                  </Badge>
                  
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleBanner(event);
                        }}
                        className={`p-1.5 rounded-full shadow-lg backdrop-blur-md transition-colors ${event.show_in_banner ? 'bg-primary text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
                        title={event.show_in_banner ? "Remover do banner" : "Adicionar ao banner"}
                      >
                        {event.show_in_banner ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[10px]">
                        Confirmado
                      </Badge>
                      {event.show_in_banner && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-[10px] flex items-center gap-1">
                          <LayoutPanelTop className="h-2 w-2" /> Banner Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl line-clamp-2 leading-tight text-slate-900 group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{format(new Date(event.start_datetime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>
                        {format(new Date(event.start_datetime), 'HH:mm')} às {format(new Date(event.end_datetime), 'HH:mm')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-slate-500 line-clamp-3 italic border-t border-slate-100 pt-4">
                      "{event.description}"
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {!isAuthenticated && (
        <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-12">
          <div className="max-w-7xl mx-auto text-center">
            <img src={logoImg} alt="anabrasil" className="h-8 w-8 rounded-lg mx-auto mb-4 opacity-50 grayscale" />
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} anabrasil. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
