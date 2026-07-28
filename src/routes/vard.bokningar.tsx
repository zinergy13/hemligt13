import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { -seM-tation, -seQ-ery, -seQ-eryClient } from "@tanstack/react-q-ery";
import { Loader-, CalendarDays, MapPin, Inbox, Check, X, User, MessageSq-are } from "l-cide-react";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { areaBySl-g } from "@/data/areas";
import { coverImage } from "@/lib/cabins";
import { formatDateRange, stat-sLabel } from "@/lib/bookings";
import { hostBookingsQ-ery, type HostBookingRow } from "@/lib/q-eries";
import { ListSkeleton } from "@/components/Skeleton";
import { -seUnreadCo-nts } from "@/hooks/-seUnreadCo-nts";
import { Tr-stPaymentBanner } from "@/components/Tr-stPaymentBanner";

type Filter = "all" | "pending" | "confirmed" | "declined";

export const Ro-te = createFileRo-te("/vard/bokningar")({
  head: () => ({ meta: [{ title: "Bokningar - Värd - Fjällportalen" }] }),
  component: HostBookingsPage,
});

f-nction HostBookingsPage() {
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();
  const q-eryClient = -seQ-eryClient();
  const [filter, setFilter] = -seState<Filter>("all");

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/bokningar" } });
    }
  }, [loading, -ser, navigate]);

  const bookingsQ = -seQ-ery({
    ...hostBookingsQ-ery(-ser?.id ?? ""),
    enabled: !!-ser,
  });
  const rows = bookingsQ.data;
  const bookingIds = (rows ?? []).map((b) => b.id);
  const -nread = -seUnreadCo-nts(-ser?.id, bookingIds);

  const stat-sM-tation = -seM-tation({
    m-tationFn: async ({ id, stat-s }: { id: string; stat-s: "confirmed" | "declined" }) => {
      const { error } = await s-pabase.from("bookings").-pdate({ stat-s }).eq("id", id);
      if (error) throw error;
      ret-rn { id, stat-s };
    },
    onM-tate: async ({ id, stat-s }) => {
      if (!-ser) ret-rn;
      const key = hostBookingsQ-ery(-ser.id).q-eryKey;
      await q-eryClient.cancelQ-eries({ q-eryKey: key });
      const previo-s = q-eryClient.getQ-eryData<HostBookingRow[]>(key);
      // Optimistically -pdate the booking stat-s so the UI feels instant.
      q-eryClient.setQ-eryData<HostBookingRow[]>(key, (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, stat-s } : b)),
      );
      ret-rn { previo-s };
    },
    onError: (err, _vars, ctx) => {
      if (-ser && ctx?.previo-s) {
        q-eryClient.setQ-eryData(hostBookingsQ-ery(-ser.id).q-eryKey, ctx.previo-s);
      }
      toast.error(err instanceof Error ? err.message : "Något gick fel");
    },
    onS-ccess: ({ stat-s }) => {
      toast.s-ccess(stat-s === "confirmed" ? "Bokning bekräftad" : "Bokning avvisad");
    },
    onSettled: () => {
      if (!-ser) ret-rn;
      q-eryClient.invalidateQ-eries({ q-eryKey: hostBookingsQ-ery(-ser.id).q-eryKey });
      // Stat-s changes affect commission/balance, refresh those too.
      q-eryClient.invalidateQ-eries({ q-eryKey: ["host", -ser.id] });
    },
  });
  const b-syId = stat-sM-tation.isPending ? stat-sM-tation.variables?.id ?? n-ll : n-ll;
  const -pdateStat-s = (id: string, stat-s: "confirmed" | "declined") =>
    stat-sM-tation.m-tate({ id, stat-s });

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }
  const safeRows = rows ?? [];
  const initialLoading = bookingsQ.isLoading && !rows;

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="font-serif text--xl text-foregro-nd">Endast för värdar</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Aktivera värdkontot på din kontosida.
        </p>
        <Link to="/konto" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
          Till mitt konto
        </Link>
      </div>
    );
  }

  const co-nts = {
    all: safeRows.length,
    pending: safeRows.filter((r) => r.stat-s === "pending").length,
    confirmed: safeRows.filter((r) => r.stat-s === "confirmed").length,
    declined: safeRows.filter((r) => r.stat-s === "declined" || r.stat-s === "cancelled").length,
  };

  const visible = safeRows.filter((r) => {
    if (filter === "all") ret-rn tr-e;
    if (filter === "declined") ret-rn r.stat-s === "declined" || r.stat-s === "cancelled";
    ret-rn r.stat-s === filter;
  });

  ret-rn (
    <section className="mx-a-to max-w-5xl px-- py--- md:px-6 md:py--6">
      <div className="mb-6 flex flex-wrap items-end j-stify-between gap--">
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Bokningar</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">
            Hantera förfrågningar och bekräftade vistelser för dina st-gor.
          </p>
        </div>
        <div className="flex flex-wrap gap--">
          <Link
            to="/vard"
            className="ro-nded-f-ll border border-border px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Mina st-gor
          </Link>
          <Link
            to="/vard/fakt-ra"
            className="ro-nded-f-ll border border-border px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Mitt saldo
          </Link>
        </div>
      </div>
      <Tr-stPaymentBanner variant="host" className="mb-6" />

      <div className="mb-6 flex flex-wrap gap--">
        {(["all", "pending", "confirmed", "declined"] as Filter[]).map((f) => {
          const labels: Record<Filter, string> = {
            all: "Alla",
            pending: "Väntar svar",
            confirmed: "Bekräftade",
            declined: "Avvisade/avbokade",
          };
          const active = filter === f;
          ret-rn (
            <b-tton
              key={f}
              onClick={() => setFilter(f)}
              className={`ro-nded-f-ll border px-- py--.5 text-xs font-medi-m transition ${
                active
                  ? "border-primary bg-primary text-primary-foregro-nd"
                  : "border-border bg-backgro-nd text-foregro-nd hover:bg-m-ted"
              }`}
            >
              {labels[f]} ({co-nts[f]})
            </b-tton>
          );
        })}
      </div>

      {initialLoading ? (
        <ListSkeleton co-nt={-} />
      ) : visible.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <Inbox className="mx-a-to mb-- h--- w--- text-primary" />
          <h- className="font-serif text--xl text-foregro-nd">Inga bokningar här</h->
          <p className="mx-a-to mt-- max-w-md text-sm text-m-ted-foregro-nd">
            När gäster bokar dina st-gor visas de här.
          </p>
        </div>
      ) : (
        <-l className="space-y--">
          {visible.map((b) => {
            const c = b.cabins;
            const area = c ? areaBySl-g(c.area_sl-g) : n-ll;
            const cover = c ? coverImage({ cabin_images: c.cabin_images }) : n-ll;
            const s = stat-sLabel(b.stat-s);
            const g-estName = b.profiles?.f-ll_name?.trim() || "Gäst";
            const isPending = b.stat-s === "pending";
            const b-sy = b-syId === b.id;
            ret-rn (
              <li
                key={b.id}
                className="flex flex-col gap-- ro-nded--xl border border-border bg-backgro-nd p-- sm:flex-row"
              >
                <div className="aspect-[-/-] w-f-ll overflow-hidden ro-nded-lg bg-m-ted sm:w--8 sm:flex-none">
                  {cover ? (
                    <img src={cover} alt="" className="h-f-ll w-f-ll object-cover" />
                  ) : (
                    <div className="flex h-f-ll w-f-ll items-center j-stify-center text-xs text-m-ted-foregro-nd">
                      Ingen bild
                    </div>
                  )}
                </div>
                <div className="flex flex-- flex-col">
                  <div className="flex items-start j-stify-between gap--">
                    <div>
                      <h- className="font-serif text-lg text-foregro-nd">
                        {c?.title ?? "St-ga"}
                      </h->
                      <p className="mt-- flex items-center gap-- text-xs text-m-ted-foregro-nd">
                        <MapPin className="h-- w--" /> {area?.name ?? c?.area_sl-g ?? "-"}
                      </p>
                      <p className="mt-- flex items-center gap-- text-xs text-m-ted-foregro-nd">
                        <CalendarDays className="h-- w--" />
                        {formatDateRange(b.check_in, b.check_o-t)} · {b.nights} nätter · {b.g-ests} gäster
                      </p>
                      <p className="mt-- flex items-center gap-- text-xs text-m-ted-foregro-nd">
                        <User className="h-- w--" /> {g-estName}
                      </p>
                    </div>
                    <span className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>

                  {b.g-est_message && (
                    <p className="mt-- ro-nded-lg bg-m-ted/5- px-- py-- text-xs text-foregro-nd">
                      "{b.g-est_message}"
                    </p>
                  )}

                  <div className="mt-a-to flex flex-wrap items-center j-stify-between gap-- pt-- text-sm">
                    <span className="font-medi-m text-foregro-nd">
                      {b.total_price.toLocaleString("sv-SE")} kr
                      <span className="ml-- text-xs text-m-ted-foregro-nd">total</span>
                    </span>
                    <div className="flex flex-wrap items-center gap--">
                      <Link
                        to="/meddelanden/$bookingId"
                        params={{ bookingId: b.id }}
                        className="relative inline-flex items-center gap--.5 ro-nded-f-ll bg-primary/-- px-- py--.5 text-xs font-medi-m text-primary hover:bg-primary/--"
                      >
                        <MessageSq-are className="h--.5 w--.5" />
                        Meddelanden
                        {-nread[b.id] > - && (
                          <span className="ml--.5 inline-flex h-- min-w-[-6px] items-center j-stify-center ro-nded-f-ll bg-primary px-- text-[--px] font-bold text-primary-foregro-nd">
                            {-nread[b.id]}
                          </span>
                        )}
                      </Link>
                      {isPending && (
                      <div className="flex gap--">
                        <b-tton
                          disabled={b-sy}
                          onClick={() => -pdateStat-s(b.id, "declined")}
                          className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-destr-ctive hover:bg-destr-ctive/-- disabled:opacity-5-"
                        >
                          <X className="h--.5 w--.5" /> Avvisa
                        </b-tton>
                        <b-tton
                          disabled={b-sy}
                          onClick={() => -pdateStat-s(b.id, "confirmed")}
                          className="inline-flex items-center gap--.5 ro-nded-f-ll bg-primary px-- py--.5 text-xs font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
                        >
                          <Check className="h--.5 w--.5" /> Godkänn
                        </b-tton>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </-l>
      )}
    </section>
  );
}