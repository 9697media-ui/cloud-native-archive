-- 1. Remove rigid constraints that prevent changing permission_level without changing unit simultaneously
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_admin_unit;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_gestor_unit;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_unit_by_permission;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_unit;

-- 2. Add a more flexible unit validation
ALTER TABLE public.profiles ADD CONSTRAINT check_valid_unit 
CHECK (unit IS NULL OR unit IN ('DIC', 'Nilópolis', 'Santana', 'Evento Geral do Grupo'));

-- 3. Update synchronization from profiles to user roles
CREATE OR REPLACE FUNCTION public.sync_profile_permission_to_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Avoid infinite recursion
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF (TG_OP = 'UPDATE' AND (OLD.permission_level IS DISTINCT FROM NEW.permission_level)) OR TG_OP = 'INSERT' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.permission_level IN ('admin', 'admin_geral') THEN 'admin'::public.app_role
                WHEN NEW.permission_level IN ('editor', 'gestor_unidade') THEN 'editor'::public.app_role
                ELSE 'viewer'::public.app_role
            END
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Update synchronization from user roles back to profiles (with compatibility check)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    current_level text;
    belongs_to_role boolean;
BEGIN
    -- Avoid infinite recursion
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    SELECT permission_level INTO current_level FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Check if current level is already compatible with the new role
    belongs_to_role := CASE
        WHEN NEW.role = 'admin' THEN current_level IN ('admin', 'admin_geral')
        WHEN NEW.role = 'editor' THEN current_level IN ('editor', 'gestor_unidade')
        ELSE current_level IN ('usuario_padrao', 'visualizador')
    END;

    -- Only update if the current level is not compatible with the new role
    IF NOT belongs_to_role OR current_level IS NULL THEN
        UPDATE public.profiles 
        SET permission_level = 
            CASE 
                WHEN NEW.role = 'admin' THEN 'admin_geral'
                WHEN NEW.role = 'editor' THEN 'gestor_unidade'
                ELSE 'visualizador'
            END
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;