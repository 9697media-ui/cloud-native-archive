-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permission_level TEXT DEFAULT 'visualizador';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update permission_level based on existing user_roles if they exist
UPDATE public.profiles p
SET permission_level = CASE 
    WHEN ur.role = 'admin' THEN 'admin_geral'
    WHEN ur.role = 'editor' THEN 'gestor_unidade'
    ELSE 'visualizador'
END
FROM public.user_roles ur
WHERE p.user_id = ur.user_id;

-- Comment out or delete the old user_roles logic if we want to consolidate, 
-- but better to keep it for now as the Edge Functions might depend on it.
-- We'll keep them in sync via triggers later if needed, but for now let's just add the columns.
