ALTER TABLE public.transparency_configs ADD COLUMN IF NOT EXISTS show_original_name BOOLEAN DEFAULT false;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transparency_configs TO authenticated;
GRANT ALL ON public.transparency_configs TO service_role;