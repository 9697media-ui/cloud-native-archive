-- Update handle_access_request_approval to use 'usuario_padrao' instead of 'visualizador'
CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    target_permission_level TEXT;
    target_unit TEXT;
BEGIN
    -- Check if status changed to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
        -- Determine permission level and unit
        IF NEW.requested_role = 'admin' THEN
            target_permission_level := 'admin_geral';
            target_unit := 'Evento Geral do Grupo';
        ELSIF NEW.requested_role = 'editor' THEN
            target_permission_level := 'gestor_unidade';
            target_unit := COALESCE(NEW.requested_unit, 'DIC');
        ELSE
            -- Changed 'visualizador' to 'usuario_padrao'
            target_permission_level := 'usuario_padrao';
            target_unit := COALESCE(NEW.requested_unit, 'Evento Geral do Grupo');
        END IF;

        -- Update the profile (the trigger on profiles will sync to user_roles)
        UPDATE public.profiles
        SET 
            permission_level = target_permission_level,
            unit = target_unit,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Update handle_new_user to use 'usuario_padrao'
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    full_name TEXT;
    is_whitelisted BOOLEAN;
    final_role public.app_role;
    final_permission_level TEXT;
    final_active BOOLEAN;
BEGIN
    -- Check if user is in whitelist
    is_whitelisted := NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org', 'alyson-viana@hotmail.com');
    
    -- Safe metadata extraction
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    
    -- Force default values
    IF is_whitelisted THEN
        final_role := 'admin'::public.app_role;
        final_permission_level := 'admin_geral';
        final_active := true;
    ELSE
        -- Changed from 'viewer' to 'usuario_padrao'
        final_role := 'usuario_padrao'::public.app_role;
        final_permission_level := 'usuario_padrao';
        -- Now active by default but with zero permissions (handled by RLS and UI)
        final_active := true;
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
    VALUES (
        NEW.id, 
        NEW.email, 
        full_name, 
        final_active, 
        CASE WHEN is_whitelisted THEN 'Evento Geral do Grupo' ELSE 'Pendente' END, 
        final_permission_level
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        is_active = CASE WHEN is_whitelisted THEN true ELSE public.profiles.is_active END;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, final_role)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = CASE WHEN is_whitelisted THEN 'admin'::public.app_role ELSE public.user_roles.role END;

    -- Create access request for non-whitelisted if they need more than usuario_padrao
    IF NOT is_whitelisted THEN
        INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
        VALUES (NEW.id, final_role, 'Evento Geral do Grupo', 'pending', full_name, NEW.email)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Migrate existing data
UPDATE public.profiles SET permission_level = 'usuario_padrao' WHERE permission_level IN ('visualizador', 'viewer');
UPDATE public.user_roles SET role = 'usuario_padrao' WHERE role = 'viewer';

-- Enhance Audit Log access: Managers see all units, standard users see via delegated permission
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

    -- Managers (gestor_unidade) can see all units as per new requirement
    IF user_p.permission_level = 'gestor_unidade' THEN
        RETURN true;
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
