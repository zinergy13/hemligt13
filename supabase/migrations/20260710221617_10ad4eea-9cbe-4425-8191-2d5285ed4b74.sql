
ALTER TABLE public.cabin_season_prices
  ADD COLUMN IF NOT EXISTS price_per_week integer,
  ADD COLUMN IF NOT EXISTS weekend_surcharge_pct integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.cabin_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  last_minute_days integer NOT NULL DEFAULT 0,
  last_minute_discount_pct integer NOT NULL DEFAULT 0,
  long_stay_nights integer NOT NULL DEFAULT 0,
  long_stay_discount_pct integer NOT NULL DEFAULT 0,
  high_demand_markup_pct integer NOT NULL DEFAULT 0,
  early_bird_days integer NOT NULL DEFAULT 0,
  early_bird_discount_pct integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cabin_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabin_pricing_rules TO authenticated;
GRANT ALL ON public.cabin_pricing_rules TO service_role;

ALTER TABLE public.cabin_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage own pricing rules"
  ON public.cabin_pricing_rules
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cabins c WHERE c.id = cabin_id AND c.host_id = auth.uid()));

CREATE TRIGGER update_cabin_pricing_rules_updated_at
  BEFORE UPDATE ON public.cabin_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
