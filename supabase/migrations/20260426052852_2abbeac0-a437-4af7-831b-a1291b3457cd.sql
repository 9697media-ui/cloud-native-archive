-- Redefine audit log access function with stricter rules based on user feedback
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
    
    -- If no profile or not active, no access
    IF user_p IS NULL OR user_p.is_active = false THEN
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

    -- Managers (gestor_unidade) can see all units (as requested: "gestores podem consultar outras unidades")
    IF user_p.permission_level = 'gestor_unidade' THEN
        RETURN true; 
    END IF;

    -- Standard users (usuario_padrao) can ONLY see logs for their DELEGATED units
    -- "usuarios padroes nao podem ver [logs gerais], mas podem ver funcoes delegadas"
    IF user_p.permission_level = 'usuario_padrao' THEN
        IF log_unit = ANY(COALESCE(user_p.delegated_units, '{}')) THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$;

-- Ensure all profiles use the correct permission levels and remove deprecated ones
UPDATE public.profiles 
SET permission_level = 'usuario_padrao' 
WHERE permission_level IN ('visualizador', 'viewer');

-- Ensure no users have the 'viewer' role assigned in user_roles
DELETE FROM public.user_roles WHERE role = 'viewer';

-- Final cleanup: ensure is_manager function is consistent with our role definitions
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND permission_level IN ('admin_geral', 'gestor_unidade')
  );
END;
$$;
