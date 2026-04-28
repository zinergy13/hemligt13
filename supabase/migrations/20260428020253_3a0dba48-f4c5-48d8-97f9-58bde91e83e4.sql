CREATE TABLE IF NOT EXISTS public.host_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_amount integer NOT NULL DEFAULT 0,
  booking_count integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_host_invoices_host ON public.host_invoices(host_id, issued_at DESC);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS host_invoice_id uuid REFERENCES public.host_invoices(id) ON DELETE SET NULL;

ALTER TABLE public.host_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can view their own invoices" ON public.host_invoices;
CREATE POLICY "Hosts can view their own invoices"
  ON public.host_invoices FOR SELECT
  USING (auth.uid() = host_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update invoices" ON public.host_invoices;
CREATE POLICY "Admins can update invoices"
  ON public.host_invoices FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.generate_monthly_host_invoices()
RETURNS TABLE(invoice_id uuid, host_id uuid, total_amount integer, booking_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_start_d date;
  period_end_d date;
  rec record;
  new_invoice_id uuid;
  new_invoice_number text;
  seq int;
BEGIN
  period_start_d := date_trunc('month', (CURRENT_DATE - interval '1 month'))::date;
  period_end_d := (date_trunc('month', CURRENT_DATE) - interval '1 day')::date;

  FOR rec IN
    SELECT b.host_id AS h_id, SUM(b.commission_amount)::int AS total, COUNT(*)::int AS cnt
    FROM public.bookings b
    WHERE b.commission_status = 'earned'
      AND b.host_invoice_id IS NULL
      AND b.commission_earned_at::date <= period_end_d
    GROUP BY b.host_id
  LOOP
    seq := (SELECT COUNT(*) + 1 FROM public.host_invoices
            WHERE issued_at::date >= date_trunc('month', CURRENT_DATE)::date);
    new_invoice_number := 'F-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad(seq::text, 4, '0');

    INSERT INTO public.host_invoices (host_id, invoice_number, period_start, period_end, total_amount, booking_count)
    VALUES (rec.h_id, new_invoice_number, period_start_d, period_end_d, rec.total, rec.cnt)
    RETURNING id INTO new_invoice_id;

    UPDATE public.bookings
    SET host_invoice_id = new_invoice_id,
        commission_status = 'invoiced',
        commission_invoiced_at = now()
    WHERE bookings.host_id = rec.h_id
      AND commission_status = 'earned'
      AND host_invoice_id IS NULL
      AND commission_earned_at::date <= period_end_d;

    invoice_id := new_invoice_id;
    host_id := rec.h_id;
    total_amount := rec.total;
    booking_count := rec.cnt;
    RETURN NEXT;
  END LOOP;
END;
$$;