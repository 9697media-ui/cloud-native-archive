-- 1. Update app_role enum check (ensure it exists and has correct values)
-- (Assuming app_role already exists with admin, editor, viewer)

-- 2. Robust function to sync from Profile to User Role
CREATE OR REPLACE FUNCTION public.sync_profile_permission_to_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_role public.app_role;
BEGIN
    -- Avoid infinite recursion
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Map permission_level to app_role
    target_role := CASE 
        WHEN NEW.permission_level IN ('admin', 'admin_geral') THEN 'admin'::public.app_role
        WHEN NEW.permission_level IN ('editor', 'gestor_unidade') THEN 'editor'::public.app_role
        ELSE 'viewer'::public.app_role
    END;

    -- Sync to user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, target_role)
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$;

-- 3. Robust function to sync from User Role to Profile
CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_permission_level text;
    current_level text;
BEGIN
    -- Avoid infinite recursion
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Determine the default permission level for the role
    target_permission_level := CASE 
        WHEN NEW.role = 'admin' THEN 'admin_geral'
        WHEN NEW.role = 'editor' THEN 'gestor_unidade'
        ELSE 'visualizador'
    END;

    -- Get current profile level
    SELECT permission_level INTO current_level FROM public.profiles WHERE user_id = NEW.user_id;

    -- Check compatibility to avoid redundant updates
    -- If current level is already compatible with the role, don't force a change
    IF NOT (
        (NEW.role = 'admin' AND current_level IN ('admin', 'admin_geral')) OR
        (NEW.role = 'editor' AND current_level IN ('editor', 'gestor_unidade')) OR
        (NEW.role = 'viewer' AND current_level IN ('usuario_padrao', 'visualizador'))
    ) OR current_level IS NULL THEN
        UPDATE public.profiles 
        SET 
            permission_level = target_permission_level,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Re-ensure triggers are correctly attached
DROP TRIGGER IF EXISTS on_profile_permission_change ON public.profiles;
CREATE TRIGGER on_profile_permission_change
AFTER INSERT OR UPDATE OF permission_level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_permission_to_role();

DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_profile();

-- 5. Fix handle_access_request_approval trigger logic
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
            target_permission_level := 'visualizador';
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
