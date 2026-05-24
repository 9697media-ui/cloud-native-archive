
-- Add 'eventos_parceiros' permission level (equivalent to gestor_unidade, but pinned to Evento Geral do Grupo)
CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _uid IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level IN ('gestor_unidade', 'admin_geral', 'eventos_parceiros'))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin'::public.app_role, 'editor'::public.app_role)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_of_unit(_user_id uuid, _unit text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND is_active = true 
    AND (permission_level IN ('admin_geral', 'gestor_unidade', 'eventos_parceiros'))
    AND (unit = _unit OR unit = 'Evento Geral do Grupo')
  );
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_permission_to_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_role public.app_role;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    target_role := CASE 
        WHEN NEW.permission_level IN ('admin', 'admin_geral') THEN 'admin'::public.app_role
        WHEN NEW.permission_level IN ('editor', 'gestor_unidade', 'eventos_parceiros') THEN 'editor'::public.app_role
        ELSE 'viewer'::public.app_role
    END;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, target_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_to_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_role public.app_role;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    target_role := CASE 
        WHEN NEW.permission_level IN ('admin', 'admin_geral') THEN 'admin'::public.app_role
        WHEN NEW.permission_level IN ('editor', 'gestor_unidade', 'eventos_parceiros') THEN 'editor'::public.app_role
        ELSE 'viewer'::public.app_role
    END;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, target_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_role_from_permission_level()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_role public.app_role;
BEGIN
  IF NEW.permission_level = 'admin_geral' THEN
    target_role := 'admin'::public.app_role;
  ELSIF NEW.permission_level IN ('gestor_unidade', 'eventos_parceiros') THEN
    target_role := 'editor'::public.app_role;
  ELSE
    target_role := 'viewer'::public.app_role;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, target_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, created_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  IF NEW.permission_level = 'admin_geral' THEN
    _role := 'admin';
  ELSIF NEW.permission_level IN ('gestor_unidade', 'eventos_parceiros') THEN
    _role := 'editor';
  ELSE
    _role := 'viewer';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, _role)
  ON CONFLICT (user_id) DO UPDATE SET role = _role;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.permission_level = 'admin_geral' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  ELSIF NEW.permission_level IN ('gestor_unidade', 'eventos_parceiros') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'editor')
    ON CONFLICT (user_id) DO UPDATE SET role = 'editor';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_profile_unit_access(profile_id uuid)
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
    _target_unit text;
BEGIN
    IF public.check_is_admin(_uid) THEN RETURN true; END IF;
    IF _uid = profile_id THEN RETURN true; END IF;
    SELECT permission_level, unit, delegated_units 
    INTO _user_level, _user_unit, _delegated
    FROM public.profiles WHERE user_id = _uid;
    SELECT unit INTO _target_unit FROM public.profiles WHERE user_id = profile_id;
    IF _user_level NOT IN ('gestor_unidade', 'eventos_parceiros') AND (_delegated IS NULL OR array_length(_delegated, 1) = 0) THEN
        RETURN false;
    END IF;
    RETURN (_target_unit = _user_unit OR _target_unit = ANY(_delegated));
END;
$function$;

-- Ensure 'eventos_parceiros' is always pinned to 'Evento Geral do Grupo'
CREATE OR REPLACE FUNCTION public.sync_user_unit_by_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.permission_level = 'admin_geral' AND NEW.unit != 'Evento Geral do Grupo' THEN
        NEW.unit := 'Evento Geral do Grupo';
    END IF;
    IF NEW.permission_level = 'eventos_parceiros' THEN
        NEW.unit := 'Evento Geral do Grupo';
    END IF;
    RETURN NEW;
END;
$function$;
