-- Create view_configs table
CREATE TABLE public.view_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on view_configs
ALTER TABLE public.view_configs ENABLE ROW LEVEL SECURITY;

-- Policies for view_configs
CREATE POLICY "View configs are viewable by authenticated users"
ON public.view_configs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "View configs are manageable by admins"
ON public.view_configs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Add view_restrictions to profiles
ALTER TABLE public.profiles ADD COLUMN view_restrictions JSONB DEFAULT NULL;

-- Insert initial values
INSERT INTO public.view_configs (key, value) VALUES 
('enable_role_based_view', 'false'::jsonb),
('role_defaults', '{
    "admin_geral": ["DIC", "Nilópolis", "Santana", "Evento Geral do Grupo"],
    "gestor_unidade": ["DIC", "Nilópolis", "Santana", "Evento Geral do Grupo"],
    "usuario_padrao": ["DIC", "Nilópolis", "Santana", "Evento Geral do Grupo"],
    "visualizador": ["DIC", "Nilópolis", "Santana", "Evento Geral do Grupo"]
}'::jsonb);

-- Trigger for updated_at on view_configs
CREATE TRIGGER update_view_configs_updated_at
BEFORE UPDATE ON public.view_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
