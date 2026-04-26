-- Drop existing overlapping policies to start fresh
DROP POLICY IF EXISTS "Managers can view logs of their unit" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view unit audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view their unit logs" ON public.audit_logs;

-- Create or update a robust access check function
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_p record;
BEGIN
    -- Get current user profile
    SELECT * INTO user_p FROM public.profiles WHERE user_id = auth.uid();
    
    -- If no profile, no access
    IF user_p IS NULL THEN
        RETURN false;
    END IF;

    -- Admins (admin_geral) see everything
    IF user_p.permission_level = 'admin_geral' OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN true;
    END IF;

    -- Managers (gestor_unidade) can see their unit and delegated units
    IF user_p.permission_level = 'gestor_unidade' THEN
        IF user_p.unit = log_unit OR log_unit = ANY(user_p.delegated_units) THEN
            RETURN true;
        END IF;
    END IF;

    -- Standard users (usuario_padrao) can see ONLY if they have explicit permission
    -- and it's their unit or a delegated unit
    IF (user_p.view_restrictions->>'can_view_audit')::boolean = true THEN
        IF user_p.unit = log_unit OR log_unit = ANY(user_p.delegated_units) THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$;

-- Apply the new policy
CREATE POLICY "Unified audit log access"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (check_audit_log_access(unit));

-- Also ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
