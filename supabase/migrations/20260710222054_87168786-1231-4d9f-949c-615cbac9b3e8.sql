-- Ensure every cabin has an ical_token for public export URLs
ALTER TABLE public.cabins ALTER COLUMN ical_token SET DEFAULT encode(gen_random_bytes(24), 'hex');
UPDATE public.cabins SET ical_token = encode(gen_random_bytes(24), 'hex') WHERE ical_token IS NULL OR ical_token = '';
ALTER TABLE public.cabins ALTER COLUMN ical_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cabins_ical_token_key ON public.cabins(ical_token);

-- Index for fast lookup of blocked dates by feed source
CREATE INDEX IF NOT EXISTS cabin_blocked_dates_source_idx ON public.cabin_blocked_dates(cabin_id, source);