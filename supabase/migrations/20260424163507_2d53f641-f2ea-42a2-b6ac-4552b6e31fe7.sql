-- First, standardize existing data
UPDATE public.profiles
SET unit = 'Evento Geral do Grupo'
WHERE permission_level = 'admin_geral';

-- For gestores, if they don't have a valid unit, we'll set a default or leave it to be fixed by admin
-- But we need them to satisfy the constraint we're about to add.
-- Let's check if there are any gestores with 'Evento Geral do Grupo' or null
UPDATE public.profiles
SET unit = 'DIC'
WHERE permission_level = 'gestor_unidade' AND (unit IS NULL OR unit = 'Evento Geral do Grupo');

-- Add check constraint for unit validation based on permission level
ALTER TABLE public.profiles 
ADD CONSTRAINT check_unit_by_permission 
CHECK (
  (permission_level = 'admin_geral' AND unit = 'Evento Geral do Grupo') OR
  (permission_level = 'gestor_unidade' AND unit IN ('DIC', 'Nilópolis', 'Santana')) OR
  (permission_level NOT IN ('admin_geral', 'gestor_unidade'))
);

-- Ensure unit is one of the allowed values if not null
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_unit
CHECK (unit IS NULL OR unit IN ('DIC', 'Nilópolis', 'Santana', 'Evento Geral do Grupo'));