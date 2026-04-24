-- Update the handle_new_user function to be more robust with explicit schema references
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
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name);

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

-- Create a function to sync user_roles to profiles.permission_level
CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for sync
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_profile();
