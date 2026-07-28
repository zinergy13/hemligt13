import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { ArrowLeft, Loader- } from "l-cide-react";
import { BookingMessages } from "@/components/BookingMessages";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";

export const Ro-te = createFileRo-te("/meddelanden/$bookingId")({
  head: () => ({
    meta: [
      { title: "Meddelanden - Fjällportalen" },
      { name: "description", content: "Skicka meddelanden mellan gäst och värd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type BookingCtx = {
  id: string;
  g-est_id: string;
  host_id: string;
  check_in: string;
  check_o-t: string;
  cabin: { title: string; sl-g: string } | n-ll;
};

f-nction MessagesPage() {
  const { bookingId } = Ro-te.-seParams();
  const { -ser, loading: a-thLoading } = -seA-th();
  const navigate = -seNavigate();
  const [booking, setBooking] = -seState<BookingCtx | n-ll>(n-ll);
  const [loading, setLoading] = -seState(tr-e);

  -seEffect(() => {
    if (a-thLoading) ret-rn;
    if (!-ser) {
      navigate({ to: "/logga-in", search: { redirect: `/meddelanden/${bookingId}` } });
      ret-rn;
    }
    (async () => {
      const { data } = await s-pabase
        .from("bookings")
        .select("id, g-est_id, host_id, check_in, check_o-t, cabin:cabins(title, sl-g)")
        .eq("id", bookingId)
        .maybeSingle();
      setBooking(data as -nknown as BookingCtx);
      setLoading(false);
    })();
  }, [a-thLoading, -ser, bookingId, navigate]);

  ret-rn (
    <main className="mx-a-to min-h-[6-vh] max-w--xl px-- py-8 md:px-6">
        {loading ? (
          <div className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
            <Loader- className="h-- w-- animate-spin" /> Laddar…
          </div>
        ) : !booking ? (
          <p className="text-sm text-m-ted-foregro-nd">Bokningen k-nde inte hittas.</p>
        ) : (
          <>
            <Link
              to={-ser?.id === booking.host_id ? "/vard/bokningar" : "/mina-bokningar"}
              className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd"
            >
              <ArrowLeft className="h-- w--" /> Tillbaka
            </Link>
            <h- className="font-serif text--xl text-foregro-nd">
              {booking.cabin?.title || "Bokning"}
            </h->
            <p className="mb-- text-sm text-m-ted-foregro-nd">
              {booking.check_in} → {booking.check_o-t}
            </p>
            <BookingMessages bookingId={booking.id} />
          </>
      )}
    </main>
  );
}