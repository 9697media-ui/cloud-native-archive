
-- Restrict {public} role policies to {authenticated}
DROP POLICY IF EXISTS "View configs are viewable by authenticated users" ON public.view_configs;
CREATE POLICY "View configs are viewable by authenticated users"
ON public.view_configs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Managers can view unit roles" ON public.user_roles;
CREATE POLICY "Managers can view unit roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  is_manager(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = user_roles.user_id
      AND (
        profiles.unit = get_user_unit(auth.uid())
        OR profiles.unit IN (
          SELECT unnest(p2.delegated_units) FROM public.profiles p2 WHERE p2.user_id = auth.uid()
        )
      )
  )
);

-- Pin search_path on remaining functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_profile_role_sync() SET search_path = public;
ALTER FUNCTION public.handle_user_first_login() SET search_path = public;
ALTER FUNCTION public.is_manager_of_unit(uuid, text) SET search_path = public;
ALTER FUNCTION public.process_audit_log() SET search_path = public;
