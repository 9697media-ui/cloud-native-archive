-- 1. Update app_role enum to include 'usuario_padrao'
-- Since we can't easily remove 'viewer' from an existing enum, we add the new one.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'usuario_padrao';

-- 2. Update profiles table
-- Change default permission_level to 'usuario_padrao'
ALTER TABLE public.profiles 
ALTER COLUMN permission_level SET DEFAULT 'usuario_padrao';

-- Migrate existing 'visualizador' to 'usuario_padrao'
UPDATE public.profiles 
SET permission_level = 'usuario_padrao' 
WHERE permission_level = 'visualizador' OR permission_level = 'viewer';

-- 3. Update access_requests table
-- Change default requested_role to 'editor' (standard next level)
ALTER TABLE public.access_requests 
ALTER COLUMN requested_role SET DEFAULT 'editor';

-- 4. Update audit_logs RLS
-- Remove existing policies if they exist (to be safe)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view unit audit logs" ON public.audit_logs;

-- Enable RLS (should be already enabled, but just in case)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for Admins: See everything
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Policy for Managers: See logs of their unit
CREATE POLICY "Managers can view unit audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  is_manager(auth.uid()) 
  AND (unit = get_user_unit(auth.uid()))
);

-- Ensure normal users cannot see audit logs (no policy = no access)

-- 5. Helper function for "can manage unit"
-- This will help in restricting managers to their own units in various tables
CREATE OR REPLACE FUNCTION public.can_manage_unit(target_unit text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT is_admin(auth.uid()) OR (is_manager(auth.uid()) AND get_user_unit(auth.uid()) = target_unit);
$$;

-- 6. Update user_roles RLS to restrict managers to their own unit's users
-- Managers can view roles of users in their unit
DROP POLICY IF EXISTS "Managers can view unit roles" ON public.user_roles;
CREATE POLICY "Managers can view unit roles" 
ON public.user_roles 
FOR SELECT 
USING (
  is_manager(auth.uid()) 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = user_roles.user_id 
    AND profiles.unit = get_user_unit(auth.uid())
  ))
);

-- Managers can update roles of users in their unit (except for admin roles)
DROP POLICY IF EXISTS "Managers can update unit roles" ON public.user_roles;
CREATE POLICY "Managers can update unit roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  is_manager(auth.uid()) 
  AND role <> 'admin'::app_role
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = user_roles.user_id 
    AND profiles.unit = get_user_unit(auth.uid())
  ))
)
WITH CHECK (
  is_manager(auth.uid()) 
  AND role <> 'admin'::app_role
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = user_roles.user_id 
    AND profiles.unit = get_user_unit(auth.uid())
  ))
);
