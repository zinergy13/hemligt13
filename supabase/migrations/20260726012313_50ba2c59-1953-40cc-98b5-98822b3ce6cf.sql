-- 1) Utöka host_invoices med moms/förfallo/OCR/extras
ALTER TABLE public.host_invoices
  ADD COLUMN IF NOT EXISTS commission_net integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extras_net integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5,4) NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS ocr_reference text,
  ADD COLUMN IF NOT EXISTS extras_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Audit-tabell för fakturahändelser
CREATE TABLE IF NOT EXISTS public.host_invoice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.host_invoices(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.host_invoice_events TO authenticated;
GRANT ALL ON public.host_invoice_events TO service_role;

ALTER TABLE public.host_invoice_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host and admin can view invoice events"
  ON public.host_invoice_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.host_invoices i
      WHERE i.id = host_invoice_events.invoice_id
        AND (i.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admin can log invoice events"
  ON public.host_invoice_events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_host_invoice_events_invoice ON public.host_invoice_events(invoice_id, created_at DESC);

-- 3) Uppdatera RPC generate_monthly_host_invoices — inkludera extras + moms + förfallo + OCR
CREATE OR REPLACE FUNCTION public.generate_monthly_host_invoices()
RETURNS TABLE(invoice_id uuid, host_id uuid, total_amount integer, booking_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_start_d date;
  period_end_d date;
  due_d date;
  rec record;
  new_invoice_id uuid;
  new_invoice_number text;
  new_ocr text;
  seq int;
  extras_sum integer;
  extras_breakdown_json jsonb;
  gross_total integer;
  net_total integer;
  vat_total integer;
  commission_net_val integer;
  extras_net_val integer;
BEGIN
  period_start_d := date_trunc('month', (CURRENT_DATE - interval '1 month'))::date;
  period_end_d := (date_trunc('month', CURRENT_DATE) - interval '1 day')::date;
  due_d := CURRENT_DATE + interval '10 days';

  FOR rec IN
    SELECT b.host_id AS h_id,
           SUM(b.commission_amount)::int AS commission_sum,
           COUNT(*)::int AS cnt
    FROM public.bookings b
    WHERE b.commission_status = 'earned'
      AND b.host_invoice_id IS NULL
      AND b.commission_earned_at::date <= period_end_d
    GROUP BY b.host_id
  LOOP
    -- Räkna tillvalsmarginaler (platform_fee) för denna värds bokningar i perioden
    SELECT
      COALESCE(SUM(be.platform_fee), 0)::int,
      jsonb_build_object(
        'cleaning',  COALESCE(SUM(CASE WHEN be.extra_type = 'cleaning'  THEN be.platform_fee END), 0)::int,
        'groceries', COALESCE(SUM(CASE WHEN be.extra_type = 'groceries' THEN be.platform_fee END), 0)::int,
        'firewood',  COALESCE(SUM(CASE WHEN be.extra_type = 'firewood'  THEN be.platform_fee END), 0)::int,
        'linen',     COALESCE(SUM(CASE WHEN be.extra_type = 'linen'     THEN be.platform_fee END), 0)::int
      )
    INTO extras_sum, extras_breakdown_json
    FROM public.booking_extras be
    JOIN public.bookings b ON b.id = be.booking_id
    WHERE b.host_id = rec.h_id
      AND b.commission_status = 'earned'
      AND b.host_invoice_id IS NULL
      AND b.commission_earned_at::date <= period_end_d;

    gross_total := rec.commission_sum + COALESCE(extras_sum, 0);

    -- Moms inkluderad i beloppet: netto = gross / 1.25, moms = gross - netto
    net_total := ROUND(gross_total / 1.25)::int;
    vat_total := gross_total - net_total;
    commission_net_val := ROUND(rec.commission_sum / 1.25)::int;
    extras_net_val := net_total - commission_net_val;

    -- Fakturanummer + OCR
    seq := (SELECT COUNT(*) + 1 FROM public.host_invoices
            WHERE issued_at::date >= date_trunc('month', CURRENT_DATE)::date);
    new_invoice_number := 'F-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad(seq::text, 4, '0');
    new_ocr := to_char(CURRENT_DATE, 'YYMM') || lpad(seq::text, 6, '0');

    INSERT INTO public.host_invoices (
      host_id, invoice_number, period_start, period_end,
      total_amount, booking_count,
      commission_net, extras_net, vat_amount, vat_rate,
      due_date, ocr_reference, extras_breakdown
    )
    VALUES (
      rec.h_id, new_invoice_number, period_start_d, period_end_d,
      gross_total, rec.cnt,
      commission_net_val, extras_net_val, vat_total, 0.25,
      due_d, new_ocr, COALESCE(extras_breakdown_json, '{}'::jsonb)
    )
    RETURNING id INTO new_invoice_id;

    -- Koppla bokningar
    UPDATE public.bookings
    SET host_invoice_id = new_invoice_id,
        commission_status = 'invoiced',
        commission_invoiced_at = now()
    WHERE bookings.host_id = rec.h_id
      AND commission_status = 'earned'
      AND host_invoice_id IS NULL
      AND commission_earned_at::date <= period_end_d;

    -- Logga event
    INSERT INTO public.host_invoice_events (invoice_id, event_type, note)
    VALUES (new_invoice_id, 'created', 'Automatgenererad månadsfaktura');

    invoice_id := new_invoice_id;
    host_id := rec.h_id;
    total_amount := gross_total;
    booking_count := rec.cnt;
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- 4) mark_overdue_invoices — sätt overdue-status
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.host_invoices
  SET status = 'overdue'
  WHERE status = 'issued'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 5) Backfill förfallo på befintliga fakturor (10 dagar från issued_at)
UPDATE public.host_invoices
SET due_date = (issued_at::date + interval '10 days')::date
WHERE due_date IS NULL;