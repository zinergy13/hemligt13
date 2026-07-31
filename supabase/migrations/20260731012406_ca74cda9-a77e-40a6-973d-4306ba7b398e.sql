-- REVIEWS
DROP POLICY IF EXISTS "Anyone can read non-hidden reviews" ON public.reviews;
CREATE POLICY "Public can read non-hidden reviews"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (hidden = false);
CREATE POLICY "Admins can read all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CABIN_SEASON_PRICES
DROP POLICY IF EXISTS "Published cabin seasons viewable" ON public.cabin_season_prices;
CREATE POLICY "Public can read seasons for published cabins"
  ON public.cabin_season_prices FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_season_prices.cabin_id AND c.status = 'published'::cabin_status));
CREATE POLICY "Hosts and admins can read own cabin seasons"
  ON public.cabin_season_prices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_season_prices.cabin_id
      AND (c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))));

-- CABIN_BLOCKED_DATES
DROP POLICY IF EXISTS "Blocked dates viewable for published cabins" ON public.cabin_blocked_dates;
CREATE POLICY "Public can read blocked dates for published cabins"
  ON public.cabin_blocked_dates FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_blocked_dates.cabin_id AND c.status = 'published'::cabin_status));
CREATE POLICY "Hosts and admins can read own blocked dates"
  ON public.cabin_blocked_dates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_blocked_dates.cabin_id
      AND (c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))));

-- BOOKINGS / HOST_INVOICES: role-based reads only for signed-in users
DROP POLICY IF EXISTS "Hosts can view bookings for their cabins" ON public.bookings;
CREATE POLICY "Hosts can view bookings for their cabins"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Hosts can view their own invoices" ON public.host_invoices;
CREATE POLICY "Hosts can view their own invoices"
  ON public.host_invoices FOR SELECT TO authenticated
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Role check is no longer needed by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;