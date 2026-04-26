-- 1. Sync existing admins
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE permission_level = 'admin_geral'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;

-- 2. Create a function to sync roles automatically
CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.permission_level = 'admin_geral' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  ELSIF NEW.permission_level = 'gestor_unidade' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'editor')
    ON CONFLICT (user_id) DO UPDATE SET role = 'editor';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_user_role ON public.profiles;
CREATE TRIGGER trigger_sync_user_role
AFTER INSERT OR UPDATE OF permission_level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_from_profile();

-- 4. Final check/cleanup of is_admin function to be as fast as possible
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- We now trust user_roles more because of the sync trigger
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
END;
$$;