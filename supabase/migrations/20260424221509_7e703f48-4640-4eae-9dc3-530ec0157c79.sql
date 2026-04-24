-- 1. Otimizar funções de verificação de permissão
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_unit(_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit FROM public.profiles WHERE user_id = _user_id;
$$;

-- 2. Atualizar a função handle_new_user para ser mais robusta e incluir auto-aprovação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF final_email = 'mkt@anabrasil.org' THEN
    req_perm_level := 'admin_geral';
    req_unit := 'Evento Geral do Grupo';
    raw_role := 'admin';
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
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (user_id, email, name, unit, permission_level, is_active)
  VALUES (NEW.id, final_email, final_name, req_unit, req_perm_level, true)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    unit = COALESCE(profiles.unit, EXCLUDED.unit),
    permission_level = COALESCE(profiles.permission_level, EXCLUDED.permission_level),
    updated_at = now();

  -- Se auto-aprovado, já cria o cargo
  IF is_auto_approved THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  -- Determinar role para a tabela access_requests
  IF raw_role IS NOT NULL AND raw_role IN ('admin', 'editor', 'viewer') THEN
    requested_role_val := raw_role::public.app_role;
  ELSE
    requested_role_val := 'viewer'::public.app_role;
  END IF;

  -- Criar ou atualizar solicitação de acesso
  -- Nota: Removida a restrição WHERE status = 'pending' no ON CONFLICT para permitir que novas tentativas de cadastro
  -- atualizem solicitações anteriores (ex: se foi rejeitado e está tentando de novo com novos dados)
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
$$;

-- 3. Melhorar a sincronização entre Profiles e User Roles
CREATE OR REPLACE FUNCTION public.sync_profile_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_role public.app_role;
BEGIN
    -- Evitar recursão infinita
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Mapear permission_level para app_role
    target_role := CASE 
        WHEN NEW.permission_level IN ('admin', 'admin_geral') THEN 'admin'::public.app_role
        WHEN NEW.permission_level IN ('editor', 'gestor_unidade') THEN 'editor'::public.app_role
        ELSE 'viewer'::public.app_role
    END;

    -- Sincronizar para user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, target_role)
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$;

-- Garantir que a trigger de sincronização de perfis para cargos use a função correta
DROP TRIGGER IF EXISTS on_profile_permission_change ON public.profiles;
CREATE TRIGGER on_profile_permission_change
AFTER UPDATE OF permission_level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_user_roles();

-- 4. Garantir que e-mails existentes no banco estejam normalizados
UPDATE public.profiles SET email = LOWER(email);
UPDATE public.access_requests SET email = LOWER(email);
