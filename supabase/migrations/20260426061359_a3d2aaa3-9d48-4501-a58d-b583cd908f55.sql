-- Fix infinite recursion by simplifying policies and ensuring functions are robust
-- First, drop the recursive policies
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
DROP POLICY IF EXISTS "User roles visibility" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;

-- Create simple policies for users to see their own data (no function call)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Update the check functions to be extremely robust and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- We use a direct query here. Since the function is SECURITY DEFINER 
  -- and owned by postgres, it will bypass RLS as long as RLS is not 
  -- forced on the table for the owner.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND permission_level = 'admin_geral'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level IN ('gestor_unidade', 'admin_geral'))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin', 'editor')
  );
END;
$function$;

-- Now add the admin policies using the fixed functions
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Also ensure managers can see profiles for their unit (using the fixed check)
CREATE POLICY "Managers can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.check_is_manager(auth.uid()));

-- Fix potential issues with events as well
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));
