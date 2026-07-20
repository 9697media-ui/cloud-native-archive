import { useRef } from 'react';
import { InstitutionalFooterBar } from '@/components/news/InstitutionalFooterBar';
import { MercadoHero } from '@/components/mercado/MercadoHero';
import { MercadoProposito } from '@/components/mercado/MercadoProposito';
import { MercadoComoAjudar } from '@/components/mercado/MercadoComoAjudar';
import { MercadoAtuacao } from '@/components/mercado/MercadoAtuacao';
import { MercadoContato } from '@/components/mercado/MercadoContato';

export default function MercadoSolidarioPublicPage() {
  const contatoRef = useRef<HTMLDivElement>(null);
  const propositoRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <div className="space-y-10">
          <MercadoHero
            onPartnerClick={() => scrollTo(contatoRef)}
            onLearnClick={() => scrollTo(propositoRef)}
          />
          <div ref={propositoRef}>
            <MercadoProposito />
          </div>
          <MercadoComoAjudar />
          <MercadoAtuacao />
          <div ref={contatoRef}>
            <MercadoContato />
          </div>

          <div className="pt-4">
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
