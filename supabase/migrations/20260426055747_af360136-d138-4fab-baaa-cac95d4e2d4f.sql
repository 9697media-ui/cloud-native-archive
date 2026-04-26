-- Update the handle_new_user function to ensure correct roles for whitelisted emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    
    -- Force default values
    IF is_whitelisted THEN
        final_role := 'admin'::public.app_role;
        final_permission_level := 'admin_geral';
        final_active := true;
    ELSE
        final_role := 'usuario_padrao'::public.app_role;
        final_permission_level := 'usuario_padrao';
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
        permission_level = CASE WHEN is_whitelisted THEN 'admin_geral' ELSE public.profiles.permission_level END,
        is_active = CASE WHEN is_whitelisted THEN true ELSE public.profiles.is_active END,
        unit = CASE WHEN is_whitelisted THEN 'Evento Geral do Grupo' ELSE public.profiles.unit END;
    
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

-- Update existing whitelisted users to ensure they have the correct roles and permissions
DO $$
DECLARE
  whitelisted_emails TEXT[] := ARRAY['mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org', 'alyson-viana@hotmail.com'];
  email_item TEXT;
  target_user_id UUID;
BEGIN
  FOREACH email_item IN ARRAY whitelisted_emails LOOP
    SELECT id INTO target_user_id FROM auth.users WHERE email = email_item;
    
    IF target_user_id IS NOT NULL THEN
      -- Ensure profile is correct
      INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
      VALUES (
        target_user_id, 
        email_item, 
        split_part(email_item, '@', 1), 
        true, 
        'Evento Geral do Grupo', 
        'admin_geral'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        permission_level = 'admin_geral',
        is_active = true,
        unit = 'Evento Geral do Grupo';
      
      -- Ensure role is correct
      INSERT INTO public.user_roles (user_id, role)
      VALUES (target_user_id, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin';
    END IF;
  END LOOP;
END $$;
