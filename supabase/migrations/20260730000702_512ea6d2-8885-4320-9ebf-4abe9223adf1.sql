REVOKE SELECT (phone, email, address_line, postal_code, city, country, personal_number)
  ON public.profiles FROM authenticated;
REVOKE SELECT (phone, email, address_line, postal_code, city, country, personal_number)
  ON public.profiles FROM anon;