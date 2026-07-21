import { useEffect, useRef } from 'react';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import { MercadoHero } from '@/components/mercado/MercadoHero';
import { MercadoProposito } from '@/components/mercado/MercadoProposito';
import { MercadoComoAjudar } from '@/components/mercado/MercadoComoAjudar';
import { MercadoAtuacao } from '@/components/mercado/MercadoAtuacao';
import { MercadoContato } from '@/components/mercado/MercadoContato';
import { useIframeHeightReporter } from '@/hooks/useIframeHeightReporter';

export default function MercadoSolidarioPublicPage() {
  const contatoRef = useRef<HTMLDivElement>(null);
  const propositoRef = useRef<HTMLDivElement>(null);

  useIframeHeightReporter('mercado-solidario-height');

  useEffect(() => {
    document.documentElement.classList.add('mercado-embed');
    return () => document.documentElement.classList.remove('mercado-embed');
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-background">

      <main className="w-full px-4 py-6 lg:px-8">
        <div className="space-y-10">
          <div className="mx-auto max-w-7xl">
            <MercadoHero
              onPartnerClick={() => scrollTo(contatoRef)}
              onLearnClick={() => scrollTo(propositoRef)}
            />
          </div>
          <div ref={propositoRef} className="mx-auto max-w-7xl">
            <MercadoProposito />
          </div>
          <div className="mx-auto max-w-7xl">
            <MercadoComoAjudar />
          </div>
          <div className="mx-auto max-w-7xl">
            <MercadoAtuacao />
          </div>
          <div ref={contatoRef} className="mx-auto max-w-7xl">
            <MercadoContato />
          </div>

          <div className="mx-auto max-w-7xl pt-4">
            <InstitutionalFooterBar className="rounded-md" />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Mercado Solidário — uma iniciativa do Grupo ANA Brasil.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
