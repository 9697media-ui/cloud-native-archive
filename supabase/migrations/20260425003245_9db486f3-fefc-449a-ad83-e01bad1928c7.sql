-- Add unique constraint to access_requests to prevent multiple requests from same user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'access_requests_user_id_key') THEN
        ALTER TABLE public.access_requests ADD CONSTRAINT access_requests_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Improve handle_new_user to be more robust
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
    
    -- Handle requested_unit: convert empty string to NULL
    requested_unit_val := NULLIF(NEW.raw_user_meta_data->>'requested_unit', '');
    
    -- Safely cast requested_role to app_role
    BEGIN
        requested_role_val := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
    EXCEPTION WHEN OTHERS THEN
        requested_role_val := 'viewer'::public.app_role;
    END;

    -- Ensure requested_unit is valid for the role before inserting
    IF requested_role_val = 'editor'::public.app_role AND requested_unit_val IS NULL THEN
        -- Default to DIC if editor doesn't have a unit (shouldn't happen with UI)
        requested_unit_val := 'DIC';
    ELSIF requested_role_val = 'viewer'::public.app_role THEN
        -- Viewers should default to the general unit
        requested_unit_val := 'Evento Geral do Grupo';
    END IF;

    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, email, name, is_active)
    VALUES (NEW.id, NEW.email, full_name, true)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(public.profiles.name, EXCLUDED.name),
        is_active = COALESCE(public.profiles.is_active, true);
    
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
        ON CONFLICT (user_id) DO UPDATE SET
            requested_role = EXCLUDED.requested_role,
            requested_unit = EXCLUDED.requested_unit,
            status = 'pending',
            name = EXCLUDED.name,
            email = EXCLUDED.email;
    END IF;

    RETURN NEW;
END;
$$;

-- Fix any existing inconsistencies
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
        -- Skip if user is an auto-assigned admin (they already have role)
        IF NOT (user_record.email IN ('mkt@anabrasil.org', 'adm@anabrasil.org', 'financeiro@anabrasil.org')) THEN
            INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
            VALUES (
                user_record.id, 
                'viewer'::public.app_role,
                'Evento Geral do Grupo',
                'pending',
                COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1)),
                user_record.email
            )
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END LOOP; -- Corrected from LOOP;
END $$;
