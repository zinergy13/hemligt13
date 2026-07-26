-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Guest can insert review for own completed booking"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.guest_id = auth.uid()
        AND b.status = 'completed'
        AND b.cabin_id = reviews.cabin_id
    )
  );

CREATE POLICY "Guest can update own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Guest can delete own review"
  ON public.reviews FOR DELETE TO authenticated
  USING (guest_id = auth.uid());

CREATE INDEX idx_reviews_cabin ON public.reviews(cabin_id);
CREATE INDEX idx_reviews_guest ON public.reviews(guest_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Favorites
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cabin_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_favorites_cabin ON public.favorites(cabin_id);

-- Price alerts
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  area_slug text,
  region_slug text,
  max_price_per_night integer NOT NULL CHECK (max_price_per_night > 0),
  active boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (area_slug IS NOT NULL OR region_slug IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts"
  ON public.price_alerts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_price_alerts_active ON public.price_alerts(active) WHERE active = true;

CREATE TRIGGER update_price_alerts_updated_at
  BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();