-- Recreate functions with SECURITY DEFINER to bypass RLS internally
CREATE OR REPLACE FUNCTION public.check_is_admin(_uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _uid IS NULL THEN RETURN FALSE; END IF;

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
  IF _uid IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level IN ('gestor_unidade', 'admin_geral'))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin', 'editor', 'manager')
  );
END;
$function$;

-- Robust audit log access check
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 DECLARE
     _uid uuid := auth.uid();
     _user_level text;
     _user_unit text;
     _delegated text[];
 BEGIN
     -- Check if admin first
     IF public.check_is_admin(_uid) THEN
         RETURN true;
     END IF;

     -- Get user info for non-admins
     SELECT permission_level, unit, delegated_units 
     INTO _user_level, _user_unit, _delegated
     FROM public.profiles 
     WHERE user_id = _uid;

     -- Managers see their unit and delegated units
     IF _user_level = 'gestor_unidade' THEN
         RETURN (log_unit = _user_unit OR log_unit = ANY(_delegated));
     END IF;
     
     -- Other roles with delegated access
     IF _delegated IS NOT NULL AND array_length(_delegated, 1) > 0 THEN
         RETURN (log_unit = ANY(_delegated));
     END IF;

     RETURN false;
 END;
 $function$;

-- Drop and recreate policies to ensure consistency
-- Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Managers can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers and Admins can view profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "Managers and Admins can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.check_is_manager(auth.uid()));

-- User Roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (public.check_is_admin(auth.uid()));

-- Audit Logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Unified audit log access" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Unified audit log access" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (public.check_audit_log_access(unit));

-- Events
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Grants
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.access_requests TO authenticated;
GRANT ALL ON public.view_configs TO authenticated;
