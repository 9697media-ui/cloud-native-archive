-- Create function to sync profile permission_level back to user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_permission_to_role()
RETURNS trigger AS $$
BEGIN
    -- Only sync if permission_level has changed
    IF (TG_OP = 'UPDATE' AND OLD.permission_level IS DISTINCT FROM NEW.permission_level) OR TG_OP = 'INSERT' THEN
        -- Map permission_level to role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.permission_level = 'admin_geral' THEN 'admin'::public.app_role
                WHEN NEW.permission_level = 'gestor_unidade' THEN 'editor'::public.app_role
                ELSE 'viewer'::public.app_role
            END
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles
DROP TRIGGER IF EXISTS on_profile_permission_change ON public.profiles;
CREATE TRIGGER on_profile_permission_change
AFTER INSERT OR UPDATE OF permission_level ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_permission_to_role();