-- Habilitar RLS na tabela de eventos (se não estiver)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política para visualização pública de eventos confirmados
CREATE POLICY "Eventos confirmados são visíveis publicamente" 
ON public.events 
FOR SELECT 
USING (status = 'confirmado');

-- Política para administradores e gestores verem todos os eventos (já deve existir, mas reforçando)
-- Se já houver uma política "Users can view events", ela pode coexistir ou ser ajustada.
-- A política acima já cobre o público para os 'confirmados'.

-- Configurações de visualização (garantindo que existam)
INSERT INTO public.view_configs (key, value)
VALUES ('enable_public_view', 'true')
ON CONFLICT (key) DO NOTHING;
