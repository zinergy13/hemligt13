-- 1. instant_book on cabins
ALTER TABLE public.cabins
  ADD COLUMN IF NOT EXISTS instant_book boolean NOT NULL DEFAULT true;

-- 2. booking status enum
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM (
    'pending', 'confirmed', 'declined', 'cancelled', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'unpaid', 'authorized', 'paid', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL,
  host_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  nights integer NOT NULL,
  nightly_total integer NOT NULL,
  cleaning_fee integer NOT NULL DEFAULT 0,
  service_fee integer NOT NULL DEFAULT 0,
  total_price integer NOT NULL,
  currency text NOT NULL DEFAULT 'SEK',
  guest_message text,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_dates_chk CHECK (check_out > check_in),
  CONSTRAINT bookings_guests_chk CHECK (guests > 0),
  CONSTRAINT bookings_nights_chk CHECK (nights > 0)
);

CREATE INDEX IF NOT EXISTS bookings_cabin_dates_idx
  ON public.bookings (cabin_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_guest_idx ON public.bookings (guest_id);
CREATE INDEX IF NOT EXISTS bookings_host_idx ON public.bookings (host_id);

-- 4. Prevent overlapping confirmed/pending bookings (excluding cancelled/declined)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    cabin_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status IN ('pending','confirmed'));

-- 5. updated_at trigger
DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view their own bookings" ON public.bookings;
CREATE POLICY "Guests can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Hosts can view bookings for their cabins" ON public.bookings;
CREATE POLICY "Hosts can view bookings for their cabins"
  ON public.bookings FOR SELECT
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Guests can create their own bookings" ON public.bookings;
CREATE POLICY "Guests can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = guest_id
    AND EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = cabin_id
        AND c.host_id = bookings.host_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Hosts can update bookings for their cabins" ON public.bookings;
CREATE POLICY "Hosts can update bookings for their cabins"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Guests can cancel their own pending bookings" ON public.bookings;
CREATE POLICY "Guests can cancel their own pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = guest_id);

-- 7. Public availability view: only confirmed/pending date ranges per cabin (no PII)
CREATE OR REPLACE VIEW public.cabin_unavailable_dates
WITH (security_invoker = true) AS
SELECT cabin_id, check_in, check_out
FROM public.bookings
WHERE status IN ('pending','confirmed');

GRANT SELECT ON public.cabin_unavailable_dates TO anon, authenticated;