
-- 1. Fix function search_path mutable (handle_oauth_tokens)
-- 4. Move google_refresh_token to a separate, strictly-protected table
CREATE TABLE IF NOT EXISTS public.user_google_tokens (
  user_id uuid NOT NULL PRIMARY KEY,
  refresh_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_google_tokens TO authenticated;
GRANT ALL ON public.user_google_tokens TO service_role;

ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own google token"
  ON public.user_google_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own google token"
  ON public.user_google_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- migrate existing tokens
INSERT INTO public.user_google_tokens (user_id, refresh_token)
SELECT user_id, google_refresh_token
FROM public.profiles
WHERE google_refresh_token IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token;

-- drop the exposed column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_refresh_token;

-- update function to write into the new table + fix search_path
CREATE OR REPLACE FUNCTION public.handle_oauth_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google' AND NEW.raw_app_meta_data->>'refresh_token' IS NOT NULL THEN
    INSERT INTO public.user_google_tokens (user_id, refresh_token)
    VALUES (NEW.id, NEW.raw_app_meta_data->>'refresh_token')
    ON CONFLICT (user_id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token, updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fix RLS policy always true on widget_templates
DROP POLICY IF EXISTS "Collaborative access for all authenticated users" ON public.widget_templates;

CREATE POLICY "Authenticated users can view templates"
  ON public.widget_templates FOR SELECT
  TO authenticated
  USING (true);

-- 3. Fix events_select_all blanket access
DROP POLICY IF EXISTS "events_select_all" ON public.events;

CREATE POLICY "events_select_scoped"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      visibility = 'publico'
      OR check_is_admin(auth.uid())
      OR has_unit_access(unit)
    )
  );
