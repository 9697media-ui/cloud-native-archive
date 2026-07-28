import { ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EditorStepProps {
  step: number;
  title: string;
  description?: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: ReactNode;
  complete?: boolean;
  children: ReactNode;
}

/**
 * Passo colapsável do editor de notícias.
 * Mantém o painel enxuto: apenas um passo expandido por vez.
 */
export function EditorStep({
  step,
  title,
  description,
  icon,
  open,
  onToggle,
  badge,
  complete,
  children,
}: EditorStepProps) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-background overflow-hidden transition-colors',
        open ? 'border-primary/40 shadow-sm' : 'border-border'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0',
            complete ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
          )}
        >
          {complete ? <Check size={14} /> : step}
        </span>
        <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground leading-tight truncate">
            {title}
          </span>
          {description && (
            <span className="block text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
              {description}
            </span>
          )}
        </span>
        {badge}
        <ChevronDown
          size={16}
          className={cn('text-muted-foreground transition-transform flex-shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && <div className="px-3.5 pb-4 pt-1 space-y-3 border-t border-border/60">{children}</div>}
    </section>
  );
}

export default EditorStep;
