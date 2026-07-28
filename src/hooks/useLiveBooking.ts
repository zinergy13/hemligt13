import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TimelineBooking } from "@/components/PaymentPayoutTimeline";

const COLUMNS =
  "status, payment_status, check_in, escrow_status, escrow_released_at, refunded_at";

export function useLiveBooking(bookingId: string | undefined | null) {
  const [booking, setBooking] = useState<TimelineBooking | undefined>(undefined);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    supabase
      .from("bookings")
      .select(COLUMNS)
      .eq("id", bookingId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setBooking(data as TimelineBooking);
      });

    const channel = supabase
      .channel(`booking-timeline-${bookingId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${bookingId}` },
        (payload) => {
          const row = payload.new as Partial<TimelineBooking>;
          setBooking((prev) => ({ ...(prev ?? {}), ...row } as TimelineBooking));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return booking;
}