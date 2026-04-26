-- 1. Create a more robust version of the security functions that avoid recursive lookups if possible
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check user_roles table first as it's the primary source of truth for system roles
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Fallback to profiles table, but use a direct query that avoids policy recursion 
  -- (SECURITY DEFINER already handles this, but let's be explicit)
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
    WHERE user_id = _uid AND (role = 'editor' OR role = 'admin')
  ) THEN
    RETURN true;
  END IF;

  -- Check profiles table
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level = 'gestor_unidade' OR permission_level = 'admin_geral')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 2. Ensure RLS is active and policies are clear for all core tables
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Profiles visibility"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.check_is_admin(auth.uid()) 
  OR public.check_is_manager(auth.uid())
);

CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User roles visibility" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "User roles visibility"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.check_is_admin(auth.uid())
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- AUDIT_LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view relevant audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Managers can view relevant audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.check_is_manager(auth.uid()));

-- 3. Re-sync admin status for known emails
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY['mkt@anabrasil.org', 'alyson-viana@hotmail.com', 'adm@anabrasil.org'];
  admin_email TEXT;
  admin_uid UUID;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails LOOP
    SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = lower(admin_email);
    IF admin_uid IS NOT NULL THEN
      -- Ensure Profile is correct
      INSERT INTO public.profiles (user_id, email, name, permission_level, is_active, unit)
      VALUES (admin_uid, admin_email, split_part(admin_email, '@', 1), 'admin_geral', true, 'Evento Geral do Grupo')
      ON CONFLICT (user_id) DO UPDATE 
      SET permission_level = 'admin_geral', is_active = true;
      
      -- Ensure Role is correct
      INSERT INTO public.user_roles (user_id, role)
      VALUES (admin_uid, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    END IF;
  END LOOP;
END $$;
