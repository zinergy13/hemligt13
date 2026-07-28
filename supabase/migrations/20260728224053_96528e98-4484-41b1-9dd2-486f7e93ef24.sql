-- 1. Add escrow columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'none' CHECK (escrow_status IN ('none','holding','released','refunded','partially_refunded')),
  ADD COLUMN IF NOT EXISTS escrow_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_amount_ore integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE INDEX IF NOT EXISTS idx_bookings_escrow_release ON public.bookings(escrow_status, check_in) WHERE escrow_status = 'holding';
CREATE INDEX IF NOT EXISTS idx_bookings_checkout_session ON public.bookings(checkout_session_id) WHERE checkout_session_id IS NOT NULL;

-- 2. Function to release escrow 24h after check-in
CREATE OR REPLACE FUNCTION public.release_eligible_escrow()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count integer;
BEGIN
  UPDATE public.bookings
  SET escrow_status = 'released',
      escrow_released_at = now()
  WHERE escrow_status = 'holding'
    AND payment_status = 'paid'
    AND status IN ('confirmed','completed')
    AND check_in + INTERVAL '24 hours' <= now();
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_eligible_escrow() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_eligible_escrow() TO service_role;

-- 3. Update the restrict trigger so system-driven columns aren't guest-editable but service_role can still update
-- (service_role bypasses RLS/triggers naturally when SECURITY DEFINER isn't invoked; the trigger only fires when auth.uid() is present)
-- The existing restrict_guest_booking_updates already allows the guest to only cancel — webhook writes via service_role which sets auth.uid() to NULL. Verify by extending the early-return.
CREATE OR REPLACE FUNCTION public.restrict_guest_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF auth.uid() = OLD.host_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = OLD.guest_id THEN
    IF NEW.cabin_id IS DISTINCT FROM OLD.cabin_id
      OR NEW.host_id IS DISTINCT FROM OLD.host_id
      OR NEW.guest_id IS DISTINCT FROM OLD.guest_id
      OR NEW.check_in IS DISTINCT FROM OLD.check_in
      OR NEW.check_out IS DISTINCT FROM OLD.check_out
      OR NEW.guests IS DISTINCT FROM OLD.guests
      OR NEW.nights IS DISTINCT FROM OLD.nights
      OR NEW.nightly_total IS DISTINCT FROM OLD.nightly_total
      OR NEW.cleaning_fee IS DISTINCT FROM OLD.cleaning_fee
      OR NEW.service_fee IS DISTINCT FROM OLD.service_fee
      OR NEW.total_price IS DISTINCT FROM OLD.total_price
      OR NEW.commission_amount IS DISTINCT FROM OLD.commission_amount
      OR NEW.commission_status IS DISTINCT FROM OLD.commission_status
      OR NEW.commission_earned_at IS DISTINCT FROM OLD.commission_earned_at
      OR NEW.commission_invoiced_at IS DISTINCT FROM OLD.commission_invoiced_at
      OR NEW.commission_paid_at IS DISTINCT FROM OLD.commission_paid_at
      OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
      OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
      OR NEW.stripe_payment_intent IS DISTINCT FROM OLD.stripe_payment_intent
      OR NEW.checkout_session_id IS DISTINCT FROM OLD.checkout_session_id
      OR NEW.escrow_status IS DISTINCT FROM OLD.escrow_status
      OR NEW.escrow_released_at IS DISTINCT FROM OLD.escrow_released_at
      OR NEW.refund_amount_ore IS DISTINCT FROM OLD.refund_amount_ore
      OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
      OR NEW.host_invoice_id IS DISTINCT FROM OLD.host_invoice_id
    THEN
      RAISE EXCEPTION 'Guests can only cancel their bookings';
    END IF;
    IF NEW.status <> 'cancelled'::booking_status THEN
      RAISE EXCEPTION 'Guests can only cancel their bookings';
    END IF;
    IF OLD.status NOT IN ('pending'::booking_status, 'confirmed'::booking_status) THEN
      RAISE EXCEPTION 'Only pending or confirmed bookings can be cancelled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Cron job: release escrow every hour
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release-escrow-hourly') THEN
    PERFORM cron.unschedule('release-escrow-hourly');
  END IF;
  PERFORM cron.schedule(
    'release-escrow-hourly',
    '15 * * * *',
    $cron$SELECT public.release_eligible_escrow();$cron$
  );
END $$;