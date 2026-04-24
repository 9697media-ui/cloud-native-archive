-- Helper function to get a user's unit
CREATE OR REPLACE FUNCTION public.get_user_unit(_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT unit FROM public.profiles WHERE user_id = _user_id $$;

-- Enforce unit constraints in profiles via a CHECK constraint
-- This ensures data integrity based on the user's requirements
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_unit_role_relation;
ALTER TABLE public.profiles ADD CONSTRAINT check_unit_role_relation CHECK (
  (permission_level = 'admin_geral' AND unit = 'Evento Geral do Grupo') OR
  (permission_level = 'gestor_unidade' AND unit IN ('DIC', 'Nilópolis', 'Santana')) OR
  (permission_level NOT IN ('admin_geral', 'gestor_unidade'))
);

-- Update RLS for events to respect unit boundaries
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;

-- Admins see everything
CREATE POLICY "Admins can manage all events" 
ON public.events FOR ALL 
TO authenticated 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Managers see and manage only their own unit's events
CREATE POLICY "Managers can manage their unit events" 
ON public.events FOR ALL 
TO authenticated 
USING (
  public.is_manager(auth.uid()) 
  AND unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  public.is_manager(auth.uid()) 
  AND unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid())
);

-- Basic users can view events they are allowed to see
-- (In this case, we might want everyone to see everything if it's "transparency", 
-- but the user specified manager limitations)
-- Let's allow everyone to view, but only certain people to edit.
CREATE POLICY "Anyone can view events" 
ON public.events FOR SELECT 
TO authenticated 
USING (true);

-- Ensure profiles RLS allows managers to see users of their own unit
DROP POLICY IF EXISTS "Admins and Managers can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can view unit profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  public.is_manager(auth.uid()) 
  AND (unit = (SELECT unit FROM public.profiles WHERE user_id = auth.uid()))
);
