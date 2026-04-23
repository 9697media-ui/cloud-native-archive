-- Add new columns to access_requests
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS requested_unit TEXT;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS requested_permission_level TEXT;

-- Update existing requests with some defaults if necessary (optional)
UPDATE public.access_requests 
SET requested_permission_level = CASE 
    WHEN requested_role::TEXT = 'admin' THEN 'admin_geral'
    WHEN requested_role::TEXT = 'editor' THEN 'gestor_unidade'
    ELSE 'visualizador'
END
WHERE requested_permission_level IS NULL;

-- Ensure RLS allows unit managers to see requests (if we want to implement that later)
-- For now, we'll keep the existing policies which are quite open based on previous migrations.
