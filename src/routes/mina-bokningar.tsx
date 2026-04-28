import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CalendarDays, MapPin, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { areaBySlug } from "@/data/areas";
import { coverImage } from "@/lib/cabins";
import { formatDateRange, statusLabel, type Booking } from "@/lib/bookings";

type BookingRow = Booking & {
  cabins: {
    slug: string;
    title: string;
    area_slug: string;
    cabin_images: { url: string; is_cover: boolean; sort_order: number }[];
  } | null;
};

export const Route = createFileRoute("/mina-bokningar")({
  head: () => ({ meta: [{ title: "Mina bokningar — Fjällmys" }] }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/mina-bokningar" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "*, cabins(slug, title, area_slug, cabin_images(url, is_cover, sort_order))",
        )
        .eq("guest_id", user.id)
        .order("check_in", { ascending: false });
      if (active) setRows(((data as unknown) as BookingRow[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user || rows === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mina bokningar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Översikt av alla dina bokningar och förfrågningar.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Inga bokningar ännu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            När du bokar en stuga visas den här.
          </p>
          <Link
            to="/sok"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sök stugor
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((b) => {
            const c = b.cabins;
            const area = c ? areaBySlug(c.area_slug) : null;
            const cover = c ? coverImage({ cabin_images: c.cabin_images }) : null;
            const s = statusLabel(b.status);
            return (
              <li
                key={b.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted sm:w-48 sm:flex-none">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Ingen bild
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg text-foreground">
                        {c?.title ?? "Stuga"}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {area?.name ?? c?.area_slug ?? "—"}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {formatDateRange(b.check_in, b.check_out)} · {b.nights} nätter · {b.guests} gäster
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                    <span className="font-medium text-foreground">
                      {b.total_price.toLocaleString("sv-SE")} kr
                    </span>
                    {c && (
                      <Link
                        to="/stuga/$slug"
                        params={{ slug: c.slug }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Visa stuga
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}