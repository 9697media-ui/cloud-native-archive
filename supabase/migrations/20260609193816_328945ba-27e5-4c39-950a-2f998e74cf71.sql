ALTER TABLE public.global_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.global_settings TO anon, authenticated, service_role;
