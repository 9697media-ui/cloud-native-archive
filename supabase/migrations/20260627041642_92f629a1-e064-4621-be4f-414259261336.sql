ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transparency_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read global settings" ON public.global_settings;