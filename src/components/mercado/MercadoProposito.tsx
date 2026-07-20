import { Target, HandHeart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const pillars = [
  {
    icon: Target,
    title: 'Reduzir o desperdício',
    description:
      'Aproveitamos alimentos que perderam valor comercial, mas mantêm total valor nutricional e segurança para consumo.',
    color: 'hsl(var(--news-brand-4))',
  },
  {
    icon: HandHeart,
    title: 'Ampliar o acesso',
    description:
      'Garantimos que itens essenciais cheguem à mesa de quem realmente precisa, combatendo a fome.',
    color: 'hsl(var(--news-brand-2))',
  },
  {
    icon: Sparkles,
    title: 'Proporcionar dignidade',
    description:
      'Entregar alimentos de qualidade é entregar respeito e esperança às famílias que mais precisam.',
    color: 'hsl(var(--news-brand-5))',
  },
];

export function MercadoProposito() {
  return (
    <section id="proposito" className="scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Nosso Propósito
        </h2>
        <div
          className="mx-auto mt-3 h-1 w-16 rounded-full"
          style={{ background: 'hsl(var(--news-brand-4))' }}
        />
        <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
          O Mercado Solidário é uma iniciativa do <strong className="text-foreground">Grupo ANA Brasil</strong>{' '}
          que apoia famílias em situação de vulnerabilidade social atendidas por nossas unidades.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <Card
            key={p.title}
            className="group border-border transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-6">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                style={{ background: `color-mix(in oklab, ${p.color} 18%, transparent)`, color: p.color }}
              >
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
