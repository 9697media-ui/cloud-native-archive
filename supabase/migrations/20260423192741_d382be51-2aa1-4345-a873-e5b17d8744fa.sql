-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.access_requests;

-- Create new inclusive policies for viewing
CREATE POLICY "Any authenticated user can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Any authenticated user can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Any authenticated user can view all requests" 
ON public.access_requests 
FOR SELECT 
TO authenticated 
USING (true);