-- Add beta testing and UI versioning support
-- Enable beta testing flag for specific users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

-- Create a table for UI versions / releases
CREATE TABLE IF NOT EXISTS public.ui_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create a system configuration table for global settings
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ui_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Policies for ui_versions
CREATE POLICY "Admins can manage UI versions" 
ON public.ui_versions 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Everyone can view UI versions" 
ON public.ui_versions 
FOR SELECT 
USING (true);

-- Policies for system_configs
CREATE POLICY "Admins can manage system configs" 
ON public.system_configs 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Everyone can view system configs" 
ON public.system_configs 
FOR SELECT 
USING (true);

-- Initialize the system configuration for UI versioning if not exists
INSERT INTO public.system_configs (key, value)
VALUES ('current_ui_version', '{"id": "stable", "name": "Versão Inicial"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Cleanup function to keep only the last 30 versions
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
