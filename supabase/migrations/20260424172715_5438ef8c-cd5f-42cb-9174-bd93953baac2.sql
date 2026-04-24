-- Helper to check if user is manager (editor or admin)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'editor')) $$;

-- Update access_requests policies
DROP POLICY IF EXISTS "Admins can view all requests" ON public.access_requests;
CREATE POLICY "Admins and Managers can view all requests" 
ON public.access_requests FOR SELECT 
TO authenticated 
USING (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "Admins can update requests" ON public.access_requests;
CREATE POLICY "Admins and Managers can update requests" 
ON public.access_requests FOR UPDATE 
TO authenticated 
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

-- Update user_roles policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins and Managers can view all roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (public.is_manager(auth.uid()));

-- For INSERT
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert any role" 
ON public.user_roles FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers can insert non-admin roles" 
ON public.user_roles FOR INSERT 
TO authenticated 
WITH CHECK (
  public.is_manager(auth.uid()) 
  AND role != 'admin'
);

-- For UPDATE
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update any role" 
ON public.user_roles FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers can update non-admin roles" 
ON public.user_roles FOR UPDATE 
TO authenticated 
USING (public.is_manager(auth.uid()) AND role != 'admin')
WITH CHECK (role != 'admin');

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and Managers can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (public.is_manager(auth.uid()));
