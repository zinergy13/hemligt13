-- 1. Fix search_path on mutable functions

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$$;

-- 2. Revoke anon/public EXECUTE on internal SECURITY DEFINER functions.
--    Trigger functions still fire on their tables regardless of EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_invoices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_host_new_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restrict_guest_booking_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_extras_pricing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_pricing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_wishlist_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_gift_card(text) FROM PUBLIC, anon;
-- redeem_gift_card must be callable by signed-in users only
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(text, uuid, integer) FROM PUBLIC, anon;

-- 3. Restrict app_settings SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- 4. Restrict cleaning firm + prices to admins.
--    Booking flow will use a SECURITY DEFINER helper instead of direct SELECT.
DROP POLICY IF EXISTS "Authenticated can read active firms" ON public.cleaning_firms;
CREATE POLICY "Admins can read cleaning firms"
  ON public.cleaning_firms FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can read firm prices" ON public.cleaning_firm_prices;
CREATE POLICY "Admins can read firm prices"
  ON public.cleaning_firm_prices FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Helper RPC used by booking flow to look up a cleaning match without
--    exposing wholesale price lists to every authenticated user.
CREATE OR REPLACE FUNCTION public.find_cleaning_match(_area_slug text, _size_sqm integer)
RETURNS TABLE(firm_id uuid, firm_name text, price_to_firm integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.firm_id, f.name, p.price_to_firm
  FROM public.firm_areas fa
  JOIN public.cleaning_firms f
    ON f.id = fa.firm_id AND f.is_active = true
  JOIN public.cleaning_firm_prices p
    ON p.firm_id = fa.firm_id
   AND p.min_sqm <= _size_sqm
   AND p.max_sqm >= _size_sqm
  WHERE fa.area_slug = _area_slug
    AND auth.uid() IS NOT NULL
  ORDER BY p.price_to_firm ASC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_cleaning_match(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_cleaning_match(text, integer) TO authenticated;

-- 6. Drop the broad public listing policy on cabin-images storage bucket.
--    Direct URL access still works because the bucket is public.
--    Owner-scoped policies below already allow authors to list their own files.
DROP POLICY IF EXISTS "Public read cabin-images" ON storage.objects;