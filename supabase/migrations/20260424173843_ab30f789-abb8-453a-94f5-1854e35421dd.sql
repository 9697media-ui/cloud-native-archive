-- Add external_id to events for syncing
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

-- Create sheet_mappings table
CREATE TABLE IF NOT EXISTS public.sheet_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sheet_field TEXT NOT NULL,
    system_field TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    separator TEXT DEFAULT ' - ',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sheet_mappings
ALTER TABLE public.sheet_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for sheet_mappings
CREATE POLICY "Anyone can view mappings" 
ON public.sheet_mappings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins and Managers can manage mappings" 
ON public.sheet_mappings FOR ALL 
TO authenticated 
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

-- Trigger to update updated_at for sheet_mappings
CREATE TRIGGER update_sheet_mappings_updated_at
BEFORE UPDATE ON public.sheet_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle access request approval automatically
CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
RETURNS TRIGGER AS $$
DECLARE
    target_permission_level TEXT;
    target_unit TEXT;
BEGIN
    -- Check if status changed to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
        -- Determine permission level and unit
        IF NEW.requested_role = 'admin' THEN
            target_permission_level := 'admin_geral';
            target_unit := 'Evento Geral do Grupo';
        ELSIF NEW.requested_role = 'editor' THEN
            target_permission_level := 'gestor_unidade';
            target_unit := COALESCE(NEW.requested_unit, 'DIC'); -- Default to DIC if not specified
        ELSE
            target_permission_level := 'visualizador';
            target_unit := 'Evento Geral do Grupo';
        END IF;

        -- Update the profile
        UPDATE public.profiles
        SET 
            permission_level = target_permission_level,
            unit = target_unit,
            updated_at = now()
        WHERE user_id = NEW.user_id;

        -- The profile-to-role trigger will handle the user_roles update
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for access request approval
DROP TRIGGER IF EXISTS tr_on_access_request_approved ON public.access_requests;
CREATE TRIGGER tr_on_access_request_approved
AFTER UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_access_request_approval();