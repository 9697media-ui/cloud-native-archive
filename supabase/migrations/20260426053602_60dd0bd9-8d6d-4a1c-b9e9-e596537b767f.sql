CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_p record;
    is_admin_user boolean;
    is_manager_user boolean;
BEGIN
    -- Check if user is admin or editor via roles table first
    -- This ensures that even without a profile, admins can access logs
    SELECT 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'),
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
    INTO is_admin_user, is_manager_user;

    -- If they are a system admin, they see everything
    IF is_admin_user THEN
        RETURN true;
    END IF;

    -- Get current user profile for further checks
    SELECT * INTO user_p FROM public.profiles WHERE user_id = auth.uid();
    
    -- If they have a profile, check permission_level
    IF user_p IS NOT NULL THEN
        -- Profile says they are active?
        IF user_p.is_active = false THEN
            RETURN false;
        END IF;

        -- Admins (admin_geral) see everything
        IF user_p.permission_level = 'admin_geral' THEN
            RETURN true;
        END IF;

        -- Managers (gestor_unidade) can see all units
        IF user_p.permission_level = 'gestor_unidade' OR is_manager_user THEN
            RETURN true; 
        END IF;

        -- Standard users (usuario_padrao) can ONLY see logs for their DELEGATED units
        IF user_p.permission_level = 'usuario_padrao' THEN
            IF log_unit = ANY(COALESCE(user_p.delegated_units, '{}')) THEN
                RETURN true;
            END IF;
            -- Also check if it's their own unit
            IF log_unit = user_p.unit THEN
                RETURN true;
            END IF;
        END IF;
    ELSE
        -- No profile, but maybe they are a manager via user_roles
        IF is_manager_user THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$function$;