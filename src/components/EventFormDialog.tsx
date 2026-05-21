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
import { CheckCircle2, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { FileUpload } from './FileUpload';

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
});

export default function EventFormDialog({ open, onOpenChange, event }: Props) {
  const { addEvent, updateEvent, detectConflicts, setSelectedEvent } = useApp();
  const { userName, unit, isAdmin } = useUserRole();
  const [form, setForm] = useState<Partial<AppEvent>>(emptyEvent());
  const [conflicts, setConflicts] = useState<AppEvent[]>([]);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
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

  const handleSubmit = () => {
    if (!validate()) return;

    const fullEvent: AppEvent = {
      id: event?.id || crypto.randomUUID(),
      title: form.title!.trim(),
      description: form.description || '',
      unit: form.unit as Unit,
      event_type: form.event_type as EventType,
      start_datetime: new Date(form.start_datetime!).toISOString(),
      end_datetime: new Date(form.end_datetime!).toISOString(),
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
      custom_color: form.custom_color || SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
      show_in_banner: form.show_in_banner || false,
    };

    const found = detectConflicts(fullEvent);
    if (found.length > 0 && !showConflictAlert) {
      setConflicts(found);
      setShowConflictAlert(true);
      return;
    }

    fullEvent.has_conflict = found.length > 0;

    // Mark all conflicting events as well
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
    const fullEvent: AppEvent = {
      id: event?.id || crypto.randomUUID(),
      title: form.title!.trim(),
      description: form.description || '',
      unit: form.unit as Unit,
      event_type: form.event_type as EventType,
      start_datetime: new Date(form.start_datetime!).toISOString(),
      end_datetime: new Date(form.end_datetime!).toISOString(),
      location: form.location!.trim(),
      status: form.status as EventStatus,
      visibility: (form.visibility as 'publico' | 'interno') || 'interno',
      has_conflict: true,
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
      custom_color: form.custom_color || SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
      show_in_banner: form.show_in_banner || false,
    };

    // Mark all conflicting events as well
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Nova Programação'}</DialogTitle>
        </DialogHeader>

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
              <Label>Visibilidade</Label>
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 mt-1">
                <Switch
                  id="visibility"
                  checked={form.visibility === 'publico'}
                  onCheckedChange={v => setForm({ ...form, visibility: v ? 'publico' : 'interno' })}
                />
                <Label htmlFor="visibility" className="cursor-pointer flex-1">
                  {form.visibility === 'publico' ? 'Público (Visível para todos)' : 'Interno (Apenas para equipe)'}
                </Label>
              </div>
            </div>
            {form.visibility === 'publico' && (
              <div className={`space-y-4 rounded-lg border border-border p-3 bg-muted/20 ${!isAdmin ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banners para Página Pública</Label>
                  {!isAdmin && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Apenas Admin</Badge>}
                </div>
                
                <div className="flex items-center justify-between gap-3 p-2 bg-primary/5 rounded-md border border-primary/10">
                  <div className="flex flex-col">
                    <Label htmlFor="show_in_banner" className="text-sm font-medium">Exibir no Banner Superior</Label>
                    <p className="text-[10px] text-muted-foreground">Destacar este evento no carrossel da página pública.</p>
                  </div>
                  <Switch
                    id="show_in_banner"
                    checked={form.show_in_banner || false}
                    onCheckedChange={v => setForm({ ...form, show_in_banner: v })}
                    disabled={!isAdmin}
                  />
                </div>
                
                <FileUpload 

                  label="Capa Desktop/Tablet (16:9)"
                  mode="single"
                  url={form.banner_url_desktop}
                  onChange={(url) => setForm({ ...form, banner_url_desktop: url })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">HD, FHD ou UHD recomendado.</p>

                <FileUpload 
                  label="Capa Mobile (4:3)"
                  mode="single"
                  url={form.banner_url_mobile}
                  onChange={(url) => setForm({ ...form, banner_url_mobile: url })}
                />
                <p className="text-[10px] text-muted-foreground mt-1">1080x1440 recomendado.</p>

                <div className="pt-2">
                  <Label className="text-xs mb-2 block">Cor do Card (caso não tenha capa)</Label>
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
              <Label htmlFor="marketing_request" className="cursor-pointer flex-1">Solicitação de Marketing</Label>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
               <Switch
                id="partner_involved"
                checked={form.partner_involved || false}
                onCheckedChange={v => setForm({ ...form, partner_involved: v, ...(!v ? { partner_type: '', partner_name: '', partners: [] } : {}) })}
              />
              <Label htmlFor="partner_involved" className="cursor-pointer flex-1">Parceiro Envolvido</Label>
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
            {/* Unit collaboration */}
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
               <Switch
                id="unit_collaboration"
                checked={form.has_unit_collaboration || false}
                onCheckedChange={v => setForm({ ...form, has_unit_collaboration: v, ...(!v ? { collaborating_units: [], external_collaborators: [] } : {}) })}
              />
              <Label htmlFor="unit_collaboration" className="cursor-pointer flex-1">Parceria com outra Unidade/Instituição</Label>
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
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={ext}
                          onChange={e => {
                            const updated = [...(form.external_collaborators || [])];
                            updated[idx] = e.target.value;
                            setForm({ ...form, external_collaborators: updated });
                          }}
                          placeholder="Nome da instituição"
                          className="flex-1"
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
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setForm({ ...form, external_collaborators: [...(form.external_collaborators || []), ''] })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Instituição
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-t border-border pt-4">
              <FileUpload 
                attachments={form.attachments || []} 
                onChange={(urls) => setForm({ ...form, attachments: urls })} 
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
