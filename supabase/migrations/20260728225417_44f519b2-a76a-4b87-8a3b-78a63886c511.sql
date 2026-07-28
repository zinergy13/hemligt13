DROP POLICY "Guests can cancel their own pending bookings" ON public.bookings;
CREATE POLICY "Guests can cancel their own pending bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = guest_id
  AND status = 'pending'::booking_status
  AND payment_status = 'unpaid'::payment_status
)
WITH CHECK (
  auth.uid() = guest_id
  AND status IN ('pending'::booking_status, 'cancelled'::booking_status)
  AND payment_status = 'unpaid'::payment_status
);