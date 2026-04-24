-- Update the handle_new_user function to be more inclusive and robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role_val public.app_role;
  raw_role text;
  final_name text;
  final_email text;
  req_unit text;
  req_perm_level text;
  is_auto_approved boolean := false;
BEGIN
  -- Normalizar e-mail
  final_email := LOWER(COALESCE(NEW.email, 'unknown@example.com'));
  
  final_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(final_email, '@', 1),
    'Novo Usuário'
  );
  
  req_unit := NEW.raw_user_meta_data->>'requested_unit';
  raw_role := NEW.raw_user_meta_data->>'requested_role';

  -- Lógica de Auto-Aprovação para domínios ou e-mails específicos
  -- Admins automáticos
  IF final_email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
    req_perm_level := 'admin_geral';
    req_unit := 'Evento Geral do Grupo';
    raw_role := 'admin';
    is_auto_approved := true;
  -- Usuários do domínio anabrasil.org são auto-aprovados como visualizadores se não forem admins
  ELSIF final_email LIKE '%@anabrasil.org' THEN
    req_perm_level := COALESCE(req_perm_level, 'visualizador');
    req_unit := COALESCE(req_unit, 'Evento Geral do Grupo');
    raw_role := COALESCE(raw_role, 'viewer');
    is_auto_approved := true;
  END IF;

  -- Determinar nível de permissão baseado no cargo se não fornecido
  IF req_perm_level IS NULL THEN
    IF raw_role = 'admin' THEN
      req_perm_level := 'admin_geral';
    ELSIF raw_role = 'editor' THEN
      req_perm_level := 'gestor_unidade';
    ELSE
      req_perm_level := 'visualizador';
    END IF;
  END IF;

  -- Garantir unidade válida
  IF req_perm_level = 'admin_geral' THEN
    req_unit := 'Evento Geral do Grupo';
  ELSIF req_perm_level = 'gestor_unidade' AND (req_unit IS NULL OR req_unit = 'Evento Geral do Grupo') THEN
    req_unit := 'DIC';
  ELSIF req_unit IS NULL THEN
    req_unit := 'Evento Geral do Grupo';
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level, is_active)
  VALUES (NEW.id, final_email, final_name, req_unit, req_perm_level, true)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    is_active = true,
    updated_at = now();

  -- Determinar role para a tabela user_roles e access_requests
  IF raw_role IS NOT NULL AND raw_role IN ('admin', 'editor', 'viewer') THEN
    requested_role_val := raw_role::public.app_role;
  ELSE
    requested_role_val := 'viewer'::public.app_role;
  END IF;

  -- Se auto-aprovado, já cria o cargo
  IF is_auto_approved THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role_val)
    ON CONFLICT (user_id) DO UPDATE SET 
      role = EXCLUDED.role,
      updated_at = now();
  END IF;

  -- Criar ou atualizar solicitação de acesso
  INSERT INTO public.access_requests (
    user_id, email, name, requested_role, requested_unit, requested_permission_level, status
  )
  VALUES (
    NEW.id, 
    final_email, 
    final_name, 
    requested_role_val, 
    req_unit, 
    req_perm_level, 
    CASE WHEN is_auto_approved THEN 'approved'::text ELSE 'pending'::text END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    requested_at = now(),
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    requested_role = EXCLUDED.requested_role,
    requested_unit = EXCLUDED.requested_unit,
    requested_permission_level = EXCLUDED.requested_permission_level,
    status = EXCLUDED.status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update auto_assign_admin_role to include all 3 emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all existing profiles have an active status
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- Ensure admins are synced
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';