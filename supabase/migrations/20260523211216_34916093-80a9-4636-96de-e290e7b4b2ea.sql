-- Restrict system_configs SELECT to authenticated users
DROP POLICY IF EXISTS "Everyone can view system configs" ON public.system_configs;
CREATE POLICY "Authenticated can view system configs"
  ON public.system_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Restrict ui_versions SELECT to authenticated users
DROP POLICY IF EXISTS "Everyone can view UI versions" ON public.ui_versions;
CREATE POLICY "Authenticated can view UI versions"
  ON public.ui_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix mutable search_path on cleanup_old_ui_versions
CREATE OR REPLACE FUNCTION public.cleanup_old_ui_versions()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.ui_versions
    WHERE id NOT IN (
        SELECT id FROM public.ui_versions
        ORDER BY created_at DESC
        LIMIT 30
    );
    RETURN NULL;
END;
$function$;