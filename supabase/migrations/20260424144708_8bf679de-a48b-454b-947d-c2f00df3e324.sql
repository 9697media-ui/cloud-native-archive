-- Drop existing foreign key constraints first
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_updated_by_fkey;

-- Now change the column types
ALTER TABLE public.events ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.events ALTER COLUMN updated_by TYPE TEXT;

-- Update handle_new_user to be more robust and include permission_level
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
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'requested_unit',
    COALESCE(NEW.raw_user_meta_data->>'requested_permission_level', 'visualizador')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level);

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

  -- Create access request (using user_id for conflict check if unique, or just insert)
  -- Since we want to update if it exists, we need a unique constraint or use user_id.
  -- Assuming user_id is unique enough for a pending request.
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
  )
  ON CONFLICT (user_id) WHERE status = 'pending' DO UPDATE SET
    requested_at = now(),
    name = EXCLUDED.name,
    requested_role = EXCLUDED.requested_role,
    requested_unit = EXCLUDED.requested_unit,
    requested_permission_level = EXCLUDED.requested_permission_level;

  RETURN NEW;
END;
$$;