-- Update handle_new_user to be even more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_role_val public.app_role;
  raw_role text;
  final_name text;
  final_email text;
BEGIN
  -- Determine final email and name with safety fallbacks
  final_email := COALESCE(NEW.email, 'unknown@example.com');
  final_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(final_email, '@', 1),
    'Novo Usuário'
  );

  RAISE NOTICE 'Handling new user: ID=%, Email=%, Name=%', NEW.id, final_email, final_name;

  -- Create or update profile
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level)
  VALUES (
    NEW.id, 
    final_email, 
    final_name,
    NEW.raw_user_meta_data->>'requested_unit',
    COALESCE(NEW.raw_user_meta_data->>'requested_permission_level', 'visualizador')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    updated_at = now();

  -- Safely determine requested role
  raw_role := NEW.raw_user_meta_data->>'requested_role';
  
  BEGIN
    IF raw_role IS NOT NULL AND raw_role IN ('admin', 'editor', 'viewer') THEN
      requested_role_val := raw_role::public.app_role;
    ELSE
      requested_role_val := 'viewer'::public.app_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    requested_role_val := 'viewer'::public.app_role;
  END;

  -- Create or update access request
  INSERT INTO public.access_requests (
    user_id, 
    email, 
    name, 
    requested_role,
    requested_unit,
    requested_permission_level,
    status
  )
  VALUES (
    NEW.id, 
    final_email, 
    final_name,
    requested_role_val,
    NEW.raw_user_meta_data->>'requested_unit',
    NEW.raw_user_meta_data->>'requested_permission_level',
    'pending'
  )
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
