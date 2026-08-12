-- 1) Harden cabin host-update guard (owner, ical_token, slug immutable for hosts)
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

  -- Private/system-managed columns can never be changed by a host
  NEW.ical_token := OLD.ical_token;
  NEW.slug := OLD.slug;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

-- 2) Re-assert booking guard with fixed search_path (logic unchanged)
CREATE OR REPLACE FUNCTION public.guard_booking_host_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- 3) Trigger functions must not be callable through the API
REVOKE ALL ON FUNCTION public.guard_cabin_host_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_booking_host_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_cabin_host_update() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.guard_booking_host_update() TO postgres, service_role;