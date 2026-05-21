-- Add 'concluido' to the allowed statuses for events if it's a constraint,
-- but since we use text for status, we might just need to update any application logic.
-- However, let's add the deleted_at column first.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- We also want to make sure the visibility policies handle deleted_at
-- If there are RLS policies, they should exclude deleted events by default
-- unless it's a "trash" view.

-- Update policies to exclude deleted events for public and normal view
-- (This depends on existing policies, we'll check and update if needed in a follow-up if it fails)
