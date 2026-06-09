ALTER TABLE public.transparency_configs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.transparency_configs TO authenticated, service_role;
GRANT SELECT ON public.transparency_configs TO anon;
