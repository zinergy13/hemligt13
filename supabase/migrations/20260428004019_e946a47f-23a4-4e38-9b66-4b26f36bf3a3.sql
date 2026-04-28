-- Drop the overly broad public SELECT policy on storage.objects for cabin-images
DROP POLICY IF EXISTS "Cabin images are publicly accessible" ON storage.objects;

-- Public access to cabin images works via the bucket's public URL endpoint
-- (no SELECT policy on storage.objects needed for public buckets to serve files via /object/public/).
-- We only allow owners to list/select their own files in storage.objects.
CREATE POLICY "Users can view their own files in cabin-images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cabin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );