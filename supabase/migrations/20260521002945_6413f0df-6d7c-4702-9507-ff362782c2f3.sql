ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_in_banner BOOLEAN DEFAULT false;

-- If we want some events to be in the banner by default for existing data (optional)
-- UPDATE public.events SET show_in_banner = true WHERE banner_url_desktop IS NOT NULL OR banner_url_mobile IS NOT NULL;
