-- 1. Garantir que a extensão citext esteja disponível
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Função de auto-confirmação de e-mail mais robusta
-- Usamos BEFORE INSERT para garantir que o campo esteja preenchido antes da gravação no banco
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Definimos os campos de confirmação para evitar que o Supabase bloqueie o login inicial
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  -- Algumas versões do Supabase usam metadados para controle interno de confirmação
  NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"email_confirmed": true}'::jsonb;
  RETURN NEW;
END;
$$;

-- Recriar a trigger de auto-confirmação
DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- 3. Melhorar a função de criação de perfil (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $$
 DECLARE
     requested_role_val TEXT;
     requested_unit_val TEXT;
     full_name TEXT;
     final_role public.app_role;
 BEGIN
     -- Extração segura de metadados
     full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
     requested_unit_val := NULLIF(NEW.raw_user_meta_data->>'requested_unit', '');
     requested_role_val := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'viewer');
     
     -- Conversão segura para o enum app_role
     CASE requested_role_val
         WHEN 'admin' THEN final_role := 'admin'::public.app_role;
         WHEN 'editor' THEN final_role := 'editor'::public.app_role;
         ELSE final_role := 'viewer'::public.app_role;
     END CASE;

     -- Unidade padrão baseada na role se estiver vazia
     IF requested_unit_val IS NULL THEN
         IF final_role = 'admin' THEN
             requested_unit_val := 'Evento Geral do Grupo';
         ELSIF final_role = 'editor' THEN
             requested_unit_val := 'DIC';
         ELSE
             requested_unit_val := 'Evento Geral do Grupo';
         END IF;
     END IF;

     -- Inserir ou atualizar perfil
     INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
     VALUES (
         NEW.id, 
         NEW.email, 
         full_name, 
         true, 
         requested_unit_val,
         CASE 
             WHEN final_role = 'admin' THEN 'admin_geral'
             WHEN final_role = 'editor' THEN 'gestor_unidade'
             ELSE 'visualizador'
         END
     )
     ON CONFLICT (user_id) DO UPDATE SET
         email = EXCLUDED.email,
         name = COALESCE(public.profiles.name, EXCLUDED.name),
         unit = COALESCE(public.profiles.unit, EXCLUDED.unit),
         permission_level = COALESCE(public.profiles.permission_level, EXCLUDED.permission_level);
     
     -- Se o e-mail estiver na lista de admins automáticos, já atribui a role
     IF NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org') THEN
         INSERT INTO public.user_roles (user_id, role) 
         VALUES (NEW.id, 'admin')
         ON CONFLICT (user_id, role) DO NOTHING;
     ELSE
         -- Caso contrário, cria uma solicitação de acesso pendente
         INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
         VALUES (
             NEW.id, 
             final_role,
             requested_unit_val,
             'pending',
             full_name,
             NEW.email
         )
         ON CONFLICT (user_id) DO NOTHING;
     END IF;

     RETURN NEW;
 EXCEPTION WHEN OTHERS THEN
     -- Em caso de erro, apenas registra o aviso mas permite a criação do usuário no auth
     RAISE WARNING 'Erro em handle_new_user para o email %: %', NEW.email, SQLERRM;
     RETURN NEW;
 END;
 $$;

-- 4. Garantir que a trigger handle_new_user esteja corretamente vinculada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Remover quaisquer restrições que possam estar impedindo a inserção em access_requests
ALTER TABLE public.access_requests DROP CONSTRAINT IF EXISTS check_request_unit_relation;
ALTER TABLE public.access_requests ALTER COLUMN requested_unit DROP NOT NULL;
ALTER TABLE public.access_requests ALTER COLUMN requested_role SET DEFAULT 'viewer'::public.app_role;

-- 6. Garantir políticas de RLS permissivas para o próprio usuário na fase de solicitação
DROP POLICY IF EXISTS "Users can create own request" ON public.access_requests;
CREATE POLICY "Users can create own request" 
ON public.access_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own request" ON public.access_requests;
CREATE POLICY "Users can view own request" 
ON public.access_requests 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. Garantir que perfis existentes sem permission_level sejam corrigidos
UPDATE public.profiles 
SET permission_level = 'admin_geral' 
WHERE permission_level IS NULL AND user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

UPDATE public.profiles 
SET permission_level = 'gestor_unidade' 
WHERE permission_level IS NULL AND user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'editor');

UPDATE public.profiles 
SET permission_level = 'visualizador' 
WHERE permission_level IS NULL;
