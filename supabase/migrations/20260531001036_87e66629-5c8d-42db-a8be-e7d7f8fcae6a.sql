-- Fix 1: Exclude soft-deleted events from public access
DROP POLICY IF EXISTS "Eventos públicos confirmados são visíveis publicamente" ON public.events;
CREATE POLICY "Eventos públicos confirmados são visíveis publicamente"
ON public.events
FOR SELECT
TO public
USING (status = 'confirmado'::text AND visibility = 'publico'::text AND deleted_at IS NULL);

-- Fix 2: Restrict uploads so the uploader is the owner of the object
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-attachments'::text AND owner = auth.uid());