-- Create a function to sync roles based on permission level
CREATE OR REPLACE FUNCTION public.sync_user_role_from_permission_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_role public.app_role;
BEGIN
  -- Map permission_level to app_role
  IF NEW.permission_level = 'admin_geral' THEN
    target_role := 'admin'::public.app_role;
  ELSIF NEW.permission_level = 'gestor_unidade' THEN
    target_role := 'editor'::public.app_role;
  ELSE
    target_role := 'viewer'::public.app_role;
  END IF;

  -- Update or insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, target_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    created_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS tr_sync_user_role ON public.profiles;
CREATE TRIGGER tr_sync_user_role
AFTER UPDATE OF permission_level ON public.profiles
FOR EACH ROW
WHEN (OLD.permission_level IS DISTINCT FROM NEW.permission_level)
EXECUTE FUNCTION public.sync_user_role_from_permission_level();

-- Also ensure it runs on insert if permission_level is set
DROP TRIGGER IF EXISTS tr_sync_user_role_insert ON public.profiles;
CREATE TRIGGER tr_sync_user_role_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.permission_level IS NOT NULL)
EXECUTE FUNCTION public.sync_user_role_from_permission_level();
