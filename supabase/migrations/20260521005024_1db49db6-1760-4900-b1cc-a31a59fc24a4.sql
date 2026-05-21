ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);