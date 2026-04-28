import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CalendarDays, MapPin, Inbox, Check, X, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { areaBySlug } from "@/data/areas";
import { coverImage } from "@/lib/cabins";
import { formatDateRange, statusLabel, type Booking } from "@/lib/bookings";

type HostBookingRow = Booking & {
  cabins: {
    slug: string;
    title: string;
    area_slug: string;
    cabin_images: { url: string; is_cover: boolean; sort_order: number }[];
  } | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type Filter = "all" | "pending" | "confirmed" | "declined";

export const Route = createFileRoute("/vard/bokningar")({
  head: () => ({ meta: [{ title: "Bokningar — Värd — Fjällmys" }] }),
  component: HostBookingsPage,
});

function HostBookingsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<HostBookingRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/bokningar" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      // Fetch bookings + cabins
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          "*, cabins(slug, title, area_slug, cabin_images(url, is_cover, sort_order))",
        )
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (active) setRows([]);
        return;
      }
      // Fetch guest profiles separately (no FK relationship in schema)
      const guestIds = Array.from(
        new Set((bookings ?? []).map((b) => b.guest_id)),
      );
      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (guestIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", guestIds);
        for (const p of profs ?? []) {
          profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
      }
      const merged = (bookings ?? []).map((b) => ({
        ...b,
        profiles: profileMap.get(b.guest_id) ?? null,
      })) as unknown as HostBookingRow[];
      if (active) setRows(merged);
    })();
    return () => {
      active = false;
    };
  }, [user, refreshKey]);

  const updateStatus = async (id: string, status: "confirmed" | "declined") => {
    setBusyId(id);
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "confirmed" ? "Bokning bekräftad" : "Bokning avvisad");
    setRefreshKey((k) => k + 1);
  };

  if (loading || !user || rows === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Endast för värdar</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Aktivera värdkontot på din kontosida.
        </p>
        <Link to="/konto" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Till mitt konto
        </Link>
      </div>
    );
  }

  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    declined: rows.filter((r) => r.status === "declined" || r.status === "cancelled").length,
  };

  const visible = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "declined") return r.status === "declined" || r.status === "cancelled";
    return r.status === filter;
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bokningar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hantera förfrågningar och bekräftade vistelser för dina stugor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/vard"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Mina stugor
          </Link>
          <Link
            to="/vard/faktura"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Mitt saldo
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "declined"] as Filter[]).map((f) => {
          const labels: Record<Filter, string> = {
            all: "Alla",
            pending: "Väntar svar",
            confirmed: "Bekräftade",
            declined: "Avvisade/avbokade",
          };
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {labels[f]} ({counts[f]})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Inga bokningar här</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            När gäster bokar dina stugor visas de här.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((b) => {
            const c = b.cabins;
            const area = c ? areaBySlug(c.area_slug) : null;
            const cover = c ? coverImage({ cabin_images: c.cabin_images }) : null;
            const s = statusLabel(b.status);
            const guestName = b.profiles?.full_name?.trim() || "Gäst";
            const isPending = b.status === "pending";
            const busy = busyId === b.id;
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
                        <CalendarDays className="h-3 w-3" />
                        {formatDateRange(b.check_in, b.check_out)} · {b.nights} nätter · {b.guests} gäster
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> {guestName}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>

                  {b.guest_message && (
                    <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground">
                      "{b.guest_message}"
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-sm">
                    <span className="font-medium text-foreground">
                      {b.total_price.toLocaleString("sv-SE")} kr
                      <span className="ml-1 text-xs text-muted-foreground">total</span>
                    </span>
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => updateStatus(b.id, "declined")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Avvisa
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => updateStatus(b.id, "confirmed")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Godkänn
                        </button>
                      </div>
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