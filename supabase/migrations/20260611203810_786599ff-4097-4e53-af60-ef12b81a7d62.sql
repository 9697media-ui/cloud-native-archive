-- Garantir que a tabela existe e tem RLS habilitado
ALTER TABLE IF EXISTS public.widget_templates ENABLE ROW LEVEL SECURITY;

-- Remover quaisquer políticas restritivas anteriores para garantir um estado limpo
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own templates" ON public.widget_templates;
    DROP POLICY IF EXISTS "Users can update their own templates" ON public.widget_templates;
    DROP POLICY IF EXISTS "Users can delete their own templates" ON public.widget_templates;
    DROP POLICY IF EXISTS "Users can insert their own templates" ON public.widget_templates;
    DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.widget_templates;
    DROP POLICY IF EXISTS "Collaborative access for all authenticated users" ON public.widget_templates;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Criar a nova política de acesso total colaborativo para usuários autenticados
CREATE POLICY "Collaborative access for all authenticated users" 
ON public.widget_templates 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Garantir que a service_role também tenha acesso total (para funções de borda ou admin)
CREATE POLICY "Service role full access" 
ON public.widget_templates 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Garantir permissões explícitas para as roles
GRANT ALL ON public.widget_templates TO authenticated;
GRANT ALL ON public.widget_templates TO service_role;
