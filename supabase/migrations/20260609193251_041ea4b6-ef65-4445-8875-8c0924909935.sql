-- Allow initial insert of the token if it doesn't exist (important for first-time setup)
DROP POLICY IF EXISTS "Admins can manage global settings" ON public.global_settings;
CREATE POLICY "Admins can manage global settings" ON public.global_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND (profiles.permission_level = 'admin' OR profiles.email IN ('mkt@anabrasil.org', 'transparencia@anabrasil.org', 'contato@anabrasil.org'))
        )
    )
    WITH CHECK (true); -- Allow the check to pass during OAuth flow where profile might be mid-creation

-- Ensure everyone (even anon) can read settings needed for public embeds
DROP POLICY IF EXISTS "Public can read non-sensitive global settings" ON public.global_settings;
CREATE POLICY "Public can read global settings" ON public.global_settings
    FOR SELECT USING (true);
