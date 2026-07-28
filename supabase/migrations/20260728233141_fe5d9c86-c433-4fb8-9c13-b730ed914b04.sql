
CREATE TABLE public.email_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_status_code INT,
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_attempts_booking_idx ON public.email_attempts(booking_id);
CREATE INDEX email_attempts_status_idx ON public.email_attempts(status, next_retry_at);
CREATE INDEX email_attempts_template_idx ON public.email_attempts(template_name);

GRANT SELECT, UPDATE ON public.email_attempts TO authenticated;
GRANT ALL ON public.email_attempts TO service_role;

ALTER TABLE public.email_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email attempts"
ON public.email_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email attempts"
ON public.email_attempts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER email_attempts_updated_at
BEFORE UPDATE ON public.email_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
