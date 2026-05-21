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
import { CheckCircle2, Plus, X, Globe, Eye, Layout, CalendarDays, Lock, Share2, Info, EyeOff } from 'lucide-react';
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
  full_height_title: false,
  banner_display_time: 5,
  show_banner_overlay: true,
  target_audience: '',
  support_team: '',
  food_logistics: '',
  marketing_info: '',
  printed_materials: '',
  equipment_needed: '',
  marketing_items: [],
  marketing_coverage: false,
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
    
    // Novos campos obrigatórios
    if (!form.target_audience?.trim()) errs.target_audience = 'Selecione o público-alvo';
    if (!form.support_team?.trim()) errs.support_team = 'Informe a equipe de apoio';
    if (!form.food_logistics?.trim()) errs.food_logistics = 'Informe a logística de alimentação';
    if (!form.equipment_needed?.trim()) errs.equipment_needed = 'Informe os equipamentos necessários';
    
    // Condicional para marketing
    if (form.marketing_request) {
      const hasCoverage = form.marketing_coverage;
      const hasGraphics = (form.marketing_items || []).some(i => i.type === 'demanda_grafica');
      
      if (!hasCoverage && !hasGraphics) {
        errs.marketing_items = 'Selecione ao menos um tipo de solicitação (Cobertura ou Demanda Gráfica)';
      } else if (hasGraphics && (form.marketing_items || []).filter(i => i.type === 'demanda_grafica').some(item => !item.item.trim())) {
        errs.marketing_items = 'Preencha todos os campos das demandas gráficas';
      }
    }

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
      full_height_title: form.full_height_title || false,
      banner_display_time: form.banner_display_time || 5,
      show_banner_overlay: form.show_banner_overlay !== undefined ? form.show_banner_overlay : true,
      target_audience: form.target_audience || '',
      support_team: form.support_team || '',
      food_logistics: form.food_logistics || '',
      marketing_info: form.marketing_info || '',
      printed_materials: form.printed_materials || '',
      equipment_needed: form.equipment_needed || '',
      marketing_items: form.marketing_items || [],
      marketing_coverage: form.marketing_coverage || false,
    };
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const fullEvent = getFullEvent();

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
                  <Label className="text-sm font-semibold mb-1.5 block">Título *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nome do evento" />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do evento" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Unidade *</Label>
                    <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v as Unit })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Tipo *</Label>
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
                    <Label className="text-sm font-semibold mb-1.5 block">Início *</Label>
                    <Input type="datetime-local" value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} />
                    {errors.start_datetime && <p className="mt-1 text-xs text-destructive">{errors.start_datetime}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Término *</Label>
                    <Input type="datetime-local" value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} />
                    {errors.end_datetime && <p className="mt-1 text-xs text-destructive">{errors.end_datetime}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Localização *</Label>
                  <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Local do evento" />
                  {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
                </div>

                {isAdmin && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Globe className="h-4 w-4" /> Configurações de Compartilhamento (Público)
                    </Label>
                    <div>
                      <Label htmlFor="slug" className="text-xs font-medium mb-1 block">Link personalizado (Slug)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">anabrasil.com/eventos/</span>
                        <Input 
                          id="slug"
                          value={form.slug} 
                          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} 
                          placeholder="meu-evento-especial"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">Deixe em branco para usar o ID padrão.</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Status</Label>
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
                  {form.status === 'concluido' && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      Este evento será mantido no histórico como concluído.
                    </p>
                  )}
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
                        <Label htmlFor="show_banner_overlay" className="text-sm font-medium">Cortina de Opacidade</Label>
                        <p className="text-[10px] text-muted-foreground">Escurece levemente a imagem para destacar o texto.</p>
                      </div>
                      <Switch
                        id="show_banner_overlay"
                        checked={form.show_banner_overlay !== undefined ? form.show_banner_overlay : true}
                        onCheckedChange={v => setForm({ ...form, show_banner_overlay: v })}
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

                    <div className="flex items-center justify-between gap-3 p-2 bg-slate-100 rounded-md border border-slate-200">
                      <div className="flex flex-col">
                        <Label htmlFor="full_height_title" className="text-sm font-medium">Ocupar Toda a Altura</Label>
                        <p className="text-[10px] text-muted-foreground">O título ou logo cresce para preencher o banner (estilo cinema).</p>
                      </div>
                      <Switch
                        id="full_height_title"
                        checked={form.full_height_title || false}
                        onCheckedChange={v => setForm({ ...form, full_height_title: v })}
                        disabled={!isAdmin}
                      />
                    </div>

                    <div className="flex flex-col gap-2 p-2 bg-slate-100 rounded-md border border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="banner_display_time" className="text-sm font-medium">Tempo de Exibição</Label>
                        <Badge variant="secondary" className="text-[10px] font-mono">{form.banner_display_time || 5}s</Badge>
                      </div>
                      <input 
                        type="range"
                        id="banner_display_time"
                        min="3"
                        max="30"
                        step="1"
                        value={form.banner_display_time || 5}
                        onChange={(e) => setForm({ ...form, banner_display_time: parseInt(e.target.value) })}
                        disabled={!isAdmin}
                        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-primary"
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
                
                <div className="space-y-6 pt-4 border-t">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layout className="h-4 w-4" /> Detalhes Logísticos e Público-Alvo
                  </Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Público-alvo *</Label>
                      <div className="space-y-2">
                        {[
                          "Os funcionários",
                          "Os atendidos",
                          "Os atendidos e suas famílias",
                          "Será aberto para a comunidade"
                        ].map((option) => (
                          <div key={option} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm">
                            <Label htmlFor={`target-${option}`} className="text-sm cursor-pointer flex-1 font-medium">{option}</Label>
                            <Switch
                              id={`target-${option}`}
                              checked={form.target_audience === option}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setForm({ ...form, target_audience: option });
                                } else if (form.target_audience === option) {
                                  setForm({ ...form, target_audience: "" });
                                }
                              }}
                            />
                          </div>
                        ))}
                        <div className="space-y-2 p-3 rounded-lg border border-border bg-card shadow-sm">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="target-other-switch" className="text-sm cursor-pointer flex-1 font-medium">Outro público</Label>
                            <Switch
                              id="target-other-switch"
                              checked={!!form.target_audience && !["Os funcionários", "Os atendidos", "Os atendidos e suas famílias", "Será aberto para a comunidade"].includes(form.target_audience)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setForm({ ...form, target_audience: "Outro: " });
                                } else {
                                  setForm({ ...form, target_audience: "" });
                                }
                              }}
                            />
                          </div>
                          {(form.target_audience?.startsWith("Outro: ") || (form.target_audience !== "" && !["Os funcionários", "Os atendidos", "Os atendidos e suas famílias", "Será aberto para a comunidade"].includes(form.target_audience || ""))) && (
                            <Input 
                              className="h-9 mt-2"
                              value={form.target_audience?.replace("Outro: ", "")}
                              onChange={e => setForm({ ...form, target_audience: `Outro: ${e.target.value}` })}
                              placeholder="Especifique o público..."
                            />
                          )}
                        </div>
                      </div>
                      {errors.target_audience && <p className="mt-1 text-xs text-destructive">{errors.target_audience}</p>}
                    </div>

                    <div className="pt-2">
                      <Label className="text-sm font-semibold mb-2 block">Equipe de apoio (Auxílio) *</Label>
                      <div className="space-y-2">
                        {["Funcionários", "Voluntários"].map((option) => (
                          <div key={option} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm">
                            <Label htmlFor={`support-${option}`} className="text-sm cursor-pointer flex-1 font-medium">{option}</Label>
                            <Switch
                              id={`support-${option}`}
                              checked={form.support_team?.includes(option)}
                              onCheckedChange={(checked) => {
                                const current = form.support_team ? form.support_team.split(", ") : [];
                                let next;
                                if (checked) {
                                  next = [...current, option];
                                } else {
                                  next = current.filter(c => c !== option);
                                }
                                setForm({ ...form, support_team: next.join(", ") });
                              }}
                            />
                          </div>
                        ))}
                        <div className="space-y-2 p-3 rounded-lg border border-border bg-card shadow-sm">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="support-other-switch" className="text-sm cursor-pointer flex-1 font-medium">Outra equipe</Label>
                            <Switch
                              id="support-other-switch"
                              checked={!!form.support_team && !form.support_team.split(", ").every(val => ["Funcionários", "Voluntários"].includes(val))}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  const next = (form.support_team?.split(", ") || []).filter(val => ["Funcionários", "Voluntários"].includes(val));
                                  setForm({ ...form, support_team: next.join(", ") });
                                } else {
                                  // No action needed here, user will type in input
                                }
                              }}
                            />
                          </div>
                          {(!!form.support_team && !form.support_team.split(", ").every(val => ["Funcionários", "Voluntários"].includes(val))) && (
                            <Input 
                              className="h-9 mt-2"
                              value={(form.support_team?.split(", ") || []).filter(val => !["Funcionários", "Voluntários"].includes(val)).join(", ")}
                              onChange={e => {
                                const base = (form.support_team?.split(", ") || []).filter(val => ["Funcionários", "Voluntários"].includes(val));
                                if (e.target.value.trim()) {
                                  setForm({ ...form, support_team: [...base, e.target.value].join(", ") });
                                } else {
                                  setForm({ ...form, support_team: base.join(", ") });
                                }
                              }}
                              placeholder="Especifique a equipe..."
                            />
                          )}
                        </div>
                      </div>
                      {errors.support_team && <p className="mt-1 text-xs text-destructive">{errors.support_team}</p>}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-1.5 block">Logística de alimentação *</Label>
                      <Textarea 
                        value={form.food_logistics} 
                        onChange={e => setForm({ ...form, food_logistics: e.target.value })} 
                        placeholder="Ex: Almoço para 30 pessoas, coffee break às 10h..." 
                        rows={2} 
                        className={errors.food_logistics ? "border-destructive" : ""}
                      />
                      {errors.food_logistics && <p className="mt-1 text-xs text-destructive">{errors.food_logistics}</p>}
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-1.5 block">Equipamentos necessários *</Label>
                      <Input 
                        value={form.equipment_needed} 
                        onChange={e => setForm({ ...form, equipment_needed: e.target.value })} 
                        placeholder="Ex: Som, Microfone, Projetor..." 
                        className={errors.equipment_needed ? "border-destructive" : ""}
                      />
                      {errors.equipment_needed && <p className="mt-1 text-xs text-destructive">{errors.equipment_needed}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-sm font-semibold mb-1.5 block">Observações internas</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas gerais..." rows={2} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Switch
                      id="marketing_request"
                      checked={form.marketing_request || false}
                      onCheckedChange={v => setForm({ ...form, marketing_request: v })}
                    />
                    <Label htmlFor="marketing_request" className="cursor-pointer flex-1 text-sm font-semibold">Solicitação de Marketing</Label>
                  </div>

                  {form.marketing_request && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-blue-900">Itens de marketing *</Label>
                        <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 uppercase font-bold tracking-tight">Briefing / Materiais</Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                            <Switch
                              id="marketing_cobertura"
                              checked={form.marketing_coverage || false}
                              onCheckedChange={v => setForm({ ...form, marketing_coverage: v })}
                            />
                            <Label htmlFor="marketing_cobertura" className="cursor-pointer flex-1 text-sm font-medium text-blue-900">Solicitar Cobertura do Evento</Label>
                          </div>
                          
                          {form.marketing_coverage && (
                            <div className="px-3 py-2 bg-blue-50/50 rounded-md border border-dashed border-blue-200 animate-in fade-in zoom-in-95 duration-200">
                              <p className="text-[11px] text-blue-600 flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="h-3 w-3" /> Cobertura fotográfica e/ou vídeo solicitada
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                            <Switch
                              id="marketing_grafica"
                              checked={(form.marketing_items || []).some(i => i.type === 'demanda_grafica')}
                              onCheckedChange={v => {
                                const current = form.marketing_items || [];
                                if (v) {
                                  setForm({ ...form, marketing_items: [...current, { type: 'demanda_grafica', item: '', description: '' }] });
                                } else {
                                  setForm({ ...form, marketing_items: current.filter(i => i.type !== 'demanda_grafica') });
                                }
                              }}
                            />
                            <Label htmlFor="marketing_grafica" className="cursor-pointer flex-1 text-sm font-medium text-blue-900">Demanda Gráfica (Arte/Impressão)</Label>
                          </div>

                          {(form.marketing_items || []).filter(i => i.type === 'demanda_grafica').map((item, idx) => {
                            const originalIdx = (form.marketing_items || []).findIndex(mi => mi === item);
                            return (
                              <div key={`grafica-${idx}`} className="space-y-2 p-3 bg-white rounded-md border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-2">
                                  <Input 
                                    value={item.item} 
                                    onChange={e => {
                                      const updated = [...(form.marketing_items || [])];
                                      updated[originalIdx] = { ...updated[originalIdx], item: e.target.value };
                                      setForm({ ...form, marketing_items: updated });
                                    }} 
                                    placeholder="Ex: Card Instagram, Banner..." 
                                    className="flex-1 bg-white border-blue-200 focus-visible:ring-blue-500 h-8 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      const updated = (form.marketing_items || []).filter((_, i) => i !== originalIdx);
                                      setForm({ ...form, marketing_items: updated });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Textarea 
                                  value={item.description} 
                                  onChange={e => {
                                    const updated = [...(form.marketing_items || [])];
                                    updated[originalIdx] = { ...updated[originalIdx], description: e.target.value };
                                    setForm({ ...form, marketing_items: updated });
                                  }} 
                                  placeholder="Detalhes: formato, arte, impressão..." 
                                  rows={2}
                                  className="bg-slate-50 border-blue-100 focus-visible:ring-blue-500 text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-7 text-[10px] text-blue-600 hover:bg-blue-50 gap-1"
                                  onClick={() => setForm({ 
                                    ...form, 
                                    marketing_items: [...(form.marketing_items || []), { type: 'demanda_grafica', item: '', description: '' }] 
                                  })}
                                >
                                  <Plus className="h-3 w-3" /> Adicionar mais um item gráfico
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        {errors.marketing_items && <p className="mt-1 text-xs text-destructive">{errors.marketing_items}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    id="partner_involved"
                    checked={form.partner_involved || false}
                    onCheckedChange={v => setForm({ ...form, partner_involved: v, ...(!v ? { partner_type: '', partner_name: '', partners: [] } : {}) })}
                  />
                  <Label htmlFor="partner_involved" className="cursor-pointer flex-1 text-sm font-semibold">Parceiro envolvido</Label>
                </div>

                {form.partner_involved && (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <Label className="text-sm font-medium">Parceiros</Label>
                    {(form.partners || []).map((partner, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={partner.type || ''}
                          onValueChange={v => {
                            const updated = [...(form.partners || [])];
                            updated[idx] = { ...updated[idx], type: v as PartnerType };
                            setForm({ ...form, partners: updated });
                          }}
                        >
                          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                          <SelectContent>
                            {PARTNER_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          value={partner.name}
                          onChange={e => {
                            const updated = [...(form.partners || [])];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setForm({ ...form, partners: updated });
                          }}
                          placeholder="Nome do parceiro"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => {
                            const updated = (form.partners || []).filter((_, i) => i !== idx);
                            setForm({ ...form, partners: updated });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setForm({ ...form, partners: [...(form.partners || []), { type: '' as PartnerType, name: '' }] })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Parceiro
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Switch
                    id="unit_collaboration"
                    checked={form.has_unit_collaboration || false}
                    onCheckedChange={v => setForm({ ...form, has_unit_collaboration: v, ...(!v ? { collaborating_units: [], external_collaborators: [] } : {}) })}
                  />
                  <Label htmlFor="unit_collaboration" className="cursor-pointer flex-1 text-sm">Parceria com outra Unidade/Instituição</Label>
                </div>

                {form.has_unit_collaboration && (
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <div>
                      <Label className="text-sm font-medium">Unidades Parceiras</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {UNITS.filter(u => u !== form.unit).map(u => (
                          <label key={u} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <Checkbox
                              checked={(form.collaborating_units || []).includes(u)}
                              onCheckedChange={(checked) => {
                                const current = form.collaborating_units || [];
                                setForm({
                                  ...form,
                                  collaborating_units: checked
                                    ? [...current, u]
                                    : current.filter(cu => cu !== u),
                                });
                              }}
                            />
                            {u}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Instituições Externas</Label>
                      <div className="space-y-2 mt-2">
                        {(form.external_collaborators || []).map((ext, idx) => (
                          <div key={idx} className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                            <div className="flex items-center gap-2">
                              <Input
                                value={typeof ext === 'string' ? ext : (ext as any).name}
                                onChange={e => {
                                  const updated = [...(form.external_collaborators || [])];
                                  if (typeof ext === 'string') {
                                    updated[idx] = { name: e.target.value, details: '' };
                                  } else {
                                    updated[idx] = { ...(ext as any), name: e.target.value };
                                  }
                                  setForm({ ...form, external_collaborators: updated });
                                }}
                                placeholder="Nome da instituição"
                                className="flex-1 h-8 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8"
                                onClick={() => {
                                  const updated = (form.external_collaborators || []).filter((_, i) => i !== idx);
                                  setForm({ ...form, external_collaborators: updated });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              value={typeof ext === 'string' ? '' : (ext as any).details}
                              onChange={e => {
                                const updated = [...(form.external_collaborators || [])];
                                if (typeof ext === 'string') {
                                  updated[idx] = { name: ext, details: e.target.value };
                                } else {
                                  updated[idx] = { ...(ext as any), details: e.target.value };
                                }
                                setForm({ ...form, external_collaborators: updated });
                              }}
                              placeholder="Tipo de parceria / Detalhes..."
                              className="h-8 text-xs bg-white/50"
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full gap-1 border-dashed"
                          onClick={() => setForm({ 
                            ...form, 
                            external_collaborators: [...(form.external_collaborators || []), { name: '', details: '' }] 
                          })}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar Instituição
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border p-3">
                  <Label className="text-sm font-medium mb-2 block">Anexos</Label>
                  <FileUpload
                    mode="multiple"
                    attachments={form.attachments || []}
                    onChange={(urls) => setForm({ ...form, attachments: urls as string[] })}
                  />
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview Público (Banner)</Label>
                <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50">Exclusivo Banner</Badge>
              </div>
              <div className="rounded-2xl border bg-slate-50 overflow-hidden shadow-inner h-full flex flex-col">
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
                <div className="p-0 overflow-y-auto max-h-[75vh] flex-1">
                  <div className="bg-white h-full">
                    {/* Visualização de Slide do Banner */}
                    <div className={`relative ${(!form.banner_image_desktop && !form.banner_url_desktop && !form.banner_url_mobile) ? 'aspect-[21/12]' : 'aspect-[21/9]'} bg-slate-900 overflow-hidden`}>
                      {form.show_banner_overlay !== false && (
                        <div className="absolute inset-0 z-[5] bg-slate-950/40" />
                      )}
                      
                      {form.show_banner_fade !== false && (
                        <div className="absolute inset-0 z-[10] bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
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

                      <div className="absolute bottom-0 left-0 right-0 p-4 z-[20] flex flex-col items-start justify-end h-full">
                        <Badge className="bg-primary/80 text-white mb-2 text-[10px] border-none backdrop-blur-sm shrink-0">{form.unit || 'UNIDADE'}</Badge>
                        
                        {form.use_logo_as_title && form.event_logo_url ? (
                          <div className={`flex items-center justify-start ${form.full_height_title ? 'h-1/2 w-full mb-2' : 'h-12 w-full mb-1'}`}>
                            <img 
                              src={form.event_logo_url} 
                              alt="Logo Preview" 
                              className={`object-contain object-left h-full max-w-full filter drop-shadow-md`} 
                            />
                          </div>
                        ) : (
                          <h3 
                            className={`font-bold text-white drop-shadow-xl line-clamp-3 ${form.full_height_title ? 'text-3xl md:text-5xl' : 'text-xl'}`}
                            dangerouslySetInnerHTML={{ 
                              __html: (form.title || 'Título do Evento').replace(/<br\s*\/?>/gi, '<br/>') 
                            }}
                          />
                        )}
                        
                        <div className="flex items-center gap-2 text-[10px] text-white/80 mt-2">
                          <CalendarDays className="h-3 w-3" />
                          <span>{form.start_datetime ? new Date(form.start_datetime).toLocaleDateString('pt-BR') : 'Data'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t bg-slate-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Detalhes do Evento (Card/Modal)</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{form.title || 'Título do Evento'}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{form.description || 'Sem descrição.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

    </Dialog>
  );
}
