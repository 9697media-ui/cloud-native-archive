UPDATE public.events 
SET visibility = 'publico' 
WHERE visibility = 'público';

UPDATE public.events 
SET visibility = 'interno' 
WHERE visibility = 'interno';