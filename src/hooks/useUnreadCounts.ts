import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a map of booking_id -> unread message count for the current user.
 * Unread = booking_messages where sender != me AND read_at IS NULL,
 * scoped to the booking_ids we care about. Realtime-subscribed.
 */
export function useUnreadCounts(userId: string | undefined, bookingIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = bookingIds.slice().sort().join(",");

  useEffect(() => {
    if (!userId || bookingIds.length === 0) {
      setCounts({});
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("booking_messages")
        .select("booking_id")
        .in("booking_id", bookingIds)
        .is("read_at", null)
        .neq("sender_id", userId);
      if (error || cancelled) return;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        map[row.booking_id] = (map[row.booking_id] ?? 0) + 1;
      }
      setCounts(map);
    };
    load();

    const channel = supabase
      .channel(`unread-msgs-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { booking_id?: string } | null;
          if (row?.booking_id && bookingIds.includes(row.booking_id)) load();
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);

  return counts;
}