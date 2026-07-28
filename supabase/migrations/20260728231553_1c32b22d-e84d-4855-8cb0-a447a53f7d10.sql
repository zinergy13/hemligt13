ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_checkin_notify
  ON public.bookings(check_in)
  WHERE checkin_notified_at IS NULL AND payment_status = 'paid' AND escrow_status IN ('holding','released');

CREATE INDEX IF NOT EXISTS idx_bookings_payout_notify
  ON public.bookings(escrow_released_at)
  WHERE payout_notified_at IS NULL AND escrow_status = 'released';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'guest-booking-notifications-hourly') THEN
    PERFORM cron.unschedule('guest-booking-notifications-hourly');
  END IF;
  PERFORM cron.schedule(
    'guest-booking-notifications-hourly',
    '7 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://project--e42b6030-6a18-4cdd-9162-7704f456256b.lovable.app/api/public/hooks/booking-notifications',
      headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY3RjYnB6cXJjZW5semN6Y2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjIxMTYsImV4cCI6MjA5Mjg5ODExNn0.S9_ocw-cydfmfdU4D7KxcyQIQJopSme5OZpynUSAj4g"}'::jsonb,
      body := '{}'::jsonb
    );
    $cron$
  );
END $$;