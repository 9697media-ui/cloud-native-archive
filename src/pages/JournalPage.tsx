import { useMemo, useState } from 'react';
import { Plus, Copy, Trash2, Pencil, Lock, Loader2, Newspaper } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { useJournals } from '@/hooks/useJournals';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { NEWS_UNIT_GROUPS, newsUnitName, profileUnitForNewsUnit } from '@/lib/news/units';
import { createJournalPages } from '@/lib/journal/templates';
import { STATUS_LABELS, type JournalRecord } from '@/lib/journal/types';

const STATUS_VARIANT: Record<string, string> = {
  rascunho: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  finalizado: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
  arquivado: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export default function JournalPage() {
  const { isMarketing, loading: roleLoading } = useUserRole();
  const { journals, loading, saving, savedAt, create, save, remove, duplicate } = useJournals();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', unitId: '', referenceMonth: '' });

  const editing = useMemo(
    () => journals.find((journal) => journal.id === editingId) ?? null,
    [journals, editingId],
  );

  const filtered = useMemo(
    () =>
      journals.filter((journal) =>
        journal.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [journals, search],
  );

  if (roleLoading) return null;

  if (!isMarketing) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          O Jornal Institucional é exclusivo para o setor de Marketing e a Administração Geral.
        </p>
      </div>
    );
  }

  const handleCreate = async () => {
    const created = await create({
      name: form.name || 'Nova edição',
      unitId: form.unitId || null,
      profileUnit: form.unitId ? profileUnitForNewsUnit(form.unitId) : null,
      referenceMonth: form.referenceMonth || null,
      status: 'rascunho',
      pages: createJournalPages(),
    });
    setCreating(false);
    setForm({ name: '', unitId: '', referenceMonth: '' });
    if (created) setEditingId(created.id);
  };

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8">
        <JournalEditor
          journal={editing as JournalRecord}
          saving={saving}
          savedAt={savedAt}
          onBack={() => setEditingId(null)}
          onSave={save}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <PageHeader
        title="Jornal Institucional"
        description="Crie edições A4 multipágina padronizadas e exporte em PDF."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Criar novo jornal
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar por nome da edição…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando jornais…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum jornal criado ainda.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Criar novo jornal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((journal) => (
            <article key={journal.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">{journal.name}</h2>
                <Badge className={STATUS_VARIANT[journal.status]} variant="secondary">
                  {STATUS_LABELS[journal.status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[newsUnitName(journal.unit_id), journal.reference_month].filter(Boolean).join(' · ') || 'Sem unidade'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {(journal.pages?.length ?? 0)} página(s) · atualizado em{' '}
                {new Date(journal.updated_at).toLocaleDateString('pt-BR')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" onClick={() => setEditingId(journal.id)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => duplicate(journal)}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(journal.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo jornal</DialogTitle>
            <DialogDescription>
              A edição nasce com capa, matérias, galeria e contracapa — você ajusta as páginas depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome da edição</Label>
              <Input
                value={form.name}
                placeholder="Jornal ANA — Julho/2026"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade (opcional)</Label>
              <Select value={form.unitId} onValueChange={(value) => setForm((prev) => ({ ...prev, unitId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Institucional geral" />
                </SelectTrigger>
                <SelectContent>
                  {NEWS_UNIT_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mês/Ano de referência</Label>
              <Input
                value={form.referenceMonth}
                placeholder="Julho/2026"
                onChange={(event) => setForm((prev) => ({ ...prev, referenceMonth: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar jornal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
