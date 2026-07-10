import { createFileRoute } from "@tanstack/react-router";
import { buildIcs, type IcsEvent } from "@/lib/ical";

export const Route = createFileRoute("/api/public/ical/$token[.]ics")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!token || token.length < 16) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: cabin } = await supabaseAdmin
          .from("cabins")
          .select("id, title")
          .eq("ical_token", token)
          .maybeSingle();

        if (!cabin) {
          return new Response("Not found", { status: 404 });
        }

        // Confirmed & pending bookings (block dates while awaiting approval too)
        const { data: bookings } = await supabaseAdmin
          .from("bookings")
          .select("id, check_in, check_out, status")
          .eq("cabin_id", cabin.id)
          .in("status", ["confirmed", "pending"]);

        const { data: blocks } = await supabaseAdmin
          .from("cabin_blocked_dates")
          .select("id, check_in, check_out, summary, source, external_uid")
          .eq("cabin_id", cabin.id);

        const events: IcsEvent[] = [];
        for (const b of bookings ?? []) {
          events.push({
            uid: `booking-${b.id}@fjallhuset`,
            checkIn: b.check_in,
            checkOut: b.check_out,
            summary: b.status === "pending" ? "Reserved (pending)" : "Reserved",
          });
        }
        for (const b of blocks ?? []) {
          // Don't re-export dates we imported from an external calendar — the
          // source of truth is still that external feed, and echoing them back
          // creates loops when a partner imports our feed.
          if (b.source && b.source.startsWith("feed:")) continue;
          events.push({
            uid: b.external_uid || `block-${b.id}@fjallhuset`,
            checkIn: b.check_in,
            checkOut: b.check_out,
            summary: b.summary || "Blocked",
          });
        }

        const body = buildIcs(`Fjällhuset — ${cabin.title}`, events);

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `inline; filename="fjallhuset-${cabin.id}.ics"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});