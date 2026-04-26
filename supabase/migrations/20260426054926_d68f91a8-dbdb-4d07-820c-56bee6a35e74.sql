-- 1. Robust check for is_admin to include profiles table
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND permission_level = 'admin_geral'
  );
END;
$$;

-- 2. Create function to sync profile changes to user_roles
CREATE OR REPLACE FUNCTION public.handle_profile_role_sync()
RETURNS TRIGGER AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Map permission_level to app_role
  IF NEW.permission_level = 'admin_geral' THEN
    _role := 'admin';
  ELSIF NEW.permission_level = 'gestor_unidade' THEN
    _role := 'editor';
  ELSE
    _role := 'viewer';
  END IF;

  -- Upsert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, _role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = _role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on profiles
DROP TRIGGER IF EXISTS on_profile_role_sync ON public.profiles;
CREATE TRIGGER on_profile_role_sync
  AFTER INSERT OR UPDATE OF permission_level ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_role_sync();

-- 4. Fix view_configs policy to use is_admin() function
DROP POLICY IF EXISTS "View configs are manageable by admins" ON public.view_configs;
CREATE POLICY "View configs are manageable by admins" 
ON public.view_configs 
FOR ALL 
USING (is_admin(auth.uid()));

-- 5. Backfill any missing user_roles based on current profiles
DO $$
DECLARE
  profile_record RECORD;
  _role public.app_role;
BEGIN
  FOR profile_record IN SELECT user_id, permission_level FROM public.profiles LOOP
    IF profile_record.permission_level = 'admin_geral' THEN
      _role := 'admin';
    ELSIF profile_record.permission_level = 'gestor_unidade' THEN
      _role := 'editor';
    ELSE
      _role := 'viewer';
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (profile_record.user_id, _role)
    ON CONFLICT (user_id) DO UPDATE
    SET role = _role;
  END LOOP;
END;
$$;
