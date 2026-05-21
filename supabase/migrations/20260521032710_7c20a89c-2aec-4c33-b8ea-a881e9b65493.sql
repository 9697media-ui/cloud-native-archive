ALTER TABLE public.events ADD COLUMN marketing_items JSONB DEFAULT '[]'::jsonb;
