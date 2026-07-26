
CREATE OR REPLACE FUNCTION public.validate_booking_extras_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_settings%ROWTYPE;
  v_size int;
  v_price_to_firm int;
  v_guest int;
  v_fee int;
  v_qty int;
BEGIN
  -- Admins bypass recomputation (can set arbitrary values, e.g. reconciliation)
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO s FROM public.app_settings WHERE id = 1;

  v_qty := GREATEST(COALESCE(NEW.quantity, 1), 1);
  NEW.quantity := v_qty;

  IF NEW.service_type = 'cleaning' THEN
    -- Get cabin size via booking
    SELECT c.size_sqm INTO v_size
    FROM public.bookings b
    JOIN public.cabins c ON c.id = b.cabin_id
    WHERE b.id = NEW.booking_id;

    IF v_size IS NULL THEN
      RAISE EXCEPTION 'Cannot determine cabin size for cleaning price';
    END IF;

    IF NEW.service_provider_id IS NULL THEN
      RAISE EXCEPTION 'Cleaning extras require a service_provider_id';
    END IF;

    SELECT cfp.price_to_firm INTO v_price_to_firm
    FROM public.cleaning_firm_prices cfp
    JOIN public.cleaning_firms cf ON cf.id = cfp.firm_id
    WHERE cfp.firm_id = NEW.service_provider_id
      AND cf.is_active = true
      AND cfp.min_sqm <= v_size
      AND cfp.max_sqm >= v_size
    ORDER BY cfp.price_to_firm ASC
    LIMIT 1;

    IF v_price_to_firm IS NULL THEN
      RAISE EXCEPTION 'No cleaning price found for firm % and size % sqm', NEW.service_provider_id, v_size;
    END IF;

    v_guest := ROUND(v_price_to_firm * (1 + COALESCE(s.cleaning_markup_percent, 25) / 100.0) / 100.0)::int * 100;
    NEW.quantity := 1;
    NEW.cost_price := v_price_to_firm;
    NEW.guest_price := v_guest;
    NEW.platform_fee := v_guest - v_price_to_firm;

  ELSIF NEW.service_type = 'groceries' THEN
    NEW.quantity := 1;
    NEW.cost_price := 0;
    NEW.guest_price := COALESCE(s.grocery_delivery_fee, 24900);
    NEW.platform_fee := NEW.guest_price;

  ELSIF NEW.service_type = 'firewood' THEN
    v_guest := 15000 * v_qty;
    v_fee := ROUND(v_guest * COALESCE(s.firewood_markup_percent, 20) / 100.0 / 100.0)::int * 100;
    NEW.cost_price := v_guest - v_fee;
    NEW.guest_price := v_guest;
    NEW.platform_fee := v_fee;

  ELSIF NEW.service_type = 'linen' THEN
    v_guest := 29000 * v_qty;
    v_fee := ROUND(v_guest * COALESCE(s.linen_markup_percent, 20) / 100.0 / 100.0)::int * 100;
    NEW.cost_price := v_guest - v_fee;
    NEW.guest_price := v_guest;
    NEW.platform_fee := v_fee;

  ELSE
    RAISE EXCEPTION 'Unknown extra service_type: %', NEW.service_type;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_booking_extras_pricing ON public.booking_extras;
CREATE TRIGGER trg_validate_booking_extras_pricing
  BEFORE INSERT OR UPDATE OF service_type, service_provider_id, quantity, cost_price, guest_price, platform_fee
  ON public.booking_extras
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_extras_pricing();
