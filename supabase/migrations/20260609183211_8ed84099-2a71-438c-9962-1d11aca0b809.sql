-- Update profiles to include google_refresh_token
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Drop existing policies to recreate them with updated logic
DROP POLICY IF EXISTS "Admins can manage transparency configs" ON public.transparency_configs;
DROP POLICY IF EXISTS "Everyone can read transparency configs" ON public.transparency_configs;

CREATE POLICY "Admins can manage transparency configs" ON public.transparency_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND (permission_level = 'admin_geral' OR email IN ('mkt@anabrasil.org', 'alyson-viana@hotmail.com', 'contato@anabrasil.org'))
        )
    );

CREATE POLICY "Everyone can read transparency configs" ON public.transparency_configs
    FOR SELECT USING (true);
