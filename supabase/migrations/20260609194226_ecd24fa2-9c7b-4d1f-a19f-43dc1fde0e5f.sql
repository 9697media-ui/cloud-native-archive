-- Ensure RLS is enabled
ALTER TABLE public.transparency_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage transparency configs" ON public.transparency_configs;

-- Create policy for management (Admins only)
CREATE POLICY "Admins can manage transparency configs" ON public.transparency_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND (profiles.permission_level = 'admin' OR profiles.email IN ('mkt@anabrasil.org', 'transparencia@anabrasil.org', 'contato@anabrasil.org'))
        )
    );

-- Allow public read access (for the public transparency portal)
DROP POLICY IF EXISTS "Public can view transparency configs" ON public.transparency_configs;
CREATE POLICY "Public can view transparency configs" ON public.transparency_configs
    FOR SELECT USING (true);

-- Grant permissions (just in case)
GRANT ALL ON public.transparency_configs TO authenticated;
GRANT ALL ON public.transparency_configs TO service_role;
GRANT SELECT ON public.transparency_configs TO anon;
