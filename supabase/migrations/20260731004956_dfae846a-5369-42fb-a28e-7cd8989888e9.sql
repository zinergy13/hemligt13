DROP POLICY IF EXISTS "Guest can view payout for confirmed bookings" ON public.host_payout_details;

CREATE POLICY "Admins can view payout details"
ON public.host_payout_details
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.can_manage_cabin_image(text) FROM anon, PUBLIC;