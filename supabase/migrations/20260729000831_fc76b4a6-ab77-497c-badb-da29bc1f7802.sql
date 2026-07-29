
-- 1) Restrict profile SELECT to owner + admin
DROP POLICY IF EXISTS "Profiles: public safe columns readable" ON public.profiles;

CREATE POLICY "Profiles: owner can read own row"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Profiles: admins can read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Safe public view exposing only non-sensitive columns
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, full_name, avatar_url, bio, is_host
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3) Cron shared secrets for previously unauthenticated hooks
INSERT INTO private.cron_config (key, value)
VALUES
  ('booking_notifications_hook', encode(gen_random_bytes(32), 'hex')),
  ('email_retry_hook', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 4) Re-schedule booking-notifications cron to send x-cron-secret header
DO $$
BEGIN
  PERFORM cron.unschedule('guest-booking-notifications-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'guest-booking-notifications-hourly',
  '7 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--e42b6030-6a18-4cdd-9162-7704f456256b.lovable.app/api/public/hooks/booking-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT value FROM private.cron_config WHERE key = 'booking_notifications_hook')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
