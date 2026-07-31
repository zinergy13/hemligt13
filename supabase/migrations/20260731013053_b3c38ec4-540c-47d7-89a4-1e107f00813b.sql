DROP POLICY IF EXISTS "Clients can log a valid access denial" ON public.access_denials;

CREATE POLICY "Clients can log a valid access denial"
ON public.access_denials
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(source) BETWEEN 1 AND 40
  AND (user_id IS NULL OR user_id = auth.uid())
  AND is_authenticated = (auth.uid() IS NOT NULL)
  AND occurred_at BETWEEN now() - interval '10 minutes' AND now() + interval '1 minute'
  AND coalesce(length(resource), 0) <= 300
  AND coalesce(length(operation), 0) <= 40
  AND coalesce(length(code), 0) <= 40
  AND coalesce(length(message), 0) <= 1000
  AND coalesce(length(details), 0) <= 1000
  AND coalesce(length(hint), 0) <= 500
  AND coalesce(length(route), 0) <= 500
  AND coalesce(length(user_agent), 0) <= 500
);