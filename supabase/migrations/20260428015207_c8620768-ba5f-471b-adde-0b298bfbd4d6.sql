-- 1. App-inställningar (en rad, konfigurerbar avgift)
CREATE TABLE public.app_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  commission_per_booking integer NOT NULL DEFAULT 9900, -- 99 kr i öre
  currency text NOT NULL DEFAULT 'SEK',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (id) VALUES (1);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- 2. Provisionsfält på bookings
ALTER TABLE public.bookings
  ADD COLUMN commission_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN commission_status text NOT NULL DEFAULT 'pending'
    CHECK (commission_status IN ('pending', 'earned', 'invoiced', 'paid', 'waived')),
  ADD COLUMN commission_earned_at timestamptz,
  ADD COLUMN commission_invoiced_at timestamptz,
  ADD COLUMN commission_paid_at timestamptz;

-- 3. Trigger: när bokning blir confirmed → sätt commission_amount från app_settings
CREATE OR REPLACE FUNCTION public.set_booking_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee integer;
BEGIN
  -- Vid confirmed: sätt commission_amount om den inte redan är satt
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT commission_per_booking INTO fee FROM public.app_settings WHERE id = 1;
    IF NEW.commission_amount = 0 THEN
      NEW.commission_amount := COALESCE(fee, 9900);
    END IF;
  END IF;

  -- Vid completed: markera commission som earned
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.commission_status = 'pending' THEN
      NEW.commission_status := 'earned';
      NEW.commission_earned_at := now();
    END IF;
  END IF;

  -- Vid declined/cancelled: markera som waived
  IF NEW.status IN ('declined', 'cancelled') AND OLD.status NOT IN ('declined', 'cancelled') THEN
    IF NEW.commission_status IN ('pending', 'earned') THEN
      NEW.commission_status := 'waived';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_booking_commission
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_commission();

-- Även för INSERT (för instant_book som skapas direkt som confirmed)
CREATE OR REPLACE FUNCTION public.set_booking_commission_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee integer;
BEGIN
  IF NEW.status = 'confirmed' AND NEW.commission_amount = 0 THEN
    SELECT commission_per_booking INTO fee FROM public.app_settings WHERE id = 1;
    NEW.commission_amount := COALESCE(fee, 9900);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_booking_commission_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_commission_insert();

-- 4. View: saldo per värd (skuld = earned + invoiced som inte är paid)
CREATE OR REPLACE VIEW public.host_balances
WITH (security_invoker = true)
AS
SELECT
  host_id,
  COUNT(*) FILTER (WHERE commission_status = 'earned') AS earned_count,
  COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'earned'), 0) AS earned_amount,
  COUNT(*) FILTER (WHERE commission_status = 'invoiced') AS invoiced_count,
  COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'invoiced'), 0) AS invoiced_amount,
  COUNT(*) FILTER (WHERE commission_status = 'paid') AS paid_count,
  COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) AS paid_amount,
  COALESCE(SUM(commission_amount) FILTER (WHERE commission_status IN ('earned', 'invoiced')), 0) AS total_owed
FROM public.bookings
GROUP BY host_id;

-- 5. Funktion för att markera completed-bokningar (anropas av cron)
CREATE OR REPLACE FUNCTION public.complete_past_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.bookings
  SET status = 'completed'
  WHERE status = 'confirmed'
    AND check_out < CURRENT_DATE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 6. Schemalägg dagligen 02:00 UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'complete-past-bookings-daily',
  '0 2 * * *',
  $$SELECT public.complete_past_bookings();$$
);