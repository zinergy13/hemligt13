
-- 1) bookings_guest_update_scope: restrict guest updates to cancellation only
CREATE OR REPLACE FUNCTION public.restrict_guest_booking_updates()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Skip enforcement for host or admin
  IF auth.uid() = OLD.host_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Only guest path remains: enforce cancel-only
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

DROP TRIGGER IF EXISTS restrict_guest_booking_updates_trg ON public.bookings;
CREATE TRIGGER restrict_guest_booking_updates_trg
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.restrict_guest_booking_updates();

-- 2) booking_price_client_trust: validate pricing server-side on INSERT
CREATE OR REPLACE FUNCTION public.validate_booking_pricing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c_price integer;
  c_cleaning integer;
  c_status cabin_status;
  c_host uuid;
  computed_nights integer;
BEGIN
  SELECT price_per_night, cleaning_fee, status, host_id
    INTO c_price, c_cleaning, c_status, c_host
  FROM public.cabins WHERE id = NEW.cabin_id;

  IF c_price IS NULL THEN
    RAISE EXCEPTION 'Cabin not found';
  END IF;
  IF c_status <> 'published'::cabin_status THEN
    RAISE EXCEPTION 'Cabin is not published';
  END IF;
  IF NEW.host_id <> c_host THEN
    RAISE EXCEPTION 'host_id does not match cabin owner';
  END IF;

  computed_nights := (NEW.check_out - NEW.check_in);
  IF computed_nights <= 0 THEN
    RAISE EXCEPTION 'Invalid date range';
  END IF;
  NEW.nights := computed_nights;

  -- Force cleaning_fee to the cabin's authoritative value
  NEW.cleaning_fee := COALESCE(c_cleaning, 0);

  -- Enforce a server-side price floor based on the cabin's base rate
  IF NEW.nightly_total < c_price * computed_nights THEN
    RAISE EXCEPTION 'nightly_total (%) is below cabin minimum (%)',
      NEW.nightly_total, c_price * computed_nights;
  END IF;

  -- Total must equal its declared components
  IF NEW.total_price <> NEW.nightly_total + NEW.cleaning_fee + COALESCE(NEW.service_fee, 0) THEN
    RAISE EXCEPTION 'total_price does not match nightly_total + cleaning_fee + service_fee';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_booking_pricing_trg ON public.bookings;
CREATE TRIGGER validate_booking_pricing_trg
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_pricing();

-- 3) cabin_images bucket public read policy on storage.objects
DROP POLICY IF EXISTS "Public read cabin-images" ON storage.objects;
CREATE POLICY "Public read cabin-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cabin-images');

-- 4) profiles_phone_public_exposure: use column privileges + RPC for owner
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, bio, is_host, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.profiles TO service_role;

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url, bio, is_host, phone, updated_at)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

-- 5) user_roles_missing_admin_management_policy: explicit admin-only management
DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
