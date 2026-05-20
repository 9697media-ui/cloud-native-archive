-- Adicionar coluna de visibilidade
ALTER TABLE public.events ADD COLUMN visibility TEXT DEFAULT 'interno';

-- Atualizar política de acesso público para considerar a visibilidade
DROP POLICY IF EXISTS "Eventos confirmados são visíveis publicamente" ON public.events;

CREATE POLICY "Eventos públicos confirmados são visíveis publicamente" 
ON public.events 
FOR SELECT 
USING (status = 'confirmado' AND visibility = 'publico');

-- Atualizar dados existentes (opcional: assumir que confirmados eram públicos ou manter tudo interno)
-- Vou manter tudo como interno por segurança, conforme o plano.
