-- 1. Garante que a tabela de perfis tenha as restrições rígidas solicitadas
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_user_unit_relation;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_unit;

ALTER TABLE public.profiles ADD CONSTRAINT check_user_unit_relation
CHECK (
    (permission_level = 'admin_geral' AND unit = 'Evento Geral do Grupo') OR
    (permission_level = 'gestor_unidade' AND unit IN ('DIC', 'Nilópolis', 'Santana')) OR
    (permission_level NOT IN ('admin_geral', 'gestor_unidade'))
);

ALTER TABLE public.profiles ADD CONSTRAINT check_valid_unit 
CHECK (unit IS NULL OR unit IN ('DIC', 'Nilópolis', 'Santana', 'Evento Geral do Grupo'));

-- 2. Gatilho para auto-correção da unidade baseado no nível de permissão
CREATE OR REPLACE FUNCTION public.sync_user_unit_by_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for Admin Geral, a unidade deve ser obrigatoriamente Evento Geral do Grupo
    IF NEW.permission_level = 'admin_geral' AND NEW.unit != 'Evento Geral do Grupo' THEN
        NEW.unit := 'Evento Geral do Grupo';
    END IF;
    
    -- Se for Gestor e tentar colocar a unidade geral, impede ou redireciona (aqui apenas deixamos o CHECK agir se for inválido)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_user_unit_by_role ON public.profiles;
CREATE TRIGGER tr_sync_user_unit_by_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_unit_by_role();

-- 3. Adiciona restrição de unidade na tabela de eventos
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS check_valid_event_unit;
ALTER TABLE public.events ADD CONSTRAINT check_valid_event_unit
CHECK (unit IN ('DIC', 'Nilópolis', 'Santana', 'Evento Geral do Grupo'));

-- 4. Sincroniza restrições na tabela de solicitações de acesso
ALTER TABLE public.access_requests DROP CONSTRAINT IF EXISTS check_request_unit_relation;
ALTER TABLE public.access_requests ADD CONSTRAINT check_request_unit_relation
CHECK (
    (requested_role = 'admin' AND (requested_unit = 'Evento Geral do Grupo' OR requested_unit IS NULL)) OR
    (requested_role = 'editor' AND requested_unit IN ('DIC', 'Nilópolis', 'Santana')) OR
    (requested_role NOT IN ('admin', 'editor'))
);
