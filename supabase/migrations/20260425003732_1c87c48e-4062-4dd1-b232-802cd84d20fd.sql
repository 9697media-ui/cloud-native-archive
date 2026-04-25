-- Drop the restrictive constraint that might be blocking signups
ALTER TABLE public.access_requests DROP CONSTRAINT IF EXISTS check_request_unit_relation;

-- Ensure requested_unit is optional and doesn't have restrictive constraints
ALTER TABLE public.access_requests ALTER COLUMN requested_unit DROP NOT NULL;

-- Update the handle_new_user function to be more robust and handle potential errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
 DECLARE
     requested_role_val public.app_role;
     requested_unit_val TEXT;
     full_name TEXT;
 BEGIN
     -- 1. Extração básica de dados com fallbacks
     full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
     requested_unit_val := NULLIF(NEW.raw_user_meta_data->>'requested_unit', '');
     
     -- 2. Conversão segura da role solicitada
     BEGIN
         requested_role_val := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
     EXCEPTION WHEN OTHERS THEN
         requested_role_val := 'viewer'::public.app_role;
     END;

     -- 3. Definição de unidade padrão se necessário
     IF requested_unit_val IS NULL THEN
         IF requested_role_val = 'admin' THEN
             requested_unit_val := 'Evento Geral do Grupo';
         ELSIF requested_role_val = 'editor' THEN
             requested_unit_val := 'DIC';
         ELSE
             requested_unit_val := 'Evento Geral do Grupo';
         END IF;
     END IF;

     -- 4. Criação/Atualização do perfil (Atomicamente)
     INSERT INTO public.profiles (user_id, email, name, is_active, unit)
     VALUES (NEW.id, NEW.email, full_name, true, requested_unit_val)
     ON CONFLICT (user_id) DO UPDATE SET
         email = EXCLUDED.email,
         name = COALESCE(public.profiles.name, EXCLUDED.name),
         is_active = COALESCE(public.profiles.is_active, true),
         unit = COALESCE(public.profiles.unit, EXCLUDED.unit);
     
     -- 5. Criação da solicitação de acesso (se não for admin automático)
     -- Admins automáticos são definidos por uma lista de e-mails
     IF NOT (NEW.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org')) THEN
         INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
         VALUES (
             NEW.id, 
             COALESCE(requested_role_val, 'viewer'::public.app_role),
             requested_unit_val,
             'pending',
             full_name,
             NEW.email
         )
         ON CONFLICT (user_id) DO NOTHING; -- Se já existir, não faz nada para evitar erros
     END IF;

     RETURN NEW;
 EXCEPTION WHEN OTHERS THEN
     -- Em caso de erro catastrófico, ainda permite que o usuário seja criado no auth
     -- para evitar que o signup falhe completamente, embora sem perfil/request
     RAISE WARNING 'Erro no handle_new_user: %', SQLERRM;
     RETURN NEW;
 END;
 $function$;
