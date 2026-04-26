-- Ensure whitelisted users have profiles and roles
DO $$
DECLARE
  whitelisted_emails TEXT[] := ARRAY['mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org', 'alyson-viana@hotmail.com'];
  email_item TEXT;
  target_user_id UUID;
BEGIN
  FOREACH email_item IN ARRAY whitelisted_emails LOOP
    -- Try to find the user in auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = email_item;
    
    IF target_user_id IS NOT NULL THEN
      -- Create or update profile
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
      
      -- Create or update role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (target_user_id, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin';
    END IF;
  END LOOP;
END $$;