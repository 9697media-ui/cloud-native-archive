ALTER TABLE public.transparency_configs ADD COLUMN IF NOT EXISTS original_folder_name TEXT;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transparency_configs TO authenticated;
GRANT ALL ON public.transparency_configs TO service_role;