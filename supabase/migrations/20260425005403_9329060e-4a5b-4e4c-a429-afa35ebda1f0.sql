-- 1. Move citext extension to extensions schema
-- First ensure extensions schema exists (usually it does in Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION citext SET SCHEMA extensions;

-- 2. Fix search_path for all public functions to prevent hijacking
-- We'll explicitly set search_path to public (and extensions if needed) for custom functions

ALTER FUNCTION public.is_admin(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.is_manager(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) SET search_path = public;
ALTER FUNCTION public.get_user_role(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.auto_confirm_user() SET search_path = public, auth;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_access_request_approval() SET search_path = public;
ALTER FUNCTION public.sync_user_role_to_profile() SET search_path = public;
ALTER FUNCTION public.sync_profile_to_user_roles() SET search_path = public;
ALTER FUNCTION public.sync_user_role_from_permission_level() SET search_path = public;
ALTER FUNCTION public.sync_profile_permission_to_role() SET search_path = public;
ALTER FUNCTION public.sync_user_unit_by_role() SET search_path = public;
ALTER FUNCTION public.auto_assign_admin_role() SET search_path = public;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;

-- 3. Restrict Storage Policies
-- Remove the broad public listing policy if it exists
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create a more restrictive policy:
-- Allow viewing if the user is authenticated OR if they know the path (but don't allow listing the whole bucket via API)
-- Note: Making a bucket 'public' in Supabase already allows unauthenticated access via the public URL.
-- This policy specifically controls access via the PostgREST API (listing/metadata).
CREATE POLICY "Public Access" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'event-attachments' 
  AND (
    auth.role() = 'authenticated' 
    OR (true) -- Keeping it available but the 'listing' concern is often about metadata exposure
  )
);

-- Actually, to prevent listing but allow reading, we can check if the user is selecting a specific file.
-- But in Supabase, listing is just a SELECT without a specific name.
-- A better approach if listing is truly not needed is to restrict SELECT to authenticated users.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'event-attachments' 
  AND auth.role() = 'authenticated'
);

-- 4. Enable RLS on any tables that might have been missed (just in case)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sheet_mappings ENABLE ROW LEVEL SECURITY;
