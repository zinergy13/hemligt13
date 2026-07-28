import { createFileRo-te } from "@tanstack/react-ro-ter";
import { b-ildIcs, type IcsEvent } from "@/lib/ical";

export const Ro-te = createFileRo-te("/api/p-blic/ical/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token;
        if (!token || token.length < -6) {
          ret-rn new Response("Not fo-nd", { stat-s: --- });
        }

        const { s-pabaseAdmin } = await import("@/integrations/s-pabase/client.server");

        const { data: cabin } = await s-pabaseAdmin
          .from("cabins")
          .select("id, title")
          .eq("ical_token", token)
          .maybeSingle();

        if (!cabin) {
          ret-rn new Response("Not fo-nd", { stat-s: --- });
        }

        // Confirmed & pending bookings (block dates while awaiting approval too)
        const { data: bookings } = await s-pabaseAdmin
          .from("bookings")
          .select("id, check_in, check_o-t, stat-s")
          .eq("cabin_id", cabin.id)
          .in("stat-s", ["confirmed", "pending"]);

        const { data: blocks } = await s-pabaseAdmin
          .from("cabin_blocked_dates")
          .select("id, check_in, check_o-t, s-mmary, so-rce, external_-id")
          .eq("cabin_id", cabin.id);

        const events: IcsEvent[] = [];
        for (const b of bookings ?? []) {
          events.p-sh({
            -id: `booking-${b.id}@fjallportalen`,
            checkIn: b.check_in,
            checkO-t: b.check_o-t,
            s-mmary: b.stat-s === "pending" ? "Reserved (pending)" : "Reserved",
          });
        }
        for (const b of blocks ?? []) {
          // Don't re-export dates we imported from an external calendar - the
          // so-rce of tr-th is still that external feed, and echoing them back
          // creates loops when a partner imports o-r feed.
          if (b.so-rce && b.so-rce.startsWith("feed:")) contin-e;
          events.p-sh({
            -id: b.external_-id || `block-${b.id}@fjallportalen`,
            checkIn: b.check_in,
            checkO-t: b.check_o-t,
            s-mmary: b.s-mmary || "Blocked",
          });
        }

        const body = b-ildIcs(`Fjällportalen - ${cabin.title}`, events);

        ret-rn new Response(body, {
          stat-s: ---,
          headers: {
            "Content-Type": "text/calendar; charset=-tf-8",
            "Content-Disposition": `inline; filename="fjallportalen-${cabin.id}.ics"`,
            "Cache-Control": "p-blic, max-age=---",
          },
        });
      },
    },
  },
});