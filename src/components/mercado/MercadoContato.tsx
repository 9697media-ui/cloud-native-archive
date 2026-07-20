import { useState } from 'react';
import { z } from 'zod';
import { User, Phone, Mail, Globe, Send, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(100),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().min(8, 'Telefone inválido').max(20),
  email: z.string().trim().email('E-mail inválido').max(160),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Mensagem muito curta').max(1000),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const initial: FormValues = { name: '', company: '', phone: '', email: '', city: '', message: '' };

const contacts = [
  { icon: User, label: 'Responsável', value: 'Ricardo', href: null },
  { icon: Phone, label: 'Telefone / WhatsApp', value: '(19) 99727-8118', href: 'https://wa.me/5519997278118' },
  { icon: Mail, label: 'E-mail', value: 'parceiros@anabrasil.org', href: 'mailto:parceiros@anabrasil.org' },
  { icon: Globe, label: 'Site Oficial', value: 'anabrasil.org', href: 'https://anabrasil.org' },
];

export function MercadoContato() {
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    // Preparado para integração futura (endpoint / edge function).
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setValues(initial);
    toast({
      title: 'Mensagem enviada',
      description: 'Recebemos seu contato. Retornaremos em breve.',
    });
  };

  return (
    <section id="contato" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
      <Card className="border-border">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Informações de contato</h3>
          <div
            className="mt-3 h-1 w-12 rounded-full"
            style={{ background: 'hsl(var(--news-brand-4))' }}
          />
          <ul className="mt-6 space-y-4">
            {contacts.map((c) => (
              <li key={c.label} className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'hsl(var(--news-brand-4) / 0.15)',
                    color: 'hsl(var(--news-brand-4))',
                  }}
                >
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </p>
                  {c.href ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <p className="font-semibold text-foreground">{c.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Envie uma mensagem</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nossa equipe entrará em contato em breve.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ms-name">Nome</Label>
                <Input
                  id="ms-name"
                  value={values.name}
                  onChange={(e) => setField('name', e.target.value)}
                  maxLength={100}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ms-company">Empresa</Label>
                <Input
                  id="ms-company"
                  value={values.company}
                  onChange={(e) => setField('company', e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ms-phone">Telefone</Label>
                <Input
                  id="ms-phone"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  maxLength={20}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ms-email">E-mail</Label>
                <Input
                  id="ms-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => setField('email', e.target.value)}
                  maxLength={160}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ms-city">Cidade</Label>
              <Input
                id="ms-city"
                value={values.city}
                onChange={(e) => setField('city', e.target.value)}
                maxLength={80}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ms-message">Mensagem</Label>
              <Textarea
                id="ms-message"
                rows={4}
                value={values.message}
                onChange={(e) => setField('message', e.target.value)}
                maxLength={1000}
                aria-invalid={!!errors.message}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Enviando...' : 'Enviar mensagem'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
