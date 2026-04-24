-- 1. Fix auto_assign_admin_role trigger function
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Improve sync_user_role_to_profile to handle unit transitions
CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_permission_level text;
    current_level text;
    current_unit text;
    new_unit text;
BEGIN
    -- Avoid infinite recursion
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Determine the target permission level for the role
    target_permission_level := CASE 
        WHEN NEW.role = 'admin' THEN 'admin_geral'
        WHEN NEW.role = 'editor' THEN 'gestor_unidade'
        ELSE 'visualizador'
    END;

    -- Get current profile info
    SELECT permission_level, unit INTO current_level, current_unit FROM public.profiles WHERE user_id = NEW.user_id;

    -- Determine if unit needs to change to stay valid
    new_unit := current_unit;
    IF NEW.role = 'admin' THEN
        new_unit := 'Evento Geral do Grupo';
    ELSIF NEW.role = 'editor' AND (current_unit IS NULL OR current_unit = 'Evento Geral do Grupo') THEN
        new_unit := 'DIC'; -- Default unit for managers if current is invalid
    END IF;

    -- Update profile if something changed
    IF current_level IS DISTINCT FROM target_permission_level OR current_unit IS DISTINCT FROM new_unit OR current_level IS NULL THEN
        UPDATE public.profiles 
        SET 
            permission_level = target_permission_level,
            unit = new_unit,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Relax constraints on profiles to allow more flexibility during updates
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_user_unit_relation;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_unit_role_relation;

-- Add a more flexible constraint that allows transitions
ALTER TABLE public.profiles ADD CONSTRAINT check_profile_unit_role
CHECK (
    (permission_level = 'admin_geral' AND (unit = 'Evento Geral do Grupo' OR unit IS NULL)) OR
    (permission_level = 'gestor_unidade' AND (unit IN ('DIC', 'Nilópolis', 'Santana') OR unit IS NULL)) OR
    (permission_level NOT IN ('admin_geral', 'gestor_unidade') OR permission_level IS NULL)
);

-- 4. Improve access_requests constraint
ALTER TABLE public.access_requests DROP CONSTRAINT IF EXISTS check_request_unit_relation;
ALTER TABLE public.access_requests ADD CONSTRAINT check_request_unit_relation
CHECK (
    (requested_role = 'admin' AND (requested_unit = 'Evento Geral do Grupo' OR requested_unit IS NULL)) OR
    (requested_role = 'editor' AND (requested_unit IN ('DIC', 'Nilópolis', 'Santana') OR requested_unit IS NULL)) OR
    (requested_role NOT IN ('admin', 'editor'))
);

-- 5. Fix handle_new_user to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requested_role_val public.app_role;
  raw_role text;
  final_name text;
  final_email text;
  req_unit text;
  req_perm_level text;
BEGIN
  final_email := COALESCE(NEW.email, 'unknown@example.com');
  final_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(final_email, '@', 1),
    'Novo Usuário'
  );
  
  req_unit := NEW.raw_user_meta_data->>'requested_unit';
  req_perm_level := COALESCE(NEW.raw_user_meta_data->>'requested_permission_level', 'visualizador');

  -- Ensure unit is valid for the requested level to avoid constraint errors
  IF req_perm_level = 'admin_geral' THEN
    req_unit := 'Evento Geral do Grupo';
  ELSIF req_perm_level = 'gestor_unidade' AND (req_unit IS NULL OR req_unit = 'Evento Geral do Grupo') THEN
    req_unit := 'DIC';
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level)
  VALUES (NEW.id, final_email, final_name, req_unit, req_perm_level)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    updated_at = now();

  -- Safely determine requested role
  raw_role := NEW.raw_user_meta_data->>'requested_role';
  IF raw_role IS NOT NULL AND raw_role IN ('admin', 'editor', 'viewer') THEN
    requested_role_val := raw_role::public.app_role;
  ELSE
    requested_role_val := 'viewer'::public.app_role;
  END IF;

  -- Create or update access request
  INSERT INTO public.access_requests (
    user_id, email, name, requested_role, requested_unit, requested_permission_level, status
  )
  VALUES (NEW.id, final_email, final_name, requested_role_val, req_unit, req_perm_level, 'pending')
  ON CONFLICT (user_id) WHERE status = 'pending' DO UPDATE SET
    requested_at = now(),
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    requested_role = EXCLUDED.requested_role,
    requested_unit = EXCLUDED.requested_unit,
    requested_permission_level = EXCLUDED.requested_permission_level;

  RETURN NEW;
END;
$$;