import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { INTERNAL_TEMPLATES } from '@/lib/journal/templates';
import type { JournalTemplate } from '@/lib/journal/types';
import {
  CalendarDays,
  FileImage,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Newspaper,
  Type,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: JournalTemplate) => void;
}

const TEMPLATE_ICON: Record<JournalTemplate, React.ComponentType<{ className?: string }>> = {
  capa: LayoutTemplate,
  capa_c1: LayoutTemplate,
  capa_c2: LayoutTemplate,
  capa_c3: LayoutTemplate,
  materia: Newspaper,
  materia_imagem: Newspaper,
  materias: LayoutGrid,
  duas_materias: LayoutGrid,
  galeria: FileImage,
  agenda: CalendarDays,
  numeros: Type,
  destaques_numeros: Type,
  chamada_destaque: FileText,
  contracapa: Newspaper,
  branco: FileText,
};

const TEMPLATE_LABEL: Record<JournalTemplate, string> = {
  capa: 'Capa',
  capa_c1: 'Imagem dominante',
  capa_c2: 'Imagem + chamadas',
  capa_c3: 'Editorial',
  materia: 'Matéria com imagem',
  materia_imagem: 'Matéria com imagem',
  materias: 'Duas matérias',
  duas_materias: 'Duas matérias',
  galeria: 'Galeria (4 fotos)',
  agenda: 'Agenda',
  numeros: 'Destaques rápidos',
  destaques_numeros: 'Destaques rápidos (números)',
  chamada_destaque: 'Chamada principal + destaques',
  contracapa: 'Contracapa',
  branco: 'Página em branco (avançado)',
};

export function PageTemplateGallery({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Escolha um layout de página</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {INTERNAL_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICON[template];
            return (
              <Button
                key={template}
                variant="outline"
                className="h-auto flex-col items-start gap-2 whitespace-normal p-4 text-left hover:bg-accent"
                onClick={() => onSelect(template)}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium leading-tight">{TEMPLATE_LABEL[template]}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
