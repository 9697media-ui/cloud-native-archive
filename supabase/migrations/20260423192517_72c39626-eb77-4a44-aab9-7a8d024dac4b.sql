-- Allow any authenticated user to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Everyone can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Allow any authenticated user to view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Everyone can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Allow any authenticated user to manage roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Everyone can manage roles" ON public.user_roles FOR ALL TO authenticated USING (true);

-- Allow any authenticated user to view and update access requests
DROP POLICY IF EXISTS "Admins can view all requests" ON public.access_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.access_requests;
CREATE POLICY "Everyone can view all requests" ON public.access_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can update requests" ON public.access_requests FOR UPDATE TO authenticated USING (true);
