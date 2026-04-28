-- Trigger functions should only run via triggers, not be callable
REVOKE EXECUTE ON FUNCTION public.set_booking_commission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_commission_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_past_bookings() FROM PUBLIC, anon, authenticated;