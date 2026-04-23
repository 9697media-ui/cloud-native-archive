import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, X, CheckSquare } from 'lucide-react';
import { EventStatus, EVENT_STATUSES } from '@/types';

interface BulkEventActionBarProps {
  type: 'events';
  count: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onChangeStatus: (status: EventStatus) => void;
}

interface BulkUserActionBarProps {
  type: 'users';
  count: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}

type BulkActionBarProps = BulkEventActionBarProps | BulkUserActionBarProps;

export default function BulkActionBar(props: BulkActionBarProps) {
  if (props.count === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm backdrop-blur-sm">
      <CheckSquare className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        {props.count} {props.type === 'events' ? 'evento(s)' : 'usuário(s)'} selecionado(s)
      </span>

      <div className="ml-auto flex items-center gap-2">
        {props.type === 'events' && (
          <Select onValueChange={(v) => (props as BulkEventActionBarProps).onChangeStatus(v as EventStatus)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Alterar status" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {props.type === 'users' && (
          <>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => (props as BulkUserActionBarProps).onToggleActive(false)}>
              Desativar
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => (props as BulkUserActionBarProps).onToggleActive(true)}>
              Ativar
            </Button>
          </>
        )}

        <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={props.onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </Button>

        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={props.onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
