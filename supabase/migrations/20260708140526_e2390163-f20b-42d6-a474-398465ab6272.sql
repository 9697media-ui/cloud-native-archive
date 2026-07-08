CREATE OR REPLACE FUNCTION public.sync_user_role_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_permission_level text;
    current_level text;
    current_unit text;
    new_unit text;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;

    SELECT permission_level, unit INTO current_level, current_unit
    FROM public.profiles WHERE user_id = NEW.user_id;

    -- Determina o nível preservando distinções mais específicas quando o cargo é equivalente
    IF NEW.role = 'admin' THEN
        target_permission_level := 'admin_geral';
    ELSIF NEW.role IN ('editor', 'criador') THEN
        IF current_level IN ('gestor_unidade', 'eventos_parceiros', 'editor') THEN
            target_permission_level := current_level; -- mantém o nível já definido
        ELSE
            target_permission_level := 'gestor_unidade';
        END IF;
    ELSE -- viewer / usuario_padrao / outros
        IF current_level IN ('usuario_padrao', 'visualizador') THEN
            target_permission_level := current_level; -- mantém o nível já definido
        ELSE
            target_permission_level := 'usuario_padrao';
        END IF;
    END IF;

    new_unit := current_unit;
    IF NEW.role = 'admin' THEN
        new_unit := 'Administração';
    ELSIF NEW.role IN ('editor', 'criador')
          AND target_permission_level = 'gestor_unidade'
          AND (current_unit IS NULL OR current_unit = 'Administração') THEN
        new_unit := 'DIC';
    END IF;

    IF current_level IS DISTINCT FROM target_permission_level
       OR current_unit IS DISTINCT FROM new_unit
       OR current_level IS NULL THEN
        UPDATE public.profiles
        SET permission_level = target_permission_level, unit = new_unit, updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$function$;