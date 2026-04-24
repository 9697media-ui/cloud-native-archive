-- Fix unique constraint on user_roles to allow one role per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Consolidate and fix trigger functions
CREATE OR REPLACE FUNCTION public.sync_profile_permission_to_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only sync if permission_level has changed or it's a new insert
    IF (TG_OP = 'UPDATE' AND OLD.permission_level IS DISTINCT FROM NEW.permission_level) OR TG_OP = 'INSERT' THEN
        -- Map permission_level to role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.permission_level = 'admin' THEN 'admin'::public.app_role
                WHEN NEW.permission_level = 'admin_geral' THEN 'admin'::public.app_role
                WHEN NEW.permission_level = 'gestor_unidade' THEN 'editor'::public.app_role
                WHEN NEW.permission_level = 'editor' THEN 'editor'::public.app_role
                ELSE 'viewer'::public.app_role
            END
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.profiles 
    SET permission_level = 
        CASE 
            WHEN NEW.role = 'admin' THEN 'admin_geral'
            WHEN NEW.role = 'editor' THEN 'gestor_unidade'
            ELSE 'visualizador'
        END
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$function$;

-- Remove redundant triggers to avoid confusion and circularity
DROP TRIGGER IF EXISTS tr_sync_user_role ON public.profiles;
DROP TRIGGER IF EXISTS tr_sync_user_role_insert ON public.profiles;

-- Ensure the main triggers are active and using the fixed functions
DROP TRIGGER IF EXISTS on_profile_permission_change ON public.profiles;
CREATE TRIGGER on_profile_permission_change
AFTER INSERT OR UPDATE OF permission_level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_permission_to_role();

DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_profile();
