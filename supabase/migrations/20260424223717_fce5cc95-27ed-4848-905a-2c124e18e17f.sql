-- Enable citext for case-insensitive emails
CREATE EXTENSION IF NOT EXISTS citext;

-- Update profiles table to use citext for email
ALTER TABLE public.profiles 
ALTER COLUMN email TYPE citext;

-- Update access_requests table to use citext for email
ALTER TABLE public.access_requests 
ALTER COLUMN email TYPE citext;

-- Add index on email for faster lookups (e.g. during login/reset)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Improve handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role_val public.app_role;
  raw_role text;
  final_name text;
  final_email citext;
  req_unit text;
  req_perm_level text;
  is_auto_approved boolean := false;
BEGIN
  -- Normalize email (citext handles case, but COALESCE is still good)
  final_email := COALESCE(NEW.email, 'unknown@example.com');
  
  final_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(final_email::text, '@', 1),
    'Novo Usuário'
  );
  
  req_unit := NEW.raw_user_meta_data->>'requested_unit';
  raw_role := NEW.raw_user_meta_data->>'requested_role';

  -- Logic for Auto-Approval
  IF final_email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
    req_perm_level := 'admin_geral';
    req_unit := 'Evento Geral do Grupo';
    raw_role := 'admin';
    is_auto_approved := true;
  ELSIF final_email LIKE '%@anabrasil.org' THEN
    req_perm_level := COALESCE(req_perm_level, 'visualizador');
    req_unit := COALESCE(req_unit, 'Evento Geral do Grupo');
    raw_role := COALESCE(raw_role, 'viewer');
    is_auto_approved := true;
  END IF;

  -- Default permission levels based on role
  IF req_perm_level IS NULL THEN
    IF raw_role = 'admin' THEN
      req_perm_level := 'admin_geral';
    ELSIF raw_role = 'editor' THEN
      req_perm_level := 'gestor_unidade';
    ELSE
      req_perm_level := 'visualizador';
    END IF;
  END IF;

  -- Default units
  IF req_perm_level = 'admin_geral' THEN
    req_unit := 'Evento Geral do Grupo';
  ELSIF req_perm_level = 'gestor_unidade' AND (req_unit IS NULL OR req_unit = 'Evento Geral do Grupo') THEN
    req_unit := 'DIC';
  ELSIF req_unit IS NULL THEN
    req_unit := 'Evento Geral do Grupo';
  END IF;

  -- Create or update profile
  -- Note: is_active is now FALSE by default for non-auto-approved users
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level, is_active)
  VALUES (NEW.id, final_email, final_name, req_unit, req_perm_level, is_auto_approved)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    is_active = CASE WHEN is_auto_approved THEN true ELSE profiles.is_active END,
    updated_at = now();

  -- Determine role value
  IF raw_role IS NOT NULL AND raw_role IN ('admin', 'editor', 'viewer') THEN
    requested_role_val := raw_role::public.app_role;
  ELSE
    requested_role_val := 'viewer'::public.app_role;
  END IF;

  -- Assign role if auto-approved
  IF is_auto_approved THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role_val)
    ON CONFLICT (user_id) DO UPDATE SET 
      role = EXCLUDED.role,
      updated_at = now();
  END IF;

  -- Create or update access request
  INSERT INTO public.access_requests (
    user_id, email, name, requested_role, requested_unit, requested_permission_level, status
  )
  VALUES (
    NEW.id, 
    final_email, 
    final_name, 
    requested_role_val, 
    req_unit, 
    req_perm_level, 
    CASE WHEN is_auto_approved THEN 'approved'::text ELSE 'pending'::text END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    requested_at = now(),
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    requested_role = EXCLUDED.requested_role,
    requested_unit = EXCLUDED.requested_unit,
    requested_permission_level = EXCLUDED.requested_permission_level,
    status = CASE WHEN is_auto_approved THEN 'approved'::text ELSE access_requests.status END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
