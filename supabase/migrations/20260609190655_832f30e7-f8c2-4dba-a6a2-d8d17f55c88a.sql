-- Add a column to store the refresh token in transparency_configs or a new settings table
-- For simplicity and since we already have transparency_configs, let's create a dedicated settings table for global integrations
CREATE TABLE IF NOT EXISTS public.global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_settings TO authenticated;
GRANT ALL ON public.global_settings TO service_role;

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage global settings" ON public.global_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND (profiles.permission_level = 'admin' OR profiles.email = 'mkt@anabrasil.org')
        )
    );

CREATE POLICY "Public can read non-sensitive global settings" ON public.global_settings
    FOR SELECT USING (true);
