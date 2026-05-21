-- Add beta testing flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

-- Create UI Versions table for history
CREATE TABLE IF NOT EXISTS public.ui_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create System Configs table
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ui_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Policies for ui_versions
CREATE POLICY "Admins can manage UI versions" 
ON public.ui_versions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND permission_level = 'admin_geral'
    )
);

CREATE POLICY "Everyone can view UI versions" 
ON public.ui_versions 
FOR SELECT 
USING (true);

-- Policies for system_configs
CREATE POLICY "Admins can manage system configs" 
ON public.system_configs 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND permission_level = 'admin_geral'
    )
);

CREATE POLICY "Everyone can view system configs" 
ON public.system_configs 
FOR SELECT 
USING (true);

-- Initialize default UI version config
INSERT INTO public.system_configs (key, value) 
VALUES ('current_ui_version', '{"id": "stable", "name": "Versão Inicial Estável"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function to cleanup old versions (keep last 30)
CREATE OR REPLACE FUNCTION public.cleanup_old_ui_versions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.ui_versions
    WHERE id NOT IN (
        SELECT id FROM public.ui_versions
        ORDER BY created_at DESC
        LIMIT 30
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_ui_versions
AFTER INSERT ON public.ui_versions
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_ui_versions();