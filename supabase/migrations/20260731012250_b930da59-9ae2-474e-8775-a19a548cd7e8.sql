-- CABINS: split public read from owner/admin read
DROP POLICY IF EXISTS "Published cabins are viewable by everyone" ON public.cabins;

CREATE POLICY "Published cabins are public"
  ON public.cabins FOR SELECT
  TO anon, authenticated
  USING (status = 'published'::cabin_status);

CREATE POLICY "Hosts can view their own cabins"
  ON public.cabins FOR SELECT
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Admins can view all cabins"
  ON public.cabins FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CABIN_IMAGES: same split
DROP POLICY IF EXISTS "Images of published cabins viewable by everyone" ON public.cabin_images;

CREATE POLICY "Images of published cabins are public"
  ON public.cabin_images FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_images.cabin_id AND c.status = 'published'::cabin_status
  ));

CREATE POLICY "Hosts can view images for their cabins"
  ON public.cabin_images FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_images.cabin_id AND c.host_id = auth.uid()
  ));

CREATE POLICY "Admins can view all cabin images"
  ON public.cabin_images FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure Data API grants for public reads
GRANT SELECT ON public.cabins TO anon, authenticated;
GRANT SELECT ON public.cabin_images TO anon, authenticated;
GRANT ALL ON public.cabins TO service_role;
GRANT ALL ON public.cabin_images TO service_role;