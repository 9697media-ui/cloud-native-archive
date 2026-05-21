ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS banner_image_desktop TEXT,
ADD COLUMN IF NOT EXISTS banner_image_mobile TEXT;