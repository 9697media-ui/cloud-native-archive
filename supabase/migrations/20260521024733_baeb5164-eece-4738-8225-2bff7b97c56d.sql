UPDATE public.events 
SET location = unit 
WHERE location IS NULL OR trim(location) = '';