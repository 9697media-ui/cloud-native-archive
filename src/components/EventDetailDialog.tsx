import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, MapPin, Clock, Share2, X, Instagram, MessageCircle, Copy } from 'lucide-react';
import { AppEvent, UNIT_BG_COLORS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AppEvent | null;
}

export function EventDetailDialog({ open, onOpenChange, event }: Props) {
  if (!event) return null;

  const eventUrl = `${window.location.origin}/eventos?slug=${event.slug || event.id}`;

  const shareOnWhatsApp = () => {
    const text = `Confira este evento: ${event.title}\n${eventUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    toast.success('Link copiado para a área de transferência!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none sm:rounded-2xl shadow-2xl">
        <div className="relative aspect-[21/9] md:aspect-[3/1] bg-slate-900 overflow-hidden">
          {(event.banner_image_desktop || event.banner_url_desktop || event.banner_url_mobile) ? (
            <img 
              src={event.banner_image_desktop || event.banner_url_desktop || event.banner_url_mobile} 
              alt={event.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center opacity-40"
              style={{ backgroundColor: event.custom_color || '#1e293b' }}
            >
              <CalendarDays className="h-20 w-20 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 md:p-10 -mt-12 relative z-10">
          <Badge className={`${UNIT_BG_COLORS[event.unit]} text-white border-none mb-4 shadow-lg text-sm px-4 py-1`}>
            {event.unit}
          </Badge>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              {event.use_logo_as_title && event.event_logo_url ? (
                <div className="mb-4 max-w-xs">
                  <img src={event.event_logo_url} alt={event.title} className="max-h-24 object-contain filter drop-shadow-md" />
                </div>
              ) : (
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                  {event.title}
                </h2>
              )}
              
              <div className="flex flex-wrap gap-6 text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Data</p>
                    <p className="font-medium">{format(new Date(event.start_datetime), "dd 'de' MMMM", { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Horário</p>
                    <p className="font-medium">
                      {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Local</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none pt-6 border-t border-slate-100">
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Nenhuma descrição detalhada disponível para este evento.'}
                </p>
              </div>
            </div>

            <div className="w-full md:w-72 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-auto py-3 gap-2 border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    onClick={shareOnWhatsApp}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-auto py-3 gap-2 border-slate-200 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Instagram</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="col-span-2 flex items-center justify-center gap-2 border-slate-200"
                    onClick={copyLink}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-xs">Copiar Link</span>
                  </Button>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Informação</p>
                <p className="text-sm text-slate-600">
                  Este evento é {event.visibility === 'publico' ? 'público e aberto a todos' : 'interno para colaboradores'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
