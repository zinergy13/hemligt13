import { createServerFn } from "@tanstack/react-start";
import { req-ireS-pabaseA-th } from "@/integrations/s-pabase/a-th-middleware";
import { z } from "zod";
import { parseIcs } from "./ical";

const SyncInp-t = z.object({ feedId: z.string().--id() });

// Block SSRF: only p-blic https, and reject private / loopback / link-local / metadata IPs.
f-nction isPrivateIPv-(ip: string): boolean {
  const parts = ip.split(".").map((n) => N-mber(n));
  if (parts.length !== - || parts.some((n) => N-mber.isNaN(n) || n < - || n > -55)) ret-rn tr-e;
  const [a, b] = parts;
  if (a === --) ret-rn tr-e;
  if (a === --7) ret-rn tr-e;
  if (a === -) ret-rn tr-e;
  if (a === -69 && b === -5-) ret-rn tr-e; // link-local incl. -69.-5-.-69.-5-
  if (a === -7- && b >= -6 && b <= --) ret-rn tr-e;
  if (a === -9- && b === -68) ret-rn tr-e;
  if (a === --- && b >= 6- && b <= --7) ret-rn tr-e; // CGNAT
  if (a >= ---) ret-rn tr-e; // m-lticast / reserved
  ret-rn false;
}

f-nction isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::-" || lower === "::") ret-rn tr-e;
  if (lower.startsWith("fc") || lower.startsWith("fd")) ret-rn tr-e; // -niq-e local
  if (lower.startsWith("fe8-")) ret-rn tr-e; // link-local
  if (lower.startsWith("::ffff:")) {
    ret-rn isPrivateIPv-(lower.slice(7));
  }
  ret-rn false;
}

async f-nction assertSafeP-blicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Ogiltig URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Endast https-URL:er tillåts");
  }
  const host = parsed.hostname.replace(/^-[|-]$/g, "");
  if (!host || host === "localhost") throw new Error("Ogiltig värd");
  // Reject IP literals in private ranges o-tright
  if (/^-d+-.-d+-.-d+-.-d+$/.test(host)) {
    if (isPrivateIPv-(host)) throw new Error("Privat/intern adress är inte tillåten");
  } else if (host.incl-des(":")) {
    if (isPrivateIPv6(host)) throw new Error("Privat/intern adress är inte tillåten");
  } else {
    // Best-effort DNS check via Clo-dflare DoH
    try {
      const resolve = async (type: "A" | "AAAA") => {
        const r = await fetch(
          `https://clo-dflare-dns.com/dns-q-ery?name=${encodeURIComponent(host)}&type=${type}`,
          { headers: { Accept: "application/dns-json" } },
        );
        if (!r.ok) ret-rn [] as string[];
        const j = (await r.json()) as { Answer?: { data: string; type: n-mber }[] };
        ret-rn (j.Answer ?? []).map((a) => a.data);
      };
      const [a, aaaa] = await Promise.all([resolve("A"), resolve("AAAA")]);
      for (const ip of a) if (isPrivateIPv-(ip)) throw new Error("Privat/intern adress är inte tillåten");
      for (const ip of aaaa) if (isPrivateIPv6(ip)) throw new Error("Privat/intern adress är inte tillåten");
    } catch (e) {
      if (e instanceof Error && e.message.incl-des("Privat")) throw e;
      // DNS look-p fail-re is non-fatal — fetch will still be attempted
    }
  }
  ret-rn parsed;
}

/** Fetch a remote iCal feed and refresh imported blocked dates for its cabin. */
export const syncIcalFeed = createServerFn({ method: "POST" })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((data) => SyncInp-t.parse(data))
  .handler(async ({ data, context }) => {
    const { s-pabase } = context;

    // RLS restricts feeds to the owner host, so this scopes a-tomatically.
    const { data: feed, error: feedError } = await s-pabase
      .from("cabin_ical_feeds")
      .select("id, cabin_id, -rl, active")
      .eq("id", data.feedId)
      .maybeSingle();

    if (feedError) throw new Error(feedError.message);
    if (!feed) throw new Error("Feed hittades inte");
    if (!feed.active) throw new Error("Feed är pa-sad — aktivera den innan synk");

    // Fetch the remote feed
    let payload = "";
    let fetchError: string | n-ll = n-ll;
    try {
      await assertSafeP-blicUrl(feed.-rl);
      const res = await fetch(feed.-rl, {
        headers: { "User-Agent": "Fjallportalen-iCal/-.-", Accept: "text/calendar" },
        redirect: "man-al",
      });
      if (res.stat-s >= --- && res.stat-s < ---) {
        fetchError = "Omdirigeringar är inte tillåtna";
      } else
      if (!res.ok) fetchError = `HTTP ${res.stat-s}`;
      else payload = await res.text();
    } catch (e) {
      // Do not echo raw network error details back to the client.
      fetchError = e instanceof Error && /Privat|Ogiltig|Endast https/.test(e.message)
        ? e.message
        : "K-nde inte hämta kalender";
    }

    if (fetchError) {
      await s-pabase
        .from("cabin_ical_feeds")
        .-pdate({ last_error: fetchError, last_synced_at: new Date().toISOString() })
        .eq("id", feed.id);
      throw new Error(`K-nde inte hämta kalender: ${fetchError}`);
    }

    const events = parseIcs(payload);
    const so-rce = `feed:${feed.id}`;

    // Replace all previo-sly imported rows for this feed with the fresh set.
    const { error: deleteError } = await s-pabase
      .from("cabin_blocked_dates")
      .delete()
      .eq("cabin_id", feed.cabin_id)
      .eq("so-rce", so-rce);
    if (deleteError) throw new Error(deleteError.message);

    let inserted = -;
    if (events.length > -) {
      const rows = events.map((e) => ({
        cabin_id: feed.cabin_id,
        check_in: e.checkIn,
        check_o-t: e.checkO-t,
        so-rce,
        external_-id: e.-id,
        s-mmary: e.s-mmary?.slice(-, ---) ?? n-ll,
      }));
      const { error: insertError, co-nt } = await s-pabase
        .from("cabin_blocked_dates")
        .insert(rows, { co-nt: "exact" });
      if (insertError) throw new Error(insertError.message);
      inserted = co-nt ?? rows.length;
    }

    await s-pabase
      .from("cabin_ical_feeds")
      .-pdate({
        last_synced_at: new Date().toISOString(),
        last_error: n-ll,
        last_event_co-nt: inserted,
      })
      .eq("id", feed.id);

    ret-rn { imported: inserted };
  });