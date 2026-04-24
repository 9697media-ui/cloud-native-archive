-- Create storage bucket for event attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-attachments', 'event-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-attachments
-- 1. Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-attachments');

-- 2. Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-attachments');

-- 3. Allow owners and admins to delete
CREATE POLICY "Owners and Admins can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-attachments' 
  AND (auth.uid() = owner OR public.is_admin(auth.uid()))
);

-- Cleanup redundant/duplicate policies on events table
DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
DROP POLICY IF EXISTS "Managers can insert events for their unit" ON public.events;
DROP POLICY IF EXISTS "Managers can update events of their unit" ON public.events;
DROP POLICY IF EXISTS "Managers can delete events of their unit" ON public.events;

-- Ensure we have the consolidated policies for events
-- Note: "Admins can manage all events" and "Managers can manage their unit events" already exist
-- and "Anyone can view events" already exists.
