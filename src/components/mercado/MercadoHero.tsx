import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MercadoHeroProps {
  onPartnerClick: () => void;
  onLearnClick: () => void;
}

export function MercadoHero({ onPartnerClick, onLearnClick }: MercadoHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-10 lg:p-14 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'hsl(var(--news-brand-4))' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'hsl(var(--news-brand-5))' }}
      />

      <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">
            Parceiro Solidário
          </Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Juntos podemos transformar{' '}
            <span style={{ color: 'hsl(var(--news-brand-4))' }}>alimentos</span> em esperança.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Comunidade que cuida, alimento que transforma. Mais que um mercado, um movimento
            de solidariedade do Grupo ANA Brasil.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onPartnerClick} className="gap-2">
              Quero ser parceiro
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLearnClick}>
              Conheça o projeto
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border shadow-md"
            style={{ background: 'hsl(var(--news-brand-4) / 0.15)' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-center"
              aria-hidden
            >
              <Heart
                className="h-24 w-24 opacity-40"
                style={{ color: 'hsl(var(--news-brand-4))' }}
                strokeWidth={1.2}
              />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-md">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: 'hsl(var(--news-brand-4) / 0.2)', color: 'hsl(var(--news-brand-4))' }}
            >
              <Heart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Impacto Social
              </p>
              <p className="text-sm font-semibold text-foreground">Dignidade às famílias</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
