-- 1. Enable public access for events (allow anon to select)
DROP POLICY IF EXISTS "Active users can view events" ON public.events;
CREATE POLICY "Public can view events" 
ON public.events 
FOR SELECT 
USING (true);

-- 2. Restrict Profile Visibility for Managers
-- Managers should only see users in their unit or delegated units
DROP POLICY IF EXISTS "Managers can view unit profiles" ON public.profiles;
CREATE POLICY "Managers can view unit profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
    is_admin(auth.uid()) OR 
    (
        is_manager(auth.uid()) AND 
        (
            unit = get_user_unit(auth.uid()) OR 
            unit = ANY(COALESCE((SELECT delegated_units FROM public.profiles WHERE user_id = auth.uid()), '{}')) OR
            user_id = auth.uid()
        )
    )
);

-- 3. Ensure 'viewer' role is no longer assigned and default is 'usuario_padrao'
-- This was mostly done in previous migration, but let's ensure the is_manager function is robust
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor', 'criador')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND permission_level IN ('admin_geral', 'gestor_unidade')
  );
END;
$$;

-- 4. Update access requests requested_role default if it was 'viewer'
ALTER TABLE public.access_requests ALTER COLUMN requested_role SET DEFAULT 'usuario_padrao'::app_role;

-- 5. Final cleanup of any remaining 'viewer' or 'visualizador' references in profiles
UPDATE public.profiles 
SET permission_level = 'usuario_padrao' 
WHERE permission_level IN ('visualizador', 'viewer');

UPDATE public.user_roles 
SET role = 'usuario_padrao' 
WHERE role = 'viewer';
