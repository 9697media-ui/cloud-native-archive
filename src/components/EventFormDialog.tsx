import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AppEvent, UNITS, EVENT_TYPES, EVENT_STATUSES, PARTNER_TYPES, Unit, EventType, EventStatus, PartnerType, SYSTEM_COLORS } from '@/types';
import { getStatusDotClass } from '@/lib/statusColors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, X, Globe, Eye, Layout, CalendarDays, Lock, Share2, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from './FileUpload';
import { EventDetailDialog } from './EventDetailDialog';
import { BannerMissingDialog } from './BannerMissingDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AppEvent | null;
}

const emptyEvent = (): Partial<AppEvent> => ({
  title: '',
  description: '',
  unit: 'DIC',
  event_type: 'reunião',
  start_datetime: '',
  end_datetime: '',
  location: '',
  status: 'pendente',
  visibility: 'interno',
  notes: '',
  marketing_request: false,
  partner_involved: false,
  partner_type: '',
  partner_name: '',
  partners: [],
  has_unit_collaboration: false,
  collaborating_units: [],
  external_collaborators: [],
  attachments: [],
  banner_url_desktop: '',
  banner_url_mobile: '',
  banner_image_desktop: '',
  banner_image_mobile: '',
  custom_color: SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
  show_in_banner: false,
  slug: '',
  use_logo_as_title: false,
  event_logo_url: '',
  show_banner_fade: true,
});

