INSERT INTO private.cron_config (key, value)
VALUES ('email_alert_hook', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

INSERT INTO private.cron_config (key, value)
VALUES ('alert_admin_email', 'zinergy13@gmail.com')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.notify_email_attempt_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  v_secret text;
  v_url text;
BEGIN
  IF NEW.status <> 'failed' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'failed' THEN
    RETURN NEW;
  END IF;
  IF NEW.template_name = 'admin-email-alert' THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_secret FROM private.cron_config WHERE key = 'email_alert_hook';
  IF v_secret IS NULL THEN
    RAISE WARNING 'email_alert_hook secret missing';
    RETURN NEW;
  END IF;

  v_url := 'https://project--e42b6030-6a18-4cdd-9162-7704f456256b.lovable.app/api/public/hooks/email-alert';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := jsonb_build_object(
      'attempt_id', NEW.id,
      'template_name', NEW.template_name,
      'recipient_email', NEW.recipient_email,
      'booking_id', NEW.booking_id,
      'attempts', NEW.attempts,
      'last_status_code', NEW.last_status_code,
      'last_error', NEW.last_error,
      'last_attempt_at', NEW.last_attempt_at
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_email_attempt_failed error: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_email_attempt_failed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_email_attempts_failed_alert ON public.email_attempts;
CREATE TRIGGER trg_email_attempts_failed_alert
AFTER UPDATE OF status ON public.email_attempts
FOR EACH ROW
WHEN (NEW.status = 'failed' AND (OLD.status IS DISTINCT FROM 'failed'))
EXECUTE FUNCTION public.notify_email_attempt_failed();