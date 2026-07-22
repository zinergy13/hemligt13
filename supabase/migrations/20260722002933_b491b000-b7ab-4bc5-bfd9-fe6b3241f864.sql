
-- 1) Update app_settings with new commission + margins
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS cleaning_markup_percent integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS grocery_delivery_fee integer NOT NULL DEFAULT 24900,
  ADD COLUMN IF NOT EXISTS firewood_markup_percent integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS linen_markup_percent integer NOT NULL DEFAULT 20;

UPDATE public.app_settings SET commission_per_booking = 40000 WHERE id = 1;

-- 2) Cabins: sqm
ALTER TABLE public.cabins
  ADD COLUMN IF NOT EXISTS size_sqm integer;

-- 3) cleaning_firms
CREATE TABLE public.cleaning_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  invoice_email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_firms TO authenticated;
GRANT ALL ON public.cleaning_firms TO service_role;
ALTER TABLE public.cleaning_firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cleaning firms" ON public.cleaning_firms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read active firms" ON public.cleaning_firms
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_cleaning_firms_updated
  BEFORE UPDATE ON public.cleaning_firms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) firm_areas (slug-based)
CREATE TABLE public.firm_areas (
  firm_id uuid NOT NULL REFERENCES public.cleaning_firms(id) ON DELETE CASCADE,
  area_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firm_id, area_slug)
);
CREATE INDEX idx_firm_areas_area_slug ON public.firm_areas(area_slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_areas TO authenticated;
GRANT ALL ON public.firm_areas TO service_role;
ALTER TABLE public.firm_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage firm areas" ON public.firm_areas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read firm areas" ON public.firm_areas
  FOR SELECT TO authenticated
  USING (true);

-- 5) cleaning_firm_prices
CREATE TABLE public.cleaning_firm_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.cleaning_firms(id) ON DELETE CASCADE,
  min_sqm integer NOT NULL,
  max_sqm integer NOT NULL,
  price_to_firm integer NOT NULL, -- öre
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (min_sqm >= 0 AND max_sqm >= min_sqm)
);
CREATE INDEX idx_cleaning_firm_prices_firm ON public.cleaning_firm_prices(firm_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_firm_prices TO authenticated;
GRANT ALL ON public.cleaning_firm_prices TO service_role;
ALTER TABLE public.cleaning_firm_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage firm prices" ON public.cleaning_firm_prices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read firm prices" ON public.cleaning_firm_prices
  FOR SELECT TO authenticated
  USING (true);

-- 6) booking_extras
CREATE TABLE public.booking_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('cleaning', 'groceries', 'firewood', 'linen')),
  service_provider_id uuid REFERENCES public.cleaning_firms(id),
  quantity integer NOT NULL DEFAULT 1,
  cost_price integer NOT NULL DEFAULT 0,    -- öre – vad värden betalar underleverantör
  guest_price integer NOT NULL DEFAULT 0,   -- öre – vad gästen debiteras
  platform_fee integer NOT NULL DEFAULT 0,  -- öre – Fjällhusets marginal
  grocery_order_reference text,
  grocery_delivery_time timestamptz,
  grocery_receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_extras_booking ON public.booking_extras(booking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_extras TO authenticated;
GRANT ALL ON public.booking_extras TO service_role;
ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

-- Guests can read/insert their own extras (via booking guest_id)
CREATE POLICY "Guests read own extras" ON public.booking_extras
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.guest_id = auth.uid())
  );
CREATE POLICY "Guests insert own extras" ON public.booking_extras
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.guest_id = auth.uid())
  );
CREATE POLICY "Guests update own pending extras" ON public.booking_extras
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.bookings b
                WHERE b.id = booking_id AND b.guest_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.guest_id = auth.uid())
  );

-- Hosts can read + update extras for bookings of their cabins
CREATE POLICY "Hosts read extras for their bookings" ON public.booking_extras
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.host_id = auth.uid())
  );
CREATE POLICY "Hosts update extras for their bookings" ON public.booking_extras
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.host_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id AND b.host_id = auth.uid())
  );

-- Admin full access
CREATE POLICY "Admins manage all extras" ON public.booking_extras
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_booking_extras_updated
  BEFORE UPDATE ON public.booking_extras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
