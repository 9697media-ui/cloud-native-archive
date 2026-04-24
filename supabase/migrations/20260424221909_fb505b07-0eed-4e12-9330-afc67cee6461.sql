-- 1. Garantir que e-mails existentes estejam normalizados
UPDATE auth.users SET email = LOWER(email);
UPDATE public.profiles SET email = LOWER(email);
UPDATE public.access_requests SET email = LOWER(email);

-- 2. Confirmar e-mails de todos os usuários atuais para garantir que consigam logar
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 3. Trigger para auto-confirmar novos usuários no momento do cadastro
-- Isso evita o erro "Email not confirmed" enquanto o domínio não está configurado
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- 4. Refinar políticas de RLS para a tabela events
-- Garantir que qualquer usuário LOGADO (authenticated) possa ver os eventos
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (true);

-- 5. Garantir que gestores possam editar eventos da sua unidade ou eventos gerais
DROP POLICY IF EXISTS "Managers can manage their unit events" ON public.events;
CREATE POLICY "Managers can manage their unit events"
ON public.events
FOR ALL
TO authenticated
USING (
  is_admin(auth.uid()) OR 
  (is_manager(auth.uid()) AND (unit = get_user_unit(auth.uid()) OR unit = 'Evento Geral do Grupo'))
);

-- 6. Adicionar coluna external_id se não existir (para integrações futuras)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'external_id') THEN
    ALTER TABLE public.events ADD COLUMN external_id TEXT;
  END IF;
END $$;
