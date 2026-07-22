import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { parseIcs } from "./ical";

const SyncInput = z.object({ feedId: z.string().uuid() });

// Block SSRF: only public https, and reject private / loopback / link-local / metadata IPs.
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("::ffff:")) {
    return isPrivateIPv4(lower.slice(7));
  }
  return false;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Ogiltig URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Endast https-URL:er tillåts");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost") throw new Error("Ogiltig värd");
  // Reject IP literals in private ranges outright
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (isPrivateIPv4(host)) throw new Error("Privat/intern adress är inte tillåten");
  } else if (host.includes(":")) {
    if (isPrivateIPv6(host)) throw new Error("Privat/intern adress är inte tillåten");
  } else {
    // Best-effort DNS check via Cloudflare DoH
    try {
      const resolve = async (type: "A" | "AAAA") => {
        const r = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
          { headers: { Accept: "application/dns-json" } },
        );
        if (!r.ok) return [] as string[];
        const j = (await r.json()) as { Answer?: { data: string; type: number }[] };
        return (j.Answer ?? []).map((a) => a.data);
      };
      const [a, aaaa] = await Promise.all([resolve("A"), resolve("AAAA")]);
      for (const ip of a) if (isPrivateIPv4(ip)) throw new Error("Privat/intern adress är inte tillåten");
      for (const ip of aaaa) if (isPrivateIPv6(ip)) throw new Error("Privat/intern adress är inte tillåten");
    } catch (e) {
      if (e instanceof Error && e.message.includes("Privat")) throw e;
      // DNS lookup failure is non-fatal — fetch will still be attempted
    }
  }
  return parsed;
}

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
      await assertSafePublicUrl(feed.url);
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Fjallhuset-iCal/1.0", Accept: "text/calendar" },
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400) {
        fetchError = "Omdirigeringar är inte tillåtna";
      } else
      if (!res.ok) fetchError = `HTTP ${res.status}`;
      else payload = await res.text();
    } catch (e) {
      // Do not echo raw network error details back to the client.
      fetchError = e instanceof Error && /Privat|Ogiltig|Endast https/.test(e.message)
        ? e.message
        : "Kunde inte hämta kalender";
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