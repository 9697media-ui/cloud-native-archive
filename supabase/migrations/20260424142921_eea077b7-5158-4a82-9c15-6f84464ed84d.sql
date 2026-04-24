CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_role_val public.app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- Determine requested role from metadata
  BEGIN
    requested_role_val := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    requested_role_val := 'viewer'::public.app_role;
  END;

  -- Create access request
  INSERT INTO public.access_requests (user_id, email, name, requested_role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(requested_role_val, 'viewer'::public.app_role)
  );

  RETURN NEW;
END;
$function$;