-- Add 'criador' and 'usuario_padrao' to app_role if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'criador') THEN
        ALTER TYPE public.app_role ADD VALUE 'criador';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'usuario_padrao') THEN
        ALTER TYPE public.app_role ADD VALUE 'usuario_padrao';
    END IF;
END $$;

-- Update handle_new_user function to follow new rules
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    full_name TEXT;
    is_whitelisted BOOLEAN;
    final_role public.app_role;
    final_permission_level TEXT;
    final_active BOOLEAN;
BEGIN
    -- Check if user is in whitelist (case-insensitive)
    is_whitelisted := LOWER(NEW.email) IN (
      'mkt@anabrasil.org', 
      'adm@anabrasil.org', 
      'admin@anabrasil.org',
      'financeiro@anabrasil.org', 
      'alyson-viana@hotmail.com'
    );
    
    -- Safe metadata extraction
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    
    -- New rules: default to usuario_padrao with no unit
    IF is_whitelisted THEN
        final_role := 'admin'::public.app_role;
        final_permission_level := 'admin_geral';
        final_active := true;
    ELSE
        final_role := 'usuario_padrao'::public.app_role;
        final_permission_level := 'usuario_padrao';
        final_active := true; -- Active but with no permissions (handled by level/modules)
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
    VALUES (
        NEW.id, 
        NEW.email, 
        full_name, 
        final_active, 
        CASE WHEN is_whitelisted THEN 'Evento Geral do Grupo' ELSE NULL END, 
        final_permission_level
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        permission_level = CASE WHEN is_whitelisted THEN 'admin_geral' ELSE public.profiles.permission_level END,
        is_active = CASE WHEN is_whitelisted THEN true ELSE public.profiles.is_active END,
        unit = CASE WHEN is_whitelisted THEN 'Evento Geral do Grupo' ELSE public.profiles.unit END;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, final_role)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = CASE WHEN is_whitelisted THEN 'admin'::public.app_role ELSE public.user_roles.role END;

    -- Create access request for non-whitelisted
    IF NOT is_whitelisted THEN
        INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
        VALUES (NEW.id, final_role, NULL, 'pending', full_name, NEW.email)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$;

-- Refine audit log access functions
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 DECLARE
     _uid uuid := auth.uid();
     _user_level text;
     _user_unit text;
     _delegated text[];
 BEGIN
     -- Get user info once
     SELECT permission_level, unit, delegated_units 
     INTO _user_level, _user_unit, _delegated
     FROM public.profiles 
     WHERE user_id = _uid;

     -- Admins see everything
     IF _user_level = 'admin_geral' THEN
         RETURN true;
     END IF;

     -- Managers see their unit and delegated units
     IF _user_level = 'gestor_unidade' THEN
         RETURN (log_unit = _user_unit OR log_unit = ANY(_delegated));
     END IF;
     
     -- Other roles with delegated access
     IF _delegated IS NOT NULL AND array_length(_delegated, 1) > 0 THEN
         RETURN (log_unit = ANY(_delegated));
     END IF;

     RETURN false;
 END;
 $function$;

-- Re-apply policies for audit_logs to ensure they use the refined function
DROP POLICY IF EXISTS "Unified audit log access" ON audit_logs;
CREATE POLICY "Unified audit log access" 
ON public.audit_logs 
FOR SELECT 
USING (check_audit_log_access(unit));

-- Update is_admin and is_manager to be more robust
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level = 'admin_geral'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level IN ('gestor_unidade', 'admin_geral'))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin', 'editor')
  );
END;
$function$;