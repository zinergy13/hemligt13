import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingMessages } from "@/components/BookingMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/meddelanden/$bookingId")({
  head: () => ({
    meta: [
      { title: "Meddelanden — Fjällportalen" },
      { name: "description", content: "Skicka meddelanden mellan gäst och värd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type BookingCtx = {
  id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  cabin: { title: string; slug: string } | null;
};

function MessagesPage() {
  const { bookingId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingCtx | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/logga-in", search: { redirect: `/meddelanden/${bookingId}` } });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, guest_id, host_id, check_in, check_out, cabin:cabins(title, slug)")
        .eq("id", bookingId)
        .maybeSingle();
      setBooking(data as unknown as BookingCtx);
      setLoading(false);
    })();
  }, [authLoading, user, bookingId, navigate]);

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-8 md:px-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
          </div>
        ) : !booking ? (
          <p className="text-sm text-muted-foreground">Bokningen kunde inte hittas.</p>
        ) : (
          <>
            <Link
              to={user?.id === booking.host_id ? "/vard/bokningar" : "/mina-bokningar"}
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Tillbaka
            </Link>
            <h1 className="font-serif text-2xl text-foreground">
              {booking.cabin?.title || "Bokning"}
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">
              {booking.check_in} → {booking.check_out}
            </p>
            <BookingMessages bookingId={booking.id} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}