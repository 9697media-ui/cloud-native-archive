-- 1. Função para verificar acesso a um perfil baseado em unidade
CREATE OR REPLACE FUNCTION public.check_profile_unit_access(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _uid uuid := auth.uid();
    _user_level text;
    _user_unit text;
    _delegated text[];
    _target_unit text;
BEGIN
    -- Admin vê tudo
    IF public.check_is_admin(_uid) THEN
        RETURN true;
    END IF;

    -- Usuário vê a si mesmo
    IF _uid = profile_id THEN
        RETURN true;
    END IF;

    -- Pegar info do gestor
    SELECT permission_level, unit, delegated_units 
    INTO _user_level, _user_unit, _delegated
    FROM public.profiles 
    WHERE user_id = _uid;

    -- Pegar unidade do perfil alvo
    SELECT unit INTO _target_unit FROM public.profiles WHERE user_id = profile_id;

    -- Se não for gestor ou admin, e não for ele mesmo, não vê
    IF _user_level != 'gestor_unidade' AND (_delegated IS NULL OR array_length(_delegated, 1) = 0) THEN
        RETURN false;
    END IF;

    -- Gestor vê sua unidade e delegadas
    RETURN (_target_unit = _user_unit OR _target_unit = ANY(_delegated));
END;
$$;

-- 2. Atualizar políticas da tabela 'profiles'
DROP POLICY IF EXISTS "profiles_view_own_or_manager" ON public.profiles;

CREATE POLICY "profiles_view_restricted" ON public.profiles 
FOR SELECT TO authenticated 
USING (public.check_profile_unit_access(user_id));

-- 3. Atualizar políticas da tabela 'access_requests'
DROP POLICY IF EXISTS "Admins and Managers can view all requests" ON public.access_requests;

CREATE POLICY "access_requests_manager_select" ON public.access_requests 
FOR SELECT TO authenticated 
USING (
    public.check_is_admin(auth.uid()) OR 
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.permission_level = 'gestor_unidade' 
        AND (requested_unit = p.unit OR requested_unit = ANY(p.delegated_units))
    ) OR 
    user_id = auth.uid()
);

-- 4. Refinar política de logs de auditoria
-- Já existe a função check_audit_log_access, vamos garantir que ela é usada corretamente
DROP POLICY IF EXISTS "audit_logs_manager_select" ON public.audit_logs;

CREATE POLICY "audit_logs_manager_select" ON public.audit_logs 
FOR SELECT TO authenticated 
USING (public.check_audit_log_access(unit));

-- 5. Garantir que 'Usuário Padrão' não tenha permissões extras
-- Vamos garantir que as funções de check_is_admin e check_is_manager lidem com isso
-- (Já estão implementadas baseadas em permission_level)
