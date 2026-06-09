CREATE TABLE public.transparency_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transparency_configs TO authenticated;
GRANT ALL ON public.transparency_configs TO service_role;

ALTER TABLE public.transparency_configs ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage transparency configs
CREATE POLICY "Admins can manage transparency configs" ON public.transparency_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public read access (if the embed is used on public sites)
CREATE POLICY "Public can view transparency configs" ON public.transparency_configs
  FOR SELECT
  USING (true);
