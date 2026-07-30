-- Only the non-sensitive columns are readable by clients
GRANT SELECT (id, full_name, avatar_url, bio, is_host) ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Profiles: public can read basic fields" ON public.profiles;
CREATE POLICY "Profiles: public can read basic fields"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- View now runs with the querying user's permissions (no SECURITY DEFINER semantics)
ALTER VIEW public.public_profiles SET (security_invoker = true);