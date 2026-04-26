-- Update handle_new_user function to set usuario_padrao by default and activate new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    full_name TEXT;
    is_whitelisted BOOLEAN;
    final_role public.app_role;
    final_permission_level TEXT;
    final_active BOOLEAN;
BEGIN
    -- Check if user is in whitelist
    is_whitelisted := NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org', 'alyson-viana@hotmail.com');
    
    -- Safe metadata extraction
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    
    -- Force default values
    IF is_whitelisted THEN
        final_role := 'admin'::public.app_role;
        final_permission_level := 'admin_geral';
        final_active := true;
    ELSE
        -- Changed from 'viewer' to 'usuario_padrao' as per user request
        final_role := 'usuario_padrao'::public.app_role;
        final_permission_level := 'usuario_padrao';
        -- Now active by default but with zero permissions
        final_active := true;
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
    VALUES (
        NEW.id, 
        NEW.email, 
        full_name, 
        final_active, 
        CASE WHEN is_whitelisted THEN 'Evento Geral do Grupo' ELSE 'Pendente' END, 
        final_permission_level
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        is_active = CASE WHEN is_whitelisted THEN true ELSE public.profiles.is_active END;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, final_role)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = CASE WHEN is_whitelisted THEN 'admin'::public.app_role ELSE public.user_roles.role END;

    -- Create access request for non-whitelisted if they need more than usuario_padrao
    IF NOT is_whitelisted THEN
        INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
        VALUES (NEW.id, final_role, 'Evento Geral do Grupo', 'pending', full_name, NEW.email)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update helper functions
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor', 'criador')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Migrate existing users
UPDATE public.user_roles SET role = 'usuario_padrao' WHERE role = 'viewer';
UPDATE public.profiles SET permission_level = 'usuario_padrao' WHERE permission_level = 'visualizador';

-- Update Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view their unit logs" ON public.audit_logs;
CREATE POLICY "Managers can view their unit logs"
ON public.audit_logs
FOR SELECT
USING (
  is_admin(auth.uid()) OR (
    is_manager(auth.uid()) AND (
      unit = get_user_unit(auth.uid()) OR 
      unit IN (SELECT unnest(delegated_units) FROM profiles WHERE user_id = auth.uid())
    )
  )
);

-- Update Profiles RLS to restrict non-admins to their unit
DROP POLICY IF EXISTS "Managers can view unit profiles" ON public.profiles;
CREATE POLICY "Managers can view unit profiles"
ON public.profiles
FOR SELECT
USING (
  is_admin(auth.uid()) OR (
    is_manager(auth.uid()) AND (
      unit = get_user_unit(auth.uid()) OR 
      unit IN (SELECT unnest(delegated_units) FROM profiles WHERE user_id = auth.uid()) OR
      -- Gestores podem consultar outras unidades (view only)
      permission_level = 'gestor_unidade'
    )
  )
);

-- Note: 'gestor_unidade' permission_level seems to be the one that allows viewing other units
-- based on the user's "gestores podem consultar outras unidades" comment.

-- Update events RLS if needed to ensure creators/editors only manage their unit
-- (Existing policy "Managers can manage their unit events" already covers this if is_manager includes them)
