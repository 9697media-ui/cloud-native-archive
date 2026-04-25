-- Update the handle_new_user function to also create an access request
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    requested_role_val public.app_role;
    requested_unit_val TEXT;
    full_name TEXT;
BEGIN
    -- Extract values from metadata
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    requested_unit_val := NEW.raw_user_meta_data->>'requested_unit';
    
    -- Safely cast requested_role to app_role
    BEGIN
        requested_role_val := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
    EXCEPTION WHEN OTHERS THEN
        requested_role_val := 'viewer'::public.app_role;
    END;

    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, full_name)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.profiles.name, EXCLUDED.name);
    
    -- Create access request if the user is not an auto-assigned admin
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
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Ensure all existing users without roles have a profile and an access request if needed
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email, raw_user_meta_data 
        FROM auth.users u
        WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = u.id AND ar.status = 'pending')
    LOOP
        -- Create profile
        INSERT INTO public.profiles (user_id, email, name)
        VALUES (
            user_record.id, 
            user_record.email, 
            COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1))
        )
        ON CONFLICT (user_id) DO NOTHING;

        -- Create access request if not an admin
        IF NOT (user_record.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org')) THEN
            INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
            VALUES (
                user_record.id, 
                COALESCE((user_record.raw_user_meta_data->>'requested_role')::public.app_role, 'viewer'::public.app_role),
                user_record.raw_user_meta_data->>'requested_unit',
                'pending',
                COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1)),
                user_record.email
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
