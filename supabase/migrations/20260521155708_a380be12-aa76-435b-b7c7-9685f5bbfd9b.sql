ALTER TABLE public.ui_versions
  ADD COLUMN IF NOT EXISTS commit_sha text,
  ADD COLUMN IF NOT EXISTS environment text DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS is_active_beta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active_production boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deployed_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deployed_by text;

CREATE INDEX IF NOT EXISTS idx_ui_versions_active_beta ON public.ui_versions(is_active_beta) WHERE is_active_beta = true;
CREATE INDEX IF NOT EXISTS idx_ui_versions_active_prod ON public.ui_versions(is_active_production) WHERE is_active_production = true;
CREATE INDEX IF NOT EXISTS idx_ui_versions_environment ON public.ui_versions(environment);
CREATE INDEX IF NOT EXISTS idx_ui_versions_commit_sha ON public.ui_versions(commit_sha);

-- Ensure only one active beta and one active production at a time
CREATE OR REPLACE FUNCTION public.enforce_single_active_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active_beta = true THEN
    UPDATE public.ui_versions SET is_active_beta = false WHERE id != NEW.id AND is_active_beta = true;
  END IF;
  IF NEW.is_active_production = true THEN
    UPDATE public.ui_versions SET is_active_production = false WHERE id != NEW.id AND is_active_production = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_active_version ON public.ui_versions;
CREATE TRIGGER trg_enforce_single_active_version
  BEFORE INSERT OR UPDATE ON public.ui_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_active_version();