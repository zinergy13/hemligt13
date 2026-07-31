-- Remove blanket SELECT and re-grant every column except the secret ical_token
REVOKE SELECT ON public.cabins FROM anon, authenticated;

GRANT SELECT (
  id, host_id, slug, title, description, area_slug, address, lat, lng,
  bedrooms, beds, bathrooms, max_guests, price_per_night, cleaning_fee,
  amenities, status, created_at, updated_at, instant_book, min_nights,
  check_in_weekday, size_sqm, title_en, title_de, description_en,
  description_de, translated_at
) ON public.cabins TO anon, authenticated;

GRANT ALL ON public.cabins TO service_role;

-- Secure accessor: hosts get their own tokens, admins get all
CREATE OR REPLACE FUNCTION public.get_my_cabin_ical_tokens()
RETURNS TABLE(cabin_id uuid, ical_token text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.ical_token
  FROM public.cabins c
  WHERE auth.uid() IS NOT NULL
    AND (c.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_cabin_ical_tokens() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_cabin_ical_tokens() TO authenticated;