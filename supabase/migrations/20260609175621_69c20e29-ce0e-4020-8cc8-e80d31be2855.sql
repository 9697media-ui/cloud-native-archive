-- Explicitly revoke execution permissions from 'anon' and 'authenticated' roles for SECURITY DEFINER functions
-- targeting the specific signatures identified by the linter

-- Functions with no arguments
REVOKE EXECUTE ON FUNCTION public.sync_profile_permission_to_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_permission_level() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_admin_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_profile_to_user_roles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_first_login() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_access_request_approval() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_to_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_role_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_single_active_version() FROM PUBLIC;

-- Functions with arguments
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_unit(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_manager_of_unit(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_unit(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_unit_access(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_delegated_units(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_unit_v2(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_audit_log_access(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_is_manager(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_profile_unit_access(uuid) FROM PUBLIC;

-- Re-grant to service_role (needed for internal supabase operations/triggers)
GRANT EXECUTE ON FUNCTION public.sync_profile_permission_to_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_confirm_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_from_permission_level() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_assign_admin_role() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_profile_to_user_roles() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_first_login() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_access_request_approval() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_from_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_user_role_to_profile() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_profile_role_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_single_active_version() TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_unit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_of_unit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_unit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_unit_access(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_delegated_units(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_unit_v2(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_audit_log_access(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_manager(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_profile_unit_access(uuid) TO service_role;
