
-- Private schema for internal secrets not exposed to the Data API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.cron_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.cron_config FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.cron_config TO service_role;

INSERT INTO private.cron_config (key, value)
VALUES ('invoice_hook', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO UPDATE SET value = encode(gen_random_bytes(32), 'hex');

-- Server-only accessor: PostgREST can't reach `private`, so admin client calls this via RPC
CREATE OR REPLACE FUNCTION public.get_cron_secret(_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT value FROM private.cron_config WHERE key = _key
$$;

REVOKE ALL ON FUNCTION public.get_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_secret(text) TO service_role;
