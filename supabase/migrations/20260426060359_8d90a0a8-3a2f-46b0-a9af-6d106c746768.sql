-- 1. Create robust check functions
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level = 'admin_geral'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level IN ('admin_geral', 'gestor_unidade')
  );
END;
$$;

-- 2. Update public functions to use the check functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.check_is_admin(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.check_is_manager(_user_id);
END;
$$;

-- 3. Fix RLS policies to be non-recursive
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
CREATE POLICY "Profiles visibility" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = user_id) OR 
  public.check_is_admin(auth.uid()) OR 
  public.check_is_manager(auth.uid())
);

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User roles visibility" ON public.user_roles;
CREATE POLICY "User roles visibility" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  (auth.uid() = user_id) OR 
  public.check_is_admin(auth.uid()) OR 
  public.check_is_manager(auth.uid())
);

-- 4. Force update existing whitelisted users
DO $$
DECLARE
  whitelisted_emails TEXT[] := ARRAY['mkt@anabrasil.org', 'adm@anabrasil.org', 'admin@anabrasil.org', 'financeiro@anabrasil.org', 'alyson-viana@hotmail.com'];
  email_item TEXT;
  target_user_id UUID;
BEGIN
  FOREACH email_item IN ARRAY whitelisted_emails LOOP
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(email_item);
    
    IF target_user_id IS NOT NULL THEN
      -- Ensure profile is correct
      INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
      VALUES (
        target_user_id, 
        email_item, 
        split_part(email_item, '@', 1), 
        true, 
        'Evento Geral do Grupo', 
        'admin_geral'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        permission_level = 'admin_geral',
        is_active = true,
        unit = 'Evento Geral do Grupo',
        updated_at = now();
      
      -- Ensure role is correct
      INSERT INTO public.user_roles (user_id, role)
      VALUES (target_user_id, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET 
        role = 'admin';
    END IF;
  END LOOP;
END $$;
