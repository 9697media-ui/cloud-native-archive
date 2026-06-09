-- Revoke execution permissions from public/anon for SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.sync_profile_permission_to_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_access_request_approval() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_first_login() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_permission_level() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_single_active_version() FROM PUBLIC;

-- Re-grant to service_role (needed for internal supabase operations/triggers)
GRANT EXECUTE ON FUNCTION public.sync_profile_permission_to_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_confirm_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_access_request_approval() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_first_login() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_from_permission_level() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_from_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_to_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_admin_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_profile_role_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_single_active_version() TO service_role;
