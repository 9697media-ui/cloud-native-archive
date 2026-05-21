UPDATE public.events 
SET 
  start_datetime = start_datetime + interval '1 year',
  end_datetime = end_datetime + interval '1 year'
WHERE start_datetime < '2026-01-01';