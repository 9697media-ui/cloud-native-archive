import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface A4FillIndicatorProps {
  /** Percentual de ocupação da folha A4 (100 = exatamente uma página) */
  percent: number;
  className?: string;
}

type State = 'ok' | 'tight' | 'over';

function getState(percent: number): State {
  if (percent > 100) return 'over';
  if (percent > 90) return 'tight';
  return 'ok';
}

const COPY: Record<State, { title: string; description: string }> = {
  ok: {
    title: 'Cabe confortavelmente em uma página',
    description: 'O informativo será gerado em uma única folha A4.',
  },
  tight: {
    title: 'Pouco espaço restante',
    description: 'Está quase no limite da folha. Revise antes de gerar o PDF.',
  },
  over: {
    title: 'Ultrapassou uma página',
    description:
      'O PDF sairá em duas páginas legíveis. Para manter uma só: reduza o texto, diminua a altura das imagens ou remova um bloco.',
  },
};

/**
 * Indicador de ocupação da folha A4.
 * Verde ≤ 90% · Âmbar 91–100% · Coral > 100%.
 */
export function A4FillIndicator({ percent, className }: A4FillIndicatorProps) {
  const state = getState(percent);
  const rounded = Math.max(0, Math.round(percent));
  const Icon = state === 'ok' ? CheckCircle2 : state === 'tight' ? Info : AlertTriangle;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-2',
        state === 'ok' && 'border-success/30 bg-success/10',
        state === 'tight' && 'border-warning/40 bg-warning/10',
        state === 'over' && 'border-destructive/30 bg-destructive/10',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Icon
          size={16}
          className={cn(
            state === 'ok' && 'text-success',
            state === 'tight' && 'text-warning',
            state === 'over' && 'text-destructive',
          )}
        />
        <span className="text-xs font-semibold text-foreground flex-1">A4: {rounded}% preenchida</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            state === 'ok' && 'bg-success',
            state === 'tight' && 'bg-warning',
            state === 'over' && 'bg-destructive',
          )}
          style={{ width: `${Math.min(100, rounded)}%` }}
        />
      </div>
      <p className="text-[11px] font-medium text-foreground">{COPY[state].title}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{COPY[state].description}</p>
    </div>
  );
}

export default A4FillIndicator;
