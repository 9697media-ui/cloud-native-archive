-- First, drop dependent policies to avoid issues during function updates
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view relevant audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Unified audit log access" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers and Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Fix functions with consistent parameter names and robust logic
-- We'll use _uid consistently

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

-- Update wrapper functions to use consistent parameter names if possible,
-- but since they are already used in many places, we'll just keep the signature
-- and call the check functions.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.check_is_admin(_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.check_is_manager(_user_id);
END;
$function$;

-- Fix audit log access function to use the admin check
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
     -- Check if admin first using the robust function
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

-- Now recreate policies using the robust functions

-- Audit Logs
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
CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));

-- Profiles
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

-- Access Requests
DROP POLICY IF EXISTS "Admins and Managers can view all requests" ON public.access_requests;
CREATE POLICY "Admins and Managers can view all requests" 
ON public.access_requests 
FOR SELECT 
TO authenticated 
USING (public.check_is_manager(auth.uid()));

-- View Configs
DROP POLICY IF EXISTS "View configs are manageable by admins" ON public.view_configs;
CREATE POLICY "View configs are manageable by admins" 
ON public.view_configs 
FOR ALL 
TO authenticated 
USING (public.check_is_admin(auth.uid()))
WITH CHECK (public.check_is_admin(auth.uid()));
