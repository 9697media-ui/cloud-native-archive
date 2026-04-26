-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES auth.users(id),
    actor_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    unit TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.permission_level = 'admin_geral'
    )
);

CREATE POLICY "Managers can view logs of their unit"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND (
            profiles.permission_level = 'gestor' AND profiles.unit = audit_logs.unit
            OR 
            -- Check for delegated permissions in view_restrictions or similar
            (profiles.view_restrictions->>'can_view_audit' = 'true' AND (profiles.unit = audit_logs.unit OR profiles.permission_level = 'gestor'))
        )
    )
);

-- Function to handle audit logging
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_name TEXT;
    v_unit TEXT;
    v_details JSONB;
BEGIN
    -- Get actor name and unit from profiles
    SELECT name, unit INTO v_actor_name, v_unit
    FROM public.profiles
    WHERE user_id = auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_details = row_to_json(NEW)::jsonb;
        INSERT INTO public.audit_logs (actor_id, actor_name, action, entity_type, entity_id, unit, details)
        VALUES (auth.uid(), v_actor_name, 'INSERT', TG_TABLE_NAME, NEW.id, v_unit, v_details);
    ELSIF TG_OP = 'UPDATE' THEN
        v_details = jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb);
        INSERT INTO public.audit_logs (actor_id, actor_name, action, entity_type, entity_id, unit, details)
        VALUES (auth.uid(), v_actor_name, 'UPDATE', TG_TABLE_NAME, NEW.id, v_unit, v_details);
    ELSIF TG_OP = 'DELETE' THEN
        v_details = row_to_json(OLD)::jsonb;
        INSERT INTO public.audit_logs (actor_id, actor_name, action, entity_type, entity_id, unit, details)
        VALUES (auth.uid(), v_actor_name, 'DELETE', TG_TABLE_NAME, OLD.id, v_unit, v_details);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to relevant tables
CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
