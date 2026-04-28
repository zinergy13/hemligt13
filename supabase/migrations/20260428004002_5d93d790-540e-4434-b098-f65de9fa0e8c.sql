-- 1. Status enum
CREATE TYPE public.cabin_status AS ENUM ('draft', 'published', 'paused');

-- 2. Cabins table
CREATE TABLE public.cabins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  area_slug TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  bedrooms INT NOT NULL DEFAULT 1,
  beds INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  max_guests INT NOT NULL DEFAULT 2,
  price_per_night INT NOT NULL DEFAULT 0,
  cleaning_fee INT NOT NULL DEFAULT 0,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status public.cabin_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cabins_host_id ON public.cabins(host_id);
CREATE INDEX idx_cabins_area_slug ON public.cabins(area_slug);
CREATE INDEX idx_cabins_status ON public.cabins(status);

-- 3. Cabin images table
CREATE TABLE public.cabin_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabin_id UUID NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cabin_images_cabin_id ON public.cabin_images(cabin_id);

-- 4. Enable RLS
ALTER TABLE public.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_images ENABLE ROW LEVEL SECURITY;

-- 5. Cabins policies
CREATE POLICY "Published cabins are viewable by everyone"
  ON public.cabins FOR SELECT
  USING (status = 'published' OR auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts can insert their own cabins"
  ON public.cabins FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own cabins"
  ON public.cabins FOR UPDATE
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Hosts can delete their own cabins"
  ON public.cabins FOR DELETE
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

-- 6. Cabin images policies
CREATE POLICY "Images of published cabins viewable by everyone"
  ON public.cabin_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = cabin_id
        AND (c.status = 'published' OR c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Hosts can insert images for their cabins"
  ON public.cabin_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = cabin_id AND c.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update images for their cabins"
  ON public.cabin_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = cabin_id AND (c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Hosts can delete images for their cabins"
  ON public.cabin_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = cabin_id AND (c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 7. Trigger to update updated_at
CREATE TRIGGER update_cabins_updated_at
  BEFORE UPDATE ON public.cabins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cabin-images', 'cabin-images', true);

-- 9. Storage policies (folder per user: <user_id>/<cabin_id>/<file>)
CREATE POLICY "Cabin images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cabin-images');

CREATE POLICY "Users can upload to their own folder in cabin-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cabin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files in cabin-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cabin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files in cabin-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cabin-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );