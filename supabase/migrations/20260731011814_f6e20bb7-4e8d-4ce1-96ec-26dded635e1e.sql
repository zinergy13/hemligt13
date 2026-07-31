CREATE TABLE public.access_denials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  is_authenticated boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  resource text,
  operation text,
  code text,
  message text,
  details text,
  hint text,
  route text,
  user_agent text
);

GRANT INSERT ON public.access_denials TO anon, authenticated;
GRANT SELECT, DELETE ON public.access_denials TO authenticated;
GRANT ALL ON public.access_denials TO service_role;

ALTER TABLE public.access_denials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an access denial"
  ON public.access_denials FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read access denials"
  ON public.access_denials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete access denials"
  ON public.access_denials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX access_denials_occurred_at_idx ON public.access_denials (occurred_at DESC);

CREATE OR REPLACE FUNCTION public.check_public_visibility()
RETURNS TABLE(published_cabins integer, cabin_images integer, caller_role text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.cabins c WHERE c.status = 'published')::int,
    (SELECT count(*) FROM public.cabin_images ci)::int,
    current_user::text;
$$;

GRANT EXECUTE ON FUNCTION public.check_public_visibility() TO anon, authenticated;