export default function EventFormDialog({ open, onOpenChange, event }: Props) {
  const { addEvent, updateEvent, detectConflicts, setSelectedEvent } = useApp();
  const { userName, unit, isAdmin } = useUserRole();
  const [form, setForm] = useState<Partial<AppEvent>>(emptyEvent());
  const [conflicts, setConflicts] = useState<AppEvent[]>([]);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [showBannerWarning, setShowBannerWarning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      const formatDate = (dateStr: string) => {
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().slice(0, 16);
        } catch (e) {
          return '';
        }
      };

      setForm({
        ...event,
        start_datetime: formatDate(event.start_datetime),
        end_datetime: formatDate(event.end_datetime),
      });
    } else {
      setForm({ ...emptyEvent(), unit: (unit as Unit) || 'DIC' });
    }
    setConflicts([]);
    setShowConflictAlert(false);
    setShowBannerWarning(false);
    setErrors({});
  }, [event, open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title?.trim()) errs.title = 'Título obrigatório';
    if (!form.start_datetime) errs.start_datetime = 'Data/hora início obrigatória';
    if (!form.end_datetime) errs.end_datetime = 'Data/hora término obrigatória';
    if (!form.location?.trim()) errs.location = 'Localização obrigatória';
    if (form.start_datetime && form.end_datetime && new Date(form.start_datetime) >= new Date(form.end_datetime)) {
      errs.end_datetime = 'Término deve ser após o início';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getFullEvent = (): AppEvent => {
    return {
      id: event?.id || crypto.randomUUID(),
      title: form.title!.trim(),
      description: form.description || '',
      unit: form.unit as Unit,
      event_type: form.event_type as EventType,
      start_datetime: form.start_datetime ? new Date(form.start_datetime).toISOString() : new Date().toISOString(),
      end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : new Date().toISOString(),
      location: form.location!.trim(),
      status: form.status as EventStatus,
      visibility: (form.visibility as 'publico' | 'interno') || 'interno',
      has_conflict: false,
      created_by: event?.created_by || userName || 'Usuário',
      updated_by: isEditing ? (userName || 'Usuário') : undefined,
      created_at: event?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: form.notes || '',
      marketing_request: form.marketing_request || false,
      partner_involved: form.partner_involved || false,
      partner_type: (form.partner_type as PartnerType) || '',
      partner_name: form.partner_name || '',
      partners: form.partners || [],
      has_unit_collaboration: form.has_unit_collaboration || false,
      collaborating_units: form.collaborating_units || [],
      external_collaborators: form.external_collaborators || [],
      attachments: form.attachments || [],
      banner_url_desktop: form.banner_url_desktop || '',
      banner_url_mobile: form.banner_url_mobile || '',
      banner_image_desktop: form.banner_image_desktop || '',
      banner_image_mobile: form.banner_image_mobile || '',
      custom_color: form.custom_color || SYSTEM_COLORS[0],
      show_in_banner: form.show_in_banner || false,
      slug: form.slug || '',
      use_logo_as_title: form.use_logo_as_title || false,
      event_logo_url: form.event_logo_url || '',
      show_banner_fade: form.show_banner_fade !== undefined ? form.show_banner_fade : true,
    };
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const fullEvent = getFullEvent();

    // Check if banner is enabled but image is missing
    if (fullEvent.show_in_banner && !fullEvent.banner_image_desktop && !showBannerWarning) {
      setShowBannerWarning(true);
      return;
    }

    const found = detectConflicts(fullEvent);
    if (found.length > 0 && !showConflictAlert) {
      setConflicts(found);
      setShowConflictAlert(true);
      return;
    }

    fullEvent.has_conflict = found.length > 0;

    found.forEach(c => {
      if (!c.has_conflict) {
        updateEvent({ ...c, has_conflict: true, updated_at: new Date().toISOString() });
      }
    });

    if (isEditing) {
      updateEvent(fullEvent);
    } else {
      addEvent(fullEvent);
    }
    setSelectedEvent(null);
    onOpenChange(false);
  };

  const handleForceSubmit = () => {
    const fullEvent = getFullEvent();
    fullEvent.has_conflict = true;

    conflicts.forEach(c => {
      if (!c.has_conflict) {
        updateEvent({ ...c, has_conflict: true, updated_at: new Date().toISOString() });
      }
    });

    if (isEditing) {
      updateEvent(fullEvent);
    } else {
      addEvent(fullEvent);
    }
    setSelectedEvent(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[95vh] overflow-y-auto ${isAdmin ? 'sm:max-w-[95vw] lg:max-w-[90vw]' : 'sm:max-w-lg'}`}>
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>{isEditing ? 'Editar Evento' : 'Nova Programação'}</DialogTitle>
            {isAdmin && (
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 flex items-center gap-1.5 px-3 py-1">
                <Layout className="h-3.5 w-3.5" /> Modo Split (Admin)
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className={`grid gap-8 ${isAdmin ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <div className="space-y-6">
            {showConflictAlert ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <p className="font-semibold text-foreground">Conflito de horário detectado!</p>
                    <p className="text-sm text-muted-foreground">Este evento conflita com {conflicts.length} evento(s):</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {conflicts.map(c => (
                    <div key={c.id} className="rounded-lg border border-border p-3">
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.unit} · {new Date(c.start_datetime).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowConflictAlert(false)}>Voltar e Corrigir</Button>
                  <Button onClick={handleForceSubmit}>Salvar Mesmo Assim</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nome do evento" />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do evento" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Unidade *</Label>
                    <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v as Unit })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v as EventType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início *</Label>
                    <Input type="datetime-local" value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} />
                    {errors.start_datetime && <p className="mt-1 text-xs text-destructive">{errors.start_datetime}</p>}
                  </div>
                  <div>
                    <Label>Término *</Label>
                    <Input type="datetime-local" value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} />
                    {errors.end_datetime && <p className="mt-1 text-xs text-destructive">{errors.end_datetime}</p>}
                  </div>
                </div>
                <div>
                  <Label>Localização *</Label>
                  <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Local do evento" />
                  {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
                </div>

                {isAdmin && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Configurações de Compartilhamento (Publico)
                    </Label>
                    <div>
                      <Label htmlFor="slug" className="text-xs">Link Personalizado (Slug)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">anabrasil.com/eventos/</span>
                        <Input 
                          id="slug"
                          value={form.slug} 
                          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
                          placeholder="meu-evento-especial"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Deixe em branco para usar o ID padrão.</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as EventStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">
                          <span className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(s)}`} />
                            {s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-sm font-semibold">Onde este evento deve aparecer?</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">Eventos públicos ficam visíveis para visitantes sem login em anabrasil.com/eventos. Eventos internos aparecem apenas para a equipe no calendário restrito.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, visibility: 'interno' })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        form.visibility === 'interno' 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      <Lock className={`h-6 w-6 mb-2 ${form.visibility === 'interno' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-bold">Privado / Interno</span>
                      <span className="text-[10px] opacity-70">Apenas para equipe</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, visibility: 'publico' })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        form.visibility === 'publico' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      <Globe className={`h-6 w-6 mb-2 ${form.visibility === 'publico' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-bold">Público / Site</span>
                      <span className="text-[10px] opacity-70">Visível para todos</span>
                    </button>
                  </div>
                </div>

                {form.visibility === 'publico' && (
                  <div className={`space-y-6 rounded-2xl border-2 border-blue-200 p-5 bg-blue-50/30 ${!isAdmin ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
                    <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-blue-600" />
                        <Label className="text-sm font-bold text-blue-800 uppercase tracking-wider">Checklist de Publicação</Label>
                      </div>
                      {!isAdmin && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Apenas Admin</Badge>}
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 p-2 bg-primary/5 rounded-md border border-primary/10">
                      <div className="flex flex-col">
                        <Label htmlFor="show_in_banner" className="text-sm font-medium">Exibir no Banner Superior</Label>
                        <p className="text-[10px] text-muted-foreground">Destacar no carrossel da página pública.</p>
                      </div>
                      <Switch
                        id="show_in_banner"
                        checked={form.show_in_banner || false}
                        onCheckedChange={v => setForm({ ...form, show_in_banner: v })}
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2 bg-slate-100 rounded-md border border-slate-200">
                      <div className="flex flex-col">
                        <Label htmlFor="use_logo_as_title" className="text-sm font-medium">Usar Logo como Título</Label>
                        <p className="text-[10px] text-muted-foreground">Estilo streaming: substitui o texto por uma imagem da logo.</p>
                      </div>
                      <Switch
                        id="use_logo_as_title"
                        checked={form.use_logo_as_title || false}
                        onCheckedChange={v => setForm({ ...form, use_logo_as_title: v })}
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2 bg-slate-100 rounded-md border border-slate-200">
                      <div className="flex flex-col">
                        <Label htmlFor="show_banner_fade" className="text-sm font-medium">Efeito de Sombreamento (Fade)</Label>
                        <p className="text-[10px] text-muted-foreground">Adiciona um degradê na base do banner para melhorar a leitura.</p>
                      </div>
                      <Switch
                        id="show_banner_fade"
                        checked={form.show_banner_fade !== undefined ? form.show_banner_fade : true}
                        onCheckedChange={v => setForm({ ...form, show_banner_fade: v })}
                        disabled={!isAdmin}
                      />
                    </div>

                    {form.use_logo_as_title && (
                      <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300">
                        <FileUpload 
                          label="Logo/ID Visual do Evento"
                          mode="single"
                          url={form.event_logo_url}
                          onChange={(url) => setForm({ ...form, event_logo_url: url })}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 italic text-center">Recomendado: PNG com fundo transparente.</p>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FileUpload 
                            label="Capa Desktop (16:9)"
                            mode="single"
                            url={form.banner_url_desktop}
                            onChange={(url) => setForm({ ...form, banner_url_desktop: url })}
                          />
                        </div>
                        <div>
                          <FileUpload 
                            label="Capa Mobile (4:3)"
                            mode="single"
                            url={form.banner_url_mobile}
                            onChange={(url) => setForm({ ...form, banner_url_mobile: url })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <FileUpload 
                            label="Banner Desktop (21:9)"
                            mode="single"
                            url={form.banner_image_desktop}
                            onChange={(url) => setForm({ ...form, banner_image_desktop: url })}
                          />
                        </div>
                        <div>
                          <FileUpload 
                            label="Banner Mobile (9:16)"
                            mode="single"
                            url={form.banner_image_mobile}
                            onChange={(url) => setForm({ ...form, banner_image_mobile: url })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Label className="text-xs mb-2 block">Cor do Card</Label>
                      <div className="flex flex-wrap gap-2">
                        {SYSTEM_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`h-6 w-6 rounded-full border border-white/20 transition-transform ${form.custom_color === color ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setForm({ ...form, custom_color: color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Observações internas</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas..." rows={2} />
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                   <Switch
                    id="marketing_request"
                    checked={form.marketing_request || false}
                    onCheckedChange={v => setForm({ ...form, marketing_request: v })}
                  />
                  <Label htmlFor="marketing_request" className="cursor-pointer flex-1 text-sm">Solicitação de Marketing</Label>
                </div>
              </div>
            )}
            
            {!showConflictAlert && (
              <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>{isEditing ? 'Salvar Alterações' : 'Criar Programação'}</Button>
              </DialogFooter>
            )}
          </div>

          {/* LADO DIREITO: PREVIEW (Admin Only) */}
          {isAdmin && (
            <div className="hidden lg:block border-l pl-8 space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview Público</Label>
              <div className="rounded-2xl border bg-slate-50 overflow-hidden shadow-inner h-full">
                <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    anabrasil.com/eventos/{form.slug || 'preview'}
                  </div>
                </div>
                    <div className="p-0 overflow-y-auto max-h-[75vh]">
                      {/* Inline version of Detail Dialog */}
                      <div className="bg-white">
                        <div className={`relative ${(!form.banner_image_desktop && !form.banner_url_desktop && !form.banner_url_mobile) ? 'aspect-[21/12]' : 'aspect-[21/9]'} bg-slate-900 overflow-hidden`}>
                          {form.show_banner_fade !== false && (
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          )}
                          {(form.banner_image_desktop || form.banner_url_desktop || form.banner_url_mobile) ? (
                            <img 
                              src={form.banner_image_desktop || form.banner_url_desktop || form.banner_url_mobile} 
                              alt="Preview"
                              className="w-full h-full object-cover opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-start p-6" style={{ backgroundColor: form.custom_color || '#1e293b' }}>
                              <Layout className="h-10 w-10 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className={`p-6 ${(!form.banner_image_desktop && !form.banner_url_desktop && !form.banner_url_mobile) ? 'mt-0' : '-mt-8'} relative z-10`}>
                          <Badge className="bg-primary text-white mb-2 text-[10px]">{form.unit}</Badge>
                          
                          <h3 className={`font-bold mb-2 line-clamp-2 ${(!form.banner_image_desktop && !form.banner_url_desktop && !form.banner_url_mobile) ? 'text-2xl text-white drop-shadow-md' : 'text-xl'}`}>
                            {form.title || 'Título do Evento'}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                            <CalendarDays className="h-3 w-3" />
                            <span>{form.start_datetime ? new Date(form.start_datetime).toLocaleDateString() : 'Data'}</span>
                          </div>
                      <div className="prose prose-sm max-w-none border-t pt-4">
                        <p className="text-xs text-slate-500 whitespace-pre-wrap">{form.description || 'Sem descrição.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <BannerMissingDialog 
        open={showBannerWarning}
        onOpenChange={setShowBannerWarning}
        onConfirm={() => {
          setShowBannerWarning(false);
          // Small delay to ensure state update before submit
          setTimeout(() => {
            const fullEvent = getFullEvent();
            const found = detectConflicts(fullEvent);
            if (found.length > 0 && !showConflictAlert) {
              setConflicts(found);
              setShowConflictAlert(true);
              return;
            }
            if (isEditing) updateEvent(fullEvent); else addEvent(fullEvent);
            setSelectedEvent(null);
            onOpenChange(false);
          }, 10);
        }}
        onAddImage={() => setShowBannerWarning(false)}
      />
    </Dialog>
  );
}
