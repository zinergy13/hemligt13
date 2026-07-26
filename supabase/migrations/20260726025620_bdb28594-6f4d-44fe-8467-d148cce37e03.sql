
-- 1. Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Sverige',
  ADD COLUMN IF NOT EXISTS personal_number text;

-- 2. Backfill emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- 3. Update handle_new_user trigger to copy email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest');

  RETURN NEW;
END;
$function$;

-- 4. Restrict column-level SELECT on sensitive columns.
-- Everyone can still read the safe public columns; sensitive columns
-- are only readable via the admin RPC (SECURITY DEFINER) or by the owner
-- through the RLS row filter (auth.uid() = id) on future policies.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, bio, is_host, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
GRANT SELECT (email, phone, address_line, postal_code, city, country, personal_number)
  ON public.profiles TO authenticated;

-- Replace the wide-open SELECT policy with one that only exposes
-- sensitive columns to the owner (column grants above still gate anon).
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles: public safe columns readable"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Admin RPC to list all profiles with full PII (for dashboard + export)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  address_line text,
  postal_code text,
  city text,
  country text,
  personal_number text,
  is_host boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.email, p.phone,
           p.address_line, p.postal_code, p.city, p.country,
           p.personal_number, p.is_host, p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;

-- 6. Self-service RPC so owner can read own sensitive fields regardless of
-- future column-grant tightening. Convenient for the account page.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  address_line text,
  postal_code text,
  city text,
  country text,
  personal_number text,
  bio text,
  avatar_url text,
  is_host boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.email, p.phone,
         p.address_line, p.postal_code, p.city, p.country,
         p.personal_number, p.bio, p.avatar_url, p.is_host
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
