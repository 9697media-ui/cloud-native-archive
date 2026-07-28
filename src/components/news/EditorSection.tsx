import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorSectionProps {
  index: number;
  title: string;
  hint?: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * Seção de acordeão do editor do informativo.
 * Uma seção aberta por vez, com numeração para dar senso de progresso.
 */
export function EditorSection({
  index,
  title,
  hint,
  icon,
  open,
  onToggle,
  badge,
  children,
}: EditorSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-background overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted/40 transition-colors min-h-[44px]"
      >
        <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">
          {index}
        </span>
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground truncate">{title}</span>
          {hint && <span className="block text-[11px] text-muted-foreground truncate">{hint}</span>}
        </span>
        {badge}
        <ChevronDown
          size={16}
          className={cn('text-muted-foreground transition-transform flex-shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && <div className="px-3 pb-4 pt-1 space-y-4 border-t border-border">{children}</div>}
    </section>
  );
}

export default EditorSection;
