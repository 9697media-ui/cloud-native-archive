-- Fix infinite recursion in profiles policy
DROP POLICY IF EXISTS "Managers can view unit profiles" ON public.profiles;
CREATE POLICY "Managers can view unit profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  public.is_manager(auth.uid()) 
  AND unit = public.get_user_unit(auth.uid())
);

-- Fix potential recursion and improve performance in events policy
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;
CREATE POLICY "Managers can manage their unit events" 
ON public.events FOR ALL 
TO authenticated 
USING (
  public.is_manager(auth.uid()) 
  AND unit = public.get_user_unit(auth.uid())
)
WITH CHECK (
  public.is_manager(auth.uid()) 
  AND unit = public.get_user_unit(auth.uid())
);

-- Ensure is_admin and is_manager functions are optimized and don't trigger unnecessary RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$ 
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  ) 
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$ 
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  ) 
$$;
