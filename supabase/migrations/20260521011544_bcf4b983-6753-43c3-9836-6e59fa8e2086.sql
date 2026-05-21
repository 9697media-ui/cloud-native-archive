ALTER TABLE public.events ADD COLUMN IF NOT EXISTS use_logo_as_title BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_logo_url TEXT;