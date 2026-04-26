-- 1. Add 'criador' to app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'criador';

-- 2. Add 'modules' and 'delegated_units' to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS modules text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delegated_units text[] DEFAULT '{}';

-- 3. Update Audit Logs Policies to include delegated units
DROP POLICY IF EXISTS "Managers can view unit audit logs" ON public.audit_logs;
CREATE POLICY "Managers can view unit audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  is_manager(auth.uid()) 
  AND (
    unit = get_user_unit(auth.uid()) 
    OR unit = ANY(
      SELECT unnest(delegated_units) 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- 4. Update Profiles Policies to include delegated units for Managers
DROP POLICY IF EXISTS "Managers can view unit profiles" ON public.profiles;
CREATE POLICY "Managers can view unit profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_manager(auth.uid()) 
  AND (
    unit = get_user_unit(auth.uid()) 
    OR unit = ANY(
      SELECT unnest(delegated_units) 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- 5. Ensure Managers can see events of delegated units (though they see all now, this is for future proofing if we restrict select)
-- Current policy 'Active users can view events' already allows this.

-- 6. Helper function to check if user has access to a unit (manage or consult)
CREATE OR REPLACE FUNCTION public.has_unit_access(target_unit text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_admin(auth.uid()) 
  OR (
    is_manager(auth.uid()) 
    AND (
      get_user_unit(auth.uid()) = target_unit 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND target_unit = ANY(delegated_units)
      )
    )
  );
$$;

-- 7. Update user_roles policies to use the new delegation logic
DROP POLICY IF EXISTS "Managers can view unit roles" ON public.user_roles;
CREATE POLICY "Managers can view unit roles" 
ON public.user_roles 
FOR SELECT 
USING (
  is_manager(auth.uid()) 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = user_roles.user_id 
    AND (
      profiles.unit = get_user_unit(auth.uid())
      OR profiles.unit = ANY(
        SELECT unnest(delegated_units) 
        FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  ))
);
