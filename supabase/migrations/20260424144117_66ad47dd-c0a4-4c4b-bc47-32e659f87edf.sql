CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_role_val public.app_role;
  raw_role text;
BEGIN
  -- Create or update profile
  INSERT INTO public.profiles (user_id, email, name, unit)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'requested_unit'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit);

  -- Safely determine requested role
  raw_role := NEW.raw_user_meta_data->>'requested_role';
  
  BEGIN
    IF raw_role IS NOT NULL THEN
      requested_role_val := raw_role::public.app_role;
    ELSE
      requested_role_val := 'viewer'::public.app_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    requested_role_val := 'viewer'::public.app_role;
  END;

  -- Create access request
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
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(requested_role_val, 'viewer'::public.app_role),
    NEW.raw_user_meta_data->>'requested_unit',
    NEW.raw_user_meta_data->>'requested_permission_level',
    'pending'
  );

  RETURN NEW;
END;
$$;