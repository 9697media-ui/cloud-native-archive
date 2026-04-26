-- Ensure the app_role enum exists (it should, but just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer', 'usuario_padrao', 'criador');
    END IF;
END $$;

-- 1. Robust check functions
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level = 'admin_geral'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins are also managers
  IF public.check_is_admin(_uid) THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'editor'
  ) THEN
    RETURN true;
  END IF;

  -- Check profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level = 'gestor_unidade'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 2. Sync trigger
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

DROP TRIGGER IF EXISTS trigger_sync_user_role ON public.profiles;
CREATE TRIGGER trigger_sync_user_role
AFTER INSERT OR UPDATE OF permission_level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_from_profile();

-- 3. Ensure RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.check_is_manager(auth.uid()));

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.check_is_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can view relevant audit logs" ON public.audit_logs;
CREATE POLICY "Managers can view relevant audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.check_is_manager(auth.uid()));

-- 4. Fix permissions for existing admins again just to be sure
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY['mkt@anabrasil.org', 'alyson-viana@hotmail.com', 'adm@anabrasil.org'];
  admin_email TEXT;
  admin_uid UUID;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails LOOP
    SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = lower(admin_email);
    IF admin_uid IS NOT NULL THEN
      -- Update Profile
      UPDATE public.profiles 
      SET permission_level = 'admin_geral', is_active = true 
      WHERE user_id = admin_uid;
      
      -- Update Role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (admin_uid, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    END IF;
  END LOOP;
END $$;