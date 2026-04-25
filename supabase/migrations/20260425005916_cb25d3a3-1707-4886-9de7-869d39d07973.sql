-- 1. Fix search_path and optimize security functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
  SELECT role::TEXT FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_unit(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT unit FROM public.profiles WHERE user_id = _user_id;
$function$;

-- 2. Ensure all triggers and handlers have secure search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.handle_access_request_approval() SET search_path = public;
ALTER FUNCTION public.sync_profile_to_user_roles() SET search_path = public;
ALTER FUNCTION public.sync_user_role_to_profile() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Refine RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- 4. Refine RLS Policies for Events
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;
CREATE POLICY "Managers can manage their unit events" 
ON public.events 
FOR ALL
USING (
  public.is_admin(auth.uid()) OR 
  (
    public.is_manager(auth.uid()) AND 
    (unit = public.get_user_unit(auth.uid()) OR unit = 'Evento Geral do Grupo')
  )
)
WITH CHECK (
  public.is_admin(auth.uid()) OR 
  (
    public.is_manager(auth.uid()) AND 
    (unit = public.get_user_unit(auth.uid()) OR unit = 'Evento Geral do Grupo')
  )
);

-- 5. Fix potential security gap in sheet_mappings
DROP POLICY IF EXISTS "Admins and Managers can manage mappings" ON public.sheet_mappings;
CREATE POLICY "Admins and Managers can manage mappings" 
ON public.sheet_mappings 
FOR ALL 
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

-- 6. Ensure user_roles can only be managed by admins or managers (for non-admin roles)
DROP POLICY IF EXISTS "Managers can update non-admin roles" ON public.user_roles;
CREATE POLICY "Managers can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  public.is_manager(auth.uid()) AND 
  (role <> 'admin'::app_role) AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'viewer'::app_role
)
WITH CHECK (
  role <> 'admin'::app_role
);
