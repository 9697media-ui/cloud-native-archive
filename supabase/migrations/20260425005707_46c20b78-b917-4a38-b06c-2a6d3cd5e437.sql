-- 1. Fix privilege escalation in handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
     
     -- Force default values for non-whitelisted users
     IF is_whitelisted THEN
         final_role := 'admin'::public.app_role;
         final_permission_level := 'admin_geral';
         final_active := true;
     ELSE
         final_role := 'viewer'::public.app_role;
         final_permission_level := 'visualizador';
         final_active := false; -- Require approval
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

     -- Create access request for non-whitelisted
     IF NOT is_whitelisted THEN
         INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
         VALUES (NEW.id, final_role, 'Evento Geral do Grupo', 'pending', full_name, NEW.email)
         ON CONFLICT (user_id) DO NOTHING;
     END IF;

     RETURN NEW;
 END;
$function$;

-- 2. Fix Loose RLS on profiles update
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin(auth.uid()));

-- 3. Harden sheet_mappings
DROP POLICY IF EXISTS "Anyone can view mappings" ON public.sheet_mappings;
CREATE POLICY "Admins and Managers can view mappings" 
ON public.sheet_mappings 
FOR SELECT 
TO authenticated
USING (is_manager(auth.uid()));

-- 4. Harden events (Assuming events should only be seen by active users or specific roles)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Active users can view events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- 5. Ensure Managers can only manage events within their unit or general group
CREATE OR REPLACE FUNCTION public.is_manager_of_unit(_user_id uuid, _unit text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND is_active = true 
    AND (permission_level IN ('admin_geral', 'gestor_unidade'))
    AND (unit = _unit OR unit = 'Evento Geral do Grupo')
  );
$function$;
