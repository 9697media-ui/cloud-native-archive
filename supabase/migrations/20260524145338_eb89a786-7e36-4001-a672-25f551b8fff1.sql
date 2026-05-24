
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS check_valid_event_unit;
ALTER TABLE public.events ADD CONSTRAINT check_valid_event_unit
  CHECK (unit = ANY (ARRAY['DIC'::text, 'Nilópolis'::text, 'Santana'::text, 'Grupo ANA Brasil'::text, 'Evento Geral do Grupo'::text]));

UPDATE public.profiles SET unit = 'Grupo ANA Brasil' WHERE unit = 'Evento Geral do Grupo';
UPDATE public.profiles SET delegated_units = array_replace(delegated_units, 'Evento Geral do Grupo', 'Grupo ANA Brasil') WHERE 'Evento Geral do Grupo' = ANY(delegated_units);
UPDATE public.events SET unit = 'Grupo ANA Brasil' WHERE unit = 'Evento Geral do Grupo';
UPDATE public.audit_logs SET unit = 'Grupo ANA Brasil' WHERE unit = 'Evento Geral do Grupo';
UPDATE public.access_requests SET requested_unit = 'Grupo ANA Brasil' WHERE requested_unit = 'Evento Geral do Grupo';

ALTER TABLE public.events DROP CONSTRAINT check_valid_event_unit;
ALTER TABLE public.events ADD CONSTRAINT check_valid_event_unit
  CHECK (unit = ANY (ARRAY['DIC'::text, 'Nilópolis'::text, 'Santana'::text, 'Grupo ANA Brasil'::text]));

CREATE OR REPLACE FUNCTION public.is_manager_of_unit(_user_id uuid, _unit text)
 RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND is_active = true 
    AND (permission_level IN ('admin_geral', 'gestor_unidade', 'eventos_parceiros'))
    AND (unit = _unit OR unit = 'Grupo ANA Brasil')
  );
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_unit_by_role()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.permission_level = 'admin_geral' AND NEW.unit != 'Grupo ANA Brasil' THEN
        NEW.unit := 'Grupo ANA Brasil';
    END IF;
    IF NEW.permission_level = 'eventos_parceiros' THEN
        NEW.unit := 'Grupo ANA Brasil';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    full_name TEXT;
    is_whitelisted BOOLEAN;
    final_role public.app_role;
    final_permission_level TEXT;
    final_active BOOLEAN;
BEGIN
    is_whitelisted := LOWER(NEW.email) IN (
      'mkt@anabrasil.org','adm@anabrasil.org','admin@anabrasil.org',
      'financeiro@anabrasil.org','alyson-viana@hotmail.com'
    );
    full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário');
    IF is_whitelisted THEN
        final_role := 'admin'::public.app_role;
        final_permission_level := 'admin_geral';
        final_active := true;
    ELSE
        final_role := 'usuario_padrao'::public.app_role;
        final_permission_level := 'usuario_padrao';
        final_active := true;
    END IF;

    INSERT INTO public.profiles (user_id, email, name, is_active, unit, permission_level)
    VALUES (NEW.id, NEW.email, full_name, final_active, 
        CASE WHEN is_whitelisted THEN 'Grupo ANA Brasil' ELSE NULL END, 
        final_permission_level)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        permission_level = CASE WHEN is_whitelisted THEN 'admin_geral' ELSE public.profiles.permission_level END,
        is_active = CASE WHEN is_whitelisted THEN true ELSE public.profiles.is_active END,
        unit = CASE WHEN is_whitelisted THEN 'Grupo ANA Brasil' ELSE public.profiles.unit END;

    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, final_role)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = CASE WHEN is_whitelisted THEN 'admin'::public.app_role ELSE public.user_roles.role END;

    IF NOT is_whitelisted THEN
        INSERT INTO public.access_requests (user_id, requested_role, requested_unit, status, name, email)
        VALUES (NEW.id, final_role, NULL, 'pending', full_name, NEW.email)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    target_permission_level TEXT;
    target_unit TEXT;
BEGIN
    IF (NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
        IF NEW.requested_role = 'admin' THEN
            target_permission_level := 'admin_geral';
            target_unit := 'Grupo ANA Brasil';
        ELSIF NEW.requested_role = 'editor' THEN
            target_permission_level := 'gestor_unidade';
            target_unit := COALESCE(NEW.requested_unit, 'DIC');
        ELSE
            target_permission_level := 'usuario_padrao';
            target_unit := COALESCE(NEW.requested_unit, 'Grupo ANA Brasil');
        END IF;
        UPDATE public.profiles SET 
            permission_level = target_permission_level,
            unit = target_unit,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    target_permission_level text;
    current_level text;
    current_unit text;
    new_unit text;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    target_permission_level := CASE 
        WHEN NEW.role = 'admin' THEN 'admin_geral'
        WHEN NEW.role = 'editor' THEN 'gestor_unidade'
        ELSE 'visualizador'
    END;
    SELECT permission_level, unit INTO current_level, current_unit FROM public.profiles WHERE user_id = NEW.user_id;
    new_unit := current_unit;
    IF NEW.role = 'admin' THEN
        new_unit := 'Grupo ANA Brasil';
    ELSIF NEW.role = 'editor' AND (current_unit IS NULL OR current_unit = 'Grupo ANA Brasil') THEN
        new_unit := 'DIC';
    END IF;
    IF current_level IS DISTINCT FROM target_permission_level OR current_unit IS DISTINCT FROM new_unit OR current_level IS NULL THEN
        UPDATE public.profiles 
        SET permission_level = target_permission_level, unit = new_unit, updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$function$;
