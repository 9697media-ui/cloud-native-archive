-- 1. Fix search path and security for all security functions
ALTER FUNCTION public.check_is_admin(uuid) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.check_is_manager(uuid) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.is_manager(uuid) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.check_audit_log_access(text) SECURITY DEFINER SET search_path = public;

-- 2. Consolidate Policies for 'profiles'
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Managers can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers and Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated 
USING (public.check_is_admin(auth.uid())) WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "profiles_view_own_or_manager" ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR public.check_is_manager(auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Consolidate Policies for 'user_roles'
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can insert non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can update non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can update unit roles" ON public.user_roles;

CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated 
USING (public.check_is_admin(auth.uid())) WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "user_roles_view_own_or_manager" ON public.user_roles FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR public.check_is_manager(auth.uid()));

-- 4. Consolidate Policies for 'audit_logs'
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Unified audit log access" ON public.audit_logs;

CREATE POLICY "audit_logs_admin_all" ON public.audit_logs FOR ALL TO authenticated 
USING (public.check_is_admin(auth.uid())) WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "audit_logs_manager_select" ON public.audit_logs FOR SELECT TO authenticated 
USING (public.check_audit_log_access(unit));

-- 5. Consolidate Policies for 'events'
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Public can view events" ON public.events;

CREATE POLICY "events_admin_all" ON public.events FOR ALL TO authenticated 
USING (public.check_is_admin(auth.uid())) WITH CHECK (public.check_is_admin(auth.uid()));

CREATE POLICY "events_select_all" ON public.events FOR SELECT TO authenticated 
USING (true);

-- 6. Ensure proper grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
