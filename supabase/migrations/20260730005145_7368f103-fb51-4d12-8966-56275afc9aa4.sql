CREATE OR REPLACE FUNCTION public.can_manage_cabin_image(_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  parts text[];
  owner_folder text;
  cabin_folder text;
  cabin_uuid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN true;
  END IF;

  parts := storage.foldername(_name);
  owner_folder := parts[1];
  cabin_folder := parts[2];

  IF owner_folder IS DISTINCT FROM auth.uid()::text THEN
    RETURN false;
  END IF;

  -- If the second folder segment is a cabin id, it must be a cabin owned by the caller.
  BEGIN
    cabin_uuid := cabin_folder::uuid;
  EXCEPTION WHEN others THEN
    -- draft folder (e.g. "draft-<timestamp>"), owner folder check is sufficient
    RETURN true;
  END;

  RETURN EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_uuid AND c.host_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_cabin_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_cabin_image(text) TO authenticated;

DROP POLICY IF EXISTS "Users can upload to their own folder in cabin-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in cabin-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in cabin-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in cabin-images" ON storage.objects;

CREATE POLICY "cabin_images_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cabin-images' AND public.can_manage_cabin_image(name));

CREATE POLICY "cabin_images_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cabin-images' AND public.can_manage_cabin_image(name))
WITH CHECK (bucket_id = 'cabin-images' AND public.can_manage_cabin_image(name));

CREATE POLICY "cabin_images_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cabin-images' AND public.can_manage_cabin_image(name));

CREATE POLICY "cabin_images_select_owner"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cabin-images' AND public.can_manage_cabin_image(name));