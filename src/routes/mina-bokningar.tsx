import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CalendarDays, MapPin, Inbox, Wallet, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { areaBySlug } from "@/data/areas";
import { coverImage } from "@/lib/cabins";
import { formatDateRange, statusLabel } from "@/lib/bookings";
import { guestBookingsQuery } from "@/lib/queries";
import { ListSkeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ReviewForm } from "@/components/ReviewsSection";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { MessageSquare } from "lucide-react";
import { TrustPaymentBanner } from "@/components/TrustPaymentBanner";

function ReviewCTA({ bookingId, cabinId }: { bookingId: string; cabinId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
      >
        <Star className="h-3.5 w-3.5" /> Lämna recension
      </button>
    );
  }
  return <ReviewForm bookingId={bookingId} cabinId={cabinId} onDone={() => setOpen(false)} />;
}

type Payout = {
  swish_number: string | null;
  bankgiro: string | null;
  bank_account: string | null;
  payment_instructions: string | null;
};

function PayoutBox({ hostId, totalPrice }: { hostId: string; totalPrice: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payout | null | undefined>(undefined);

  const load = async () => {
    setOpen(true);
    if (data !== undefined) return;
    const { data: rows } = await supabase
      .from("host_payout_details")
      .select("swish_number, bankgiro, bank_account, payment_instructions")
      .eq("host_id", hostId)
      .maybeSingle();
    setData(rows ?? null);
  };

  if (!open) {
    return (
      <button
        onClick={load}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
      >
        <Wallet className="h-3.5 w-3.5" /> Visa betaluppgifter
      </button>
    );
  }

  if (data === undefined) {
    return <Loader2 className="mt-3 h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (data === null || (!data.swish_number && !data.bankgiro && !data.bank_account && !data.payment_instructions)) {
    return (
      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Betalningen hanteras tryggt via Fjällportalen. Använd knappen "Betala" ovan.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
      <div className="mb-1 font-medium text-foreground">Betalning på {totalPrice.toLocaleString("sv-SE")} kr hanteras via Fjällportalen</div>
      {data.swish_number && (
        <div><span className="text-muted-foreground">Swish:</span> <span className="font-mono text-foreground">{data.swish_number}</span></div>
      )}
      {data.bankgiro && (
        <div><span className="text-muted-foreground">Bankgiro:</span> <span className="font-mono text-foreground">{data.bankgiro}</span></div>
      )}
      {data.bank_account && (
        <div><span className="text-muted-foreground">Bankkonto:</span> <span className="font-mono text-foreground">{data.bank_account}</span></div>
      )}
      {data.payment_instructions && (
        <p className="mt-2 whitespace-pre-line text-muted-foreground">{data.payment_instructions}</p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/mina-bokningar")({
  head: () => ({ meta: [{ title: "Mina bokningar - Fjällportalen" }] }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/mina-bokningar" } });
    }
  }, [loading, user, navigate]);

  const bookingsQ = useQuery({
    ...guestBookingsQuery(user?.id ?? ""),
    enabled: !!user,
  });
  const rows = bookingsQ.data;
  const bookingIds = (rows ?? []).map((b) => b.id);
  const unread = useUnreadCounts(user?.id, bookingIds);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const safeRows = rows ?? [];
  const initialLoading = bookingsQ.isLoading && !rows;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mina bokningar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Översikt av alla dina bokningar och förfrågningar.
      </p>

      <TrustPaymentBanner className="mt-5" />

      {initialLoading ? (
        <div className="mt-8">
          <ListSkeleton count={3} />
        </div>
      ) : safeRows.length === 0 ? (
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
          <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
            Trygg betalning via Fjällportalen - pengarna släpps till värden 24 timmar efter incheckning.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {safeRows.map((b) => {
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
                        <MapPin className="h-3 w-3" /> {area?.name ?? c?.area_slug ?? "-"}
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
                    <Link
                      to="/meddelanden/$bookingId"
                      params={{ bookingId: b.id }}
                      className="relative inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Meddelanden
                      {unread[b.id] > 0 && (
                        <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {unread[b.id]}
                        </span>
                      )}
                    </Link>
                  </div>
                  {(() => {
                    const paymentStatus = (b as unknown as { payment_status?: string }).payment_status;
                    const needsPayment = (b.status === "confirmed" || b.status === "pending") && paymentStatus !== "paid" && paymentStatus !== "refunded";
                    if (needsPayment) {
                      return (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <div className="text-xs text-muted-foreground">
                            Betala tryggt via Fjällportalen - pengarna släpps till värden 24 timmar efter incheckning.
                          </div>
                          <Link
                            to="/checkout/$bookingId"
                            params={{ bookingId: b.id }}
                            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            Betala {b.total_price.toLocaleString("sv-SE")} kr
                          </Link>
                        </div>
                      );
                    }
                    if (b.status === "confirmed" && paymentStatus === "paid") {
                      return (
                        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                          ✓ Betald. Pengarna hålls tryggt hos Fjällportalen och betalas ut till värden 24 timmar efter incheckning.
                        </p>
                      );
                    }
                    return null;
                  })()}
                  {b.status === "completed" && c && (
                    <ReviewCTA bookingId={b.id} cabinId={b.cabin_id} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}