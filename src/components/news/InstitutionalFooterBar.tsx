import { cn } from '@/lib/utils';

interface InstitutionalFooterBarProps {
  className?: string;
}

/**
 * Barra institucional de rodapé com 5 faixas iguais.
 * Cores vêm de tokens semânticos definidos em index.css.
 */
export function InstitutionalFooterBar({ className }: InstitutionalFooterBarProps) {
  return (
    <div
      className={cn(
        'flex w-full overflow-hidden h-3 md:h-4 print:h-[18px]',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex-1 bg-news-brand-1" />
      <div className="flex-1 bg-news-brand-2" />
      <div className="flex-1 bg-news-brand-3" />
      <div className="flex-1 bg-news-brand-4" />
      <div className="flex-1 bg-news-brand-5" />
    </div>
  );
}

export default InstitutionalFooterBar;
