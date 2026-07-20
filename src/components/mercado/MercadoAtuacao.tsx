import { Users, GraduationCap, HeartHandshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const areas = [
  { icon: HeartHandshake, title: 'Assistência Social', desc: 'Acolhimento e proteção às famílias.' },
  { icon: GraduationCap, title: 'Educação', desc: 'Desenvolvimento humano e formação.' },
  { icon: Users, title: 'Comunidade', desc: 'Atendimento e fortalecimento de vínculos.' },
];

export function MercadoAtuacao() {
  return (
    <section className="scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Nossa Atuação
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
          O Grupo ANA Brasil desenvolve serviços que promovem acolhimento, proteção e desenvolvimento
          humano. O Mercado Solidário reforça nosso compromisso com a solidariedade e o cuidado com
          as pessoas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {areas.map((a) => (
          <Card key={a.title} className="border-border text-center transition-all hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: 'hsl(var(--news-brand-4) / 0.15)',
                  color: 'hsl(var(--news-brand-4))',
                }}
              >
                <a.icon className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
