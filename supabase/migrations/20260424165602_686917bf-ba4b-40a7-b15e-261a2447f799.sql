-- 1. Adiciona restrição em access_requests similar à de profiles
ALTER TABLE public.access_requests
ADD CONSTRAINT check_request_unit_relation
CHECK (
    (requested_role = 'admin' AND requested_unit = 'Evento Geral do Grupo') OR
    (requested_role = 'editor' AND requested_unit IN ('DIC', 'Nilópolis', 'Santana')) OR
    (requested_role NOT IN ('admin', 'editor'))
);

-- 2. Atualiza RLS na tabela events para ser mais restritivo com base na unidade
-- Primeiro remove as políticas antigas muito permissivas
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Cria novas políticas granulares
CREATE POLICY "Admins have full access to events"
ON public.events
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Managers can insert events for their unit"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND permission_level = 'gestor_unidade'
        AND profiles.unit = events.unit
    )
);

CREATE POLICY "Managers can update events of their unit"
ON public.events
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND permission_level = 'gestor_unidade'
        AND profiles.unit = events.unit
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND permission_level = 'gestor_unidade'
        AND profiles.unit = events.unit
    )
);

CREATE POLICY "Managers can delete events of their unit"
ON public.events
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND permission_level = 'gestor_unidade'
        AND profiles.unit = events.unit
    )
);
