CREATE OR REPLACE FUNCTION public.check_is_manager(_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _uid IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _uid AND (permission_level IN ('gestor_unidade', 'admin_geral'))
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _uid AND role IN ('admin'::public.app_role, 'editor'::public.app_role)
  );
END;
$function$;