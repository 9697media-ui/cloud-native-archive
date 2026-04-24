-- Inserir alguns eventos de exemplo para demonstração
INSERT INTO public.events (
  title, 
  description, 
  start_datetime, 
  end_datetime, 
  unit, 
  event_type, 
  status, 
  location, 
  created_by,
  marketing_request,
  partner_involved
) VALUES 
(
  'Reunião de Planejamento ANA', 
  'Definição das metas para o próximo trimestre.', 
  NOW() + INTERVAL '1 day', 
  NOW() + INTERVAL '1 day 2 hours', 
  'Evento Geral do Grupo', 
  'reunião', 
  'confirmado', 
  'Auditório Central', 
  'Sistema',
  false,
  false
),
(
  'Workshop de Integração Nilópolis', 
  'Treinamento para novos colaboradores da unidade Nilópolis.', 
  NOW() + INTERVAL '2 days', 
  NOW() + INTERVAL '2 days 4 hours', 
  'Nilópolis', 
  'workshop', 
  'pendente', 
  'Sala de Treinamento 1', 
  'Sistema',
  true,
  false
),
(
  'Ação Social Santana', 
  'Evento de arrecadação de alimentos em parceria com a comunidade.', 
  NOW() + INTERVAL '3 days', 
  NOW() + INTERVAL '3 days 6 hours', 
  'Santana', 
  'evento externo', 
  'confirmado', 
  'Praça Principal', 
  'Sistema',
  true,
  true
);

-- Garantir que as políticas de RLS permitam que usuários autenticados vejam esses eventos
-- (Já deve estar configurado, mas reforçamos)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (true);
