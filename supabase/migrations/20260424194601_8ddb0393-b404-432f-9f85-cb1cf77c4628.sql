CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  raw_role := NEW.raw_user_meta_data->>'requested_role';

  -- Determine perm level based on role if not explicitly provided
  req_perm_level := NEW.raw_user_meta_data->>'requested_permission_level';
  IF req_perm_level IS NULL THEN
    IF raw_role = 'admin' THEN
      req_perm_level := 'admin_geral';
    ELSIF raw_role = 'editor' THEN
      req_perm_level := 'gestor_unidade';
    ELSE
      req_perm_level := 'visualizador';
    END IF;
  END IF;

  -- Ensure unit is valid for the requested level
  IF req_perm_level = 'admin_geral' THEN
    req_unit := 'Evento Geral do Grupo';
  ELSIF req_perm_level = 'gestor_unidade' AND (req_unit IS NULL OR req_unit = 'Evento Geral do Grupo') THEN
    req_unit := 'DIC';
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level, is_active)
  VALUES (NEW.id, final_email, final_name, req_unit, req_perm_level, true)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    updated_at = now();

  -- Safely determine requested role for access_requests table
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
$$ LANGUAGE plpgsql SECURITY DEFINER;