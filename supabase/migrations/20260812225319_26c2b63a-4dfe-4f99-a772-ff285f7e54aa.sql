-- WP-000 safety freeze: stop the automatic "escrow released" status job.
-- A database status change is not proof that money moved (no Stripe payout
-- object exists yet). Re-enable only in WP-004 with verified provider events.
SELECT cron.unschedule('release-escrow-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release-escrow-hourly');

CREATE OR REPLACE FUNCTION public.release_eligible_escrow()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- WP-000 freeze: this function previously flipped bookings.escrow_status to
  -- 'released' on a timer, which produced payout claims with no provider
  -- evidence. It is intentionally a no-op until the Stripe Connect payout
  -- state machine (WP-004) is implemented and verified.
  RAISE NOTICE 'release_eligible_escrow is disabled by WP-000 safety freeze';
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.release_eligible_escrow() FROM PUBLIC;
