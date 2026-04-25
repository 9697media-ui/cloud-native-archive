-- Drop existing constraint to recreate it simplified
ALTER TABLE public.access_requests DROP CONSTRAINT IF EXISTS check_request_unit_relation;

-- Add a more permissive constraint that still ensures basic logic
-- We allow any unit for any role for now to avoid blocking signups, 
-- but we'll enforce specific ones in the UI and during approval.
ALTER TABLE public.access_requests ADD CONSTRAINT check_request_unit_relation 
CHECK (
    (requested_role = 'admin' AND (requested_unit = 'Evento Geral do Grupo' OR requested_unit IS NULL)) OR
    (requested_role = 'editor') OR
    (requested_role = 'viewer')
);

-- Update the handle_new_user function to be more robust
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
    -- Extract values from metadata with fallbacks
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    
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
        -- Default to DIC if editor doesn't have a unit
        requested_unit_val := 'DIC';
    ELSIF requested_role_val = 'viewer'::public.app_role AND requested_unit_val IS NULL THEN
        -- Viewers should default to the general unit if none provided
        requested_unit_val := 'Evento Geral do Grupo';
    END IF;

    -- Create profile if it doesn't exist
    -- We use a single insert with ON CONFLICT to be atomic
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
$function$;
