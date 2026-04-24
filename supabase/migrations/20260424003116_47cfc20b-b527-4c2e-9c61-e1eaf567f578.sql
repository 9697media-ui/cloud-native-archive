-- Fix access_requests: remove permissive policies, restrict to admins
DROP POLICY IF EXISTS "Any authenticated user can view all requests" ON public.access_requests;
DROP POLICY IF EXISTS "Everyone can view all requests" ON public.access_requests;
DROP POLICY IF EXISTS "Everyone can update requests" ON public.access_requests;

CREATE POLICY "Admins can view all requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete requests"
ON public.access_requests
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix user_roles: remove permissive ALL policy, restrict to admins
DROP POLICY IF EXISTS "Everyone can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Any authenticated user can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix profiles: remove duplicate permissive SELECT policies
DROP POLICY IF EXISTS "Any authenticated user can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));