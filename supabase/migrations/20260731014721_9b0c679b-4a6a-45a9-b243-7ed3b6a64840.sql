-- 1. Add WITH CHECK to host update policies
DROP POLICY IF EXISTS "Hosts can update bookings for their cabins" ON public.bookings;
CREATE POLICY "Hosts can update bookings for their cabins"
ON public.bookings
FOR UPDATE
TO authenticated
USING ((auth.uid() = host_id) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = host_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Hosts can update their own cabins" ON public.cabins;
CREATE POLICY "Hosts can update their own cabins"
ON public.cabins
FOR UPDATE
TO authenticated
USING ((auth.uid() = host_id) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = host_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Column-level guard: hosts may not rewrite financial/escrow/commission fields
CREATE OR REPLACE FUNCTION public.guard_booking_host_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / internal (no JWT) and admins are unrestricted
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.host_id IS DISTINCT FROM OLD.host_id
     OR NEW.guest_id IS DISTINCT FROM OLD.guest_id
     OR NEW.cabin_id IS DISTINCT FROM OLD.cabin_id THEN
    RAISE EXCEPTION 'Not allowed to reassign booking parties';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.escrow_status IS DISTINCT FROM OLD.escrow_status
     OR NEW.escrow_released_at IS DISTINCT FROM OLD.escrow_released_at
     OR NEW.commission_amount IS DISTINCT FROM OLD.commission_amount
     OR NEW.commission_status IS DISTINCT FROM OLD.commission_status
     OR NEW.commission_earned_at IS DISTINCT FROM OLD.commission_earned_at
     OR NEW.commission_invoiced_at IS DISTINCT FROM OLD.commission_invoiced_at
     OR NEW.commission_paid_at IS DISTINCT FROM OLD.commission_paid_at
     OR NEW.host_invoice_id IS DISTINCT FROM OLD.host_invoice_id
     OR NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.nightly_total IS DISTINCT FROM OLD.nightly_total
     OR NEW.cleaning_fee IS DISTINCT FROM OLD.cleaning_fee
     OR NEW.service_fee IS DISTINCT FROM OLD.service_fee
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.refund_amount_ore IS DISTINCT FROM OLD.refund_amount_ore
     OR NEW.refunded_at IS DISTINCT FROM OLD.refunded_at
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.stripe_payment_intent IS DISTINCT FROM OLD.stripe_payment_intent
     OR NEW.checkout_session_id IS DISTINCT FROM OLD.checkout_session_id THEN
    RAISE EXCEPTION 'Not allowed to modify payment, escrow or commission fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_booking_host_update ON public.bookings;
CREATE TRIGGER guard_booking_host_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_booking_host_update();

-- 3. Cabins: prevent ownership transfer / token rewrite by non-admins
CREATE OR REPLACE FUNCTION public.guard_cabin_host_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
    RAISE EXCEPTION 'Not allowed to change cabin owner';
  END IF;
  NEW.ical_token := OLD.ical_token;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_cabin_host_update ON public.cabins;
CREATE TRIGGER guard_cabin_host_update
BEFORE UPDATE ON public.cabins
FOR EACH ROW EXECUTE FUNCTION public.guard_cabin_host_update();

REVOKE EXECUTE ON FUNCTION public.guard_booking_host_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_cabin_host_update() FROM PUBLIC;