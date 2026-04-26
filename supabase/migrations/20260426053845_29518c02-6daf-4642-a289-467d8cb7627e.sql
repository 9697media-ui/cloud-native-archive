-- 1. Create or update core helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_delegated_units(_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((SELECT delegated_units FROM public.profiles WHERE user_id = _user_id), '{}'::text[]);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_unit_v2(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT unit FROM public.profiles WHERE user_id = _user_id);
END;
$$;

-- 2. Update is_admin and is_manager to be robust
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
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
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND permission_level IN ('admin_geral', 'gestor_unidade')
  );
END;
$$;

-- 3. Clean up and redefine policies for 'profiles' to avoid recursion
DROP POLICY IF EXISTS "Managers can view unit profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Any authenticated user can view all profiles" ON public.profiles;

CREATE POLICY "Profiles visibility" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  is_admin(auth.uid()) OR 
  auth.uid() = user_id OR
  is_manager(auth.uid()) -- Managers can see all profiles to assign units
);

-- 4. Clean up and redefine policies for 'user_roles' to avoid recursion
DROP POLICY IF EXISTS "Admins and Managers can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Any authenticated user can view all roles" ON public.user_roles;

CREATE POLICY "User roles visibility" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  is_admin(auth.uid()) OR 
  auth.uid() = user_id OR
  is_manager(auth.uid())
);

-- 5. Update Audit Log Access function to use the new helpers and ensure no recursion
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $$
 DECLARE
     _uid uuid := auth.uid();
     _is_admin boolean;
     _is_manager boolean;
     _delegated text[];
     _user_unit text;
 BEGIN
     -- Get status using SD functions to avoid recursion
     _is_admin := is_admin(_uid);
     
     IF _is_admin THEN
         RETURN true;
     END IF;

     _is_manager := is_manager(_uid);
     IF _is_manager THEN
         RETURN true; -- Managers can see all units as requested
     END IF;

     -- Standard user check
     _user_unit := get_user_unit_v2(_uid);
     _delegated := get_user_delegated_units(_uid);

     RETURN (log_unit = _user_unit OR log_unit = ANY(_delegated));
 END;
 $$;
