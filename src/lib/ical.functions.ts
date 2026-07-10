import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { parseIcs } from "./ical";

const SyncInput = z.object({ feedId: z.string().uuid() });

/** Fetch a remote iCal feed and refresh imported blocked dates for its cabin. */
export const syncIcalFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => SyncInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // RLS restricts feeds to the owner host, so this scopes automatically.
    const { data: feed, error: feedError } = await supabase
      .from("cabin_ical_feeds")
      .select("id, cabin_id, url, active")
      .eq("id", data.feedId)
      .maybeSingle();

    if (feedError) throw new Error(feedError.message);
    if (!feed) throw new Error("Feed hittades inte");
    if (!feed.active) throw new Error("Feed är pausad — aktivera den innan synk");

    // Fetch the remote feed
    let payload = "";
    let fetchError: string | null = null;
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Fjallhuset-iCal/1.0", Accept: "text/calendar" },
      });
      if (!res.ok) fetchError = `HTTP ${res.status}`;
      else payload = await res.text();
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "Nätverksfel";
    }

    if (fetchError) {
      await supabase
        .from("cabin_ical_feeds")
        .update({ last_error: fetchError, last_synced_at: new Date().toISOString() })
        .eq("id", feed.id);
      throw new Error(`Kunde inte hämta kalender: ${fetchError}`);
    }

    const events = parseIcs(payload);
    const source = `feed:${feed.id}`;

    // Replace all previously imported rows for this feed with the fresh set.
    const { error: deleteError } = await supabase
      .from("cabin_blocked_dates")
      .delete()
      .eq("cabin_id", feed.cabin_id)
      .eq("source", source);
    if (deleteError) throw new Error(deleteError.message);

    let inserted = 0;
    if (events.length > 0) {
      const rows = events.map((e) => ({
        cabin_id: feed.cabin_id,
        check_in: e.checkIn,
        check_out: e.checkOut,
        source,
        external_uid: e.uid,
        summary: e.summary?.slice(0, 200) ?? null,
      }));
      const { error: insertError, count } = await supabase
        .from("cabin_blocked_dates")
        .insert(rows, { count: "exact" });
      if (insertError) throw new Error(insertError.message);
      inserted = count ?? rows.length;
    }

    await supabase
      .from("cabin_ical_feeds")
      .update({
        last_synced_at: new Date().toISOString(),
        last_error: null,
        last_event_count: inserted,
      })
      .eq("id", feed.id);

    return { imported: inserted };
  });