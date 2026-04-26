-- 1. Update is_admin to be more robust, checking both tables
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
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND permission_level = 'admin_geral'
  );
END;
$$;

-- 2. Ensure is_manager is also robust
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

-- 3. Update Audit Log Access function to ensure full admin access
CREATE OR REPLACE FUNCTION public.check_audit_log_access(log_unit text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $$
 DECLARE
     _uid uuid := auth.uid();
 BEGIN
     -- Admins and Managers see everything
     IF is_admin(_uid) OR is_manager(_uid) THEN
         RETURN true;
     END IF;

     -- Standard user check
     RETURN (log_unit = get_user_unit_v2(_uid) OR log_unit = ANY(get_user_delegated_units(_uid)));
 END;
 $$;

-- 4. Fix 'events' policies - ensuring they use authenticated and is_admin/is_manager correctly
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;

CREATE POLICY "Admins can manage all events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Managers can manage their unit events" 
ON public.events 
FOR ALL 
TO authenticated 
USING (
  is_manager(auth.uid()) AND (
    unit = get_user_unit_v2(auth.uid()) OR 
    unit = 'Evento Geral do Grupo' OR
    unit = ANY(get_user_delegated_units(auth.uid()))
  )
)
WITH CHECK (
  is_manager(auth.uid()) AND (
    unit = get_user_unit_v2(auth.uid()) OR 
    unit = 'Evento Geral do Grupo' OR
    unit = ANY(get_user_delegated_units(auth.uid()))
  )
);

-- 5. Fix 'sheet_mappings' policies
DROP POLICY IF EXISTS "Admins and Managers can view mappings" ON public.sheet_mappings;
DROP POLICY IF EXISTS "Admins and Managers can manage mappings" ON public.sheet_mappings;

CREATE POLICY "Admins and Managers can view mappings" 
ON public.sheet_mappings 
FOR SELECT 
TO authenticated 
USING (is_manager(auth.uid()));

CREATE POLICY "Admins and Managers can manage mappings" 
ON public.sheet_mappings 
FOR ALL 
TO authenticated 
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- 6. Ensure 'profiles' visibility is consistent
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
CREATE POLICY "Profiles visibility" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  is_admin(auth.uid()) OR 
  auth.uid() = user_id OR
  is_manager(auth.uid())
);

-- 7. Ensure 'user_roles' visibility is consistent
DROP POLICY IF EXISTS "User roles visibility" ON public.user_roles;
CREATE POLICY "User roles visibility" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (
  is_admin(auth.uid()) OR 
  auth.uid() = user_id OR
  is_manager(auth.uid())
);
