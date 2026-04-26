CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    user_p record;
    is_admin_user boolean;
BEGIN
    -- Get current user profile
    SELECT * INTO user_p FROM public.profiles WHERE user_id = auth.uid();
    
    -- If no profile, no access
    IF user_p IS NULL THEN
        RETURN false;
    END IF;

    -- Check if user is admin via roles
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin_user;

    -- Admins (admin_geral) see everything
    IF user_p.permission_level = 'admin_geral' OR is_admin_user THEN
        RETURN true;
    END IF;

    -- Managers (gestor_unidade) can see their unit and other units as requested
    IF user_p.permission_level = 'gestor_unidade' THEN
        -- "gestores podem consultar outras unidades" - allowing all for now, 
        -- but UI should focus on their unit.
        RETURN true; 
    END IF;

    -- Standard users (usuario_padrao) can see ONLY if they have explicit permission
    -- and it's their unit or a delegated unit
    IF user_p.permission_level = 'usuario_padrao' AND (user_p.view_restrictions->>'can_view_audit')::boolean = true THEN
        IF user_p.unit = log_unit OR log_unit = ANY(COALESCE(user_p.delegated_units, '{}')) THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$;