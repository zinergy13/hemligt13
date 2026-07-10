
-- ============ Sprint 3: payment details, season pricing, iCal sync ============

-- 1) Host payout details (separate table with strict RLS)
CREATE TABLE public.host_payout_details (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  swish_number text,
  bankgiro text,
  bank_account text,
  payment_instructions text,
  is_business boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT swish_format CHECK (swish_number IS NULL OR swish_number ~ '^[0-9+\-\s]{6,20}$'),
  CONSTRAINT bankgiro_format CHECK (bankgiro IS NULL OR bankgiro ~ '^[0-9\-\s]{6,20}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_payout_details TO authenticated;
GRANT ALL ON public.host_payout_details TO service_role;

ALTER TABLE public.host_payout_details ENABLE ROW LEVEL SECURITY;

-- Host manages own details
CREATE POLICY "Host can manage own payout details"
  ON public.host_payout_details FOR ALL
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Guest can view host's payout details only when they have a confirmed booking
CREATE POLICY "Guest can view payout for confirmed bookings"
  ON public.host_payout_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.host_id = host_payout_details.host_id
        AND b.guest_id = auth.uid()
        AND b.status = 'confirmed'
    )
  );

CREATE TRIGGER set_host_payout_details_updated_at
  BEFORE UPDATE ON public.host_payout_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Cabin additions: min_nights, check_in_weekday, ical_token
ALTER TABLE public.cabins
  ADD COLUMN min_nights integer NOT NULL DEFAULT 1,
  ADD COLUMN check_in_weekday smallint,  -- null = any, 0=sun..6=sat
  ADD COLUMN ical_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE INDEX idx_cabins_ical_token ON public.cabins(ical_token);

-- 3) Season prices
CREATE TABLE public.cabin_season_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  label text NOT NULL,  -- 'lag' | 'hog' | 'topp' | custom
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_per_night integer NOT NULL CHECK (price_per_night >= 0),
  min_nights integer,  -- null = use cabin default
  weekend_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT season_date_order CHECK (end_date >= start_date)
);

CREATE INDEX idx_season_prices_cabin ON public.cabin_season_prices(cabin_id, start_date, end_date);

GRANT SELECT ON public.cabin_season_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabin_season_prices TO authenticated;
GRANT ALL ON public.cabin_season_prices TO service_role;

ALTER TABLE public.cabin_season_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published cabin seasons viewable"
  ON public.cabin_season_prices FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id
            AND (c.status = 'published' OR c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Host manages own seasons"
  ON public.cabin_season_prices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()));

-- 4) External/manual blocked dates (real table, separate from bookings view)
CREATE TABLE public.cabin_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  source text NOT NULL DEFAULT 'manual',  -- 'manual' | 'ical:<feed_id>'
  external_uid text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT block_date_order CHECK (check_out > check_in)
);

CREATE INDEX idx_blocked_dates_cabin ON public.cabin_blocked_dates(cabin_id, check_in, check_out);
CREATE UNIQUE INDEX idx_blocked_dates_source_uid ON public.cabin_blocked_dates(cabin_id, source, external_uid)
  WHERE external_uid IS NOT NULL;

GRANT SELECT ON public.cabin_blocked_dates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabin_blocked_dates TO authenticated;
GRANT ALL ON public.cabin_blocked_dates TO service_role;

ALTER TABLE public.cabin_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocked dates viewable for published cabins"
  ON public.cabin_blocked_dates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id
            AND (c.status = 'published' OR c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Host manages own blocked dates"
  ON public.cabin_blocked_dates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()));

-- 5) iCal feeds (incoming)
CREATE TABLE public.cabin_ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  url text NOT NULL,
  label text NOT NULL DEFAULT 'Extern kalender',
  active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_error text,
  last_event_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ical_feeds_cabin ON public.cabin_ical_feeds(cabin_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabin_ical_feeds TO authenticated;
GRANT ALL ON public.cabin_ical_feeds TO service_role;

ALTER TABLE public.cabin_ical_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host manages own feeds"
  ON public.cabin_ical_feeds FOR ALL
  USING (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()));

CREATE TRIGGER set_ical_feeds_updated_at
  BEFORE UPDATE ON public.cabin_ical_feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Update the unavailable-dates view to include blocked dates
CREATE OR REPLACE VIEW public.cabin_unavailable_dates AS
  SELECT cabin_id, check_in, check_out FROM public.bookings
  WHERE status IN ('pending', 'confirmed')
  UNION ALL
  SELECT cabin_id, check_in, check_out FROM public.cabin_blocked_dates;

-- 7) Backfill ical_token for existing cabins
UPDATE public.cabins SET ical_token = encode(gen_random_bytes(16), 'hex') WHERE ical_token IS NULL;
