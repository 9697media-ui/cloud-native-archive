ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS transport_needed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS transport_vehicle text,
  ADD COLUMN IF NOT EXISTS transport_passengers integer;