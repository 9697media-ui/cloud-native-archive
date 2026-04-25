-- 1. Limpeza de gatilhos redundantes/conflitantes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;

-- 2. Remover constraints restritivas que podem falhar no insert do perfil
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profile_unit_role;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_unit;

-- 3. Função de auto-confirmação (BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"email_confirmed": true}'::jsonb;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- 4. Função consolidada de novo usuário (AFTER INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
 AS $$
 DECLARE
     requested_role_val TEXT;
     requested_unit_val TEXT;
     full_name TEXT;
     final_role public.app_role;
     final_permission_level TEXT;
 BEGIN
     -- 1. Extração de metadados com fallbacks seguros
     full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
     requested_unit_val := NULLIF(NEW.raw_user_meta_data->>'requested_unit', '');
     requested_role_val := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'viewer');
     
     -- 2. Determinação da Role e Permission Level
     CASE requested_role_val
         WHEN 'admin' THEN 
             final_role := 'admin'::public.app_role;
             final_permission_level := 'admin_geral';
         WHEN 'editor' THEN 
             final_role := 'editor'::public.app_role;
             final_permission_level := 'gestor_unidade';
         ELSE 
             final_role := 'viewer'::public.app_role;
             final_permission_level := 'visualizador';
     END CASE;

     -- 3. Unidade padrão se estiver vazia
     IF requested_unit_val IS NULL THEN
         IF final_role = 'admin' THEN
             requested_unit_val := 'Evento Geral do Grupo';
         ELSIF final_role = 'editor' THEN
             requested_unit_val := 'DIC';
         ELSE
             requested_unit_val := 'Evento Geral do Grupo';
         END IF;
     END IF;

     -- 4. Inserir ou atualizar perfil (dentro de sub-bloco para isolar erros)
     BEGIN
         INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
         VALUES (NEW.id, NEW.email, full_name, true, requested_unit_val, final_permission_level)
         ON CONFLICT (user_id) DO UPDATE SET
             email = EXCLUDED.email,
             name = COALESCE(public.profiles.name, EXCLUDED.name),
             unit = COALESCE(public.profiles.unit, EXCLUDED.unit),
             permission_level = COALESCE(public.profiles.permission_level, EXCLUDED.permission_level);
     EXCEPTION WHEN OTHERS THEN
         RAISE WARNING 'Erro ao criar perfil para %: %', NEW.email, SQLERRM;
     END;
     
     -- 5. Atribuição de Role Automática para Admins Conhecidos
     IF NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
         BEGIN
             INSERT INTO public.user_roles (user_id, role) 
             VALUES (NEW.id, 'admin')
             ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
         EXCEPTION WHEN OTHERS THEN
             RAISE WARNING 'Erro ao atribuir role para %: %', NEW.email, SQLERRM;
         END;
     ELSE
         -- 6. Criar solicitação de acesso pendente
         BEGIN
             INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
             VALUES (NEW.id, final_role, requested_unit_val, 'pending', full_name, NEW.email)
             ON CONFLICT (user_id) DO NOTHING;
         EXCEPTION WHEN OTHERS THEN
             RAISE WARNING 'Erro ao criar solicitação para %: %', NEW.email, SQLERRM;
         END;
     END IF;

     RETURN NEW;
 EXCEPTION WHEN OTHERS THEN
     -- Fallback final para não impedir a criação do usuário no Auth
     RAISE WARNING 'Erro crítico em handle_new_user para %: %', NEW.email, SQLERRM;
     RETURN NEW;
 END;
 $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();