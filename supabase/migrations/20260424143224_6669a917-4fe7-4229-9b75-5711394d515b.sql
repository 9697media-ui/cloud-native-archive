-- Create events table to persist application events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL,
    event_type TEXT NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    has_conflict BOOLEAN DEFAULT false,
    notes TEXT,
    marketing_request BOOLEAN DEFAULT false,
    partner_involved BOOLEAN DEFAULT false,
    partner_type TEXT,
    partner_name TEXT,
    partners JSONB DEFAULT '[]'::jsonb,
    has_unit_collaboration BOOLEAN DEFAULT false,
    collaborating_units JSONB DEFAULT '[]'::jsonb,
    external_collaborators JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors during re-run
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create policies for access control
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete events" 
ON public.events 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_role_val public.app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Determine requested role from metadata
  BEGIN
    requested_role_val := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    requested_role_val := 'viewer'::public.app_role;
  END;

  -- Create access request
  INSERT INTO public.access_requests (
    user_id, 
    email, 
    name, 
    requested_role,
    requested_unit,
    requested_permission_level
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(requested_role_val, 'viewer'::public.app_role),
    NEW.raw_user_meta_data->>'requested_unit',
    NEW.raw_user_meta_data->>'requested_permission_level'
  );

  RETURN NEW;
END;
$$;