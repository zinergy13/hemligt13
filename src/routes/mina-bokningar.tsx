import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { -seQ-ery } from "@tanstack/react-q-ery";
import { Loader-, CalendarDays, MapPin, Inbox, Wallet, Star } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { areaBySl-g } from "@/data/areas";
import { coverImage } from "@/lib/cabins";
import { formatDateRange, stat-sLabel } from "@/lib/bookings";
import { g-estBookingsQ-ery } from "@/lib/q-eries";
import { ListSkeleton } from "@/components/Skeleton";
import { s-pabase } from "@/integrations/s-pabase/client";
import { ReviewForm } from "@/components/ReviewsSection";
import { -seUnreadCo-nts } from "@/hooks/-seUnreadCo-nts";
import { MessageSq-are } from "l-cide-react";
import { Tr-stPaymentBanner } from "@/components/Tr-stPaymentBanner";

f-nction ReviewCTA({ bookingId, cabinId }: { bookingId: string; cabinId: string }) {
  const [open, setOpen] = -seState(false);
  if (!open) {
    ret-rn (
      <b-tton
        onClick={() => setOpen(tr-e)}
        className="mt-- inline-flex items-center gap-- ro-nded-f-ll border border-primary/-- bg-primary/5 px-- py--.5 text-xs font-medi-m text-primary hover:bg-primary/--"
      >
        <Star className="h--.5 w--.5" /> Lämna recension
      </b-tton>
    );
  }
  ret-rn <ReviewForm bookingId={bookingId} cabinId={cabinId} onDone={() => setOpen(false)} />;
}

type Payo-t = {
  swish_n-mber: string | n-ll;
  bankgiro: string | n-ll;
  bank_acco-nt: string | n-ll;
  payment_instr-ctions: string | n-ll;
};

f-nction Payo-tBox({ hostId, totalPrice }: { hostId: string; totalPrice: n-mber }) {
  const [open, setOpen] = -seState(false);
  const [data, setData] = -seState<Payo-t | n-ll | -ndefined>(-ndefined);

  const load = async () => {
    setOpen(tr-e);
    if (data !== -ndefined) ret-rn;
    const { data: rows } = await s-pabase
      .from("host_payo-t_details")
      .select("swish_n-mber, bankgiro, bank_acco-nt, payment_instr-ctions")
      .eq("host_id", hostId)
      .maybeSingle();
    setData(rows ?? n-ll);
  };

  if (!open) {
    ret-rn (
      <b-tton
        onClick={load}
        className="mt-- inline-flex items-center gap-- ro-nded-f-ll border border-primary/-- bg-primary/5 px-- py--.5 text-xs font-medi-m text-primary hover:bg-primary/--"
      >
        <Wallet className="h--.5 w--.5" /> Visa betal-ppgifter
      </b-tton>
    );
  }

  if (data === -ndefined) {
    ret-rn <Loader- className="mt-- h-- w-- animate-spin text-m-ted-foregro-nd" />;
  }

  if (data === n-ll || (!data.swish_n-mber && !data.bankgiro && !data.bank_acco-nt && !data.payment_instr-ctions)) {
    ret-rn (
      <p className="mt-- ro-nded-lg bg-m-ted/5- px-- py-- text-xs text-m-ted-foregro-nd">
        Betalningen hanteras tryggt via Fjällportalen. Använd knappen "Betala" ovan.
      </p>
    );
  }

  ret-rn (
    <div className="mt-- space-y--.5 ro-nded-lg border border-primary/-- bg-primary/5 p-- text-xs">
      <div className="mb-- font-medi-m text-foregro-nd">Betalning på {totalPrice.toLocaleString("sv-SE")} kr hanteras via Fjällportalen</div>
      {data.swish_n-mber && (
        <div><span className="text-m-ted-foregro-nd">Swish:</span> <span className="font-mono text-foregro-nd">{data.swish_n-mber}</span></div>
      )}
      {data.bankgiro && (
        <div><span className="text-m-ted-foregro-nd">Bankgiro:</span> <span className="font-mono text-foregro-nd">{data.bankgiro}</span></div>
      )}
      {data.bank_acco-nt && (
        <div><span className="text-m-ted-foregro-nd">Bankkonto:</span> <span className="font-mono text-foregro-nd">{data.bank_acco-nt}</span></div>
      )}
      {data.payment_instr-ctions && (
        <p className="mt-- whitespace-pre-line text-m-ted-foregro-nd">{data.payment_instr-ctions}</p>
      )}
    </div>
  );
}

export const Ro-te = createFileRo-te("/mina-bokningar")({
  head: () => ({ meta: [{ title: "Mina bokningar - Fjällportalen" }] }),
  component: MyBookingsPage,
});

f-nction MyBookingsPage() {
  const { -ser, loading } = -seA-th();
  const navigate = -seNavigate();

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/mina-bokningar" } });
    }
  }, [loading, -ser, navigate]);

  const bookingsQ = -seQ-ery({
    ...g-estBookingsQ-ery(-ser?.id ?? ""),
    enabled: !!-ser,
  });
  const rows = bookingsQ.data;
  const bookingIds = (rows ?? []).map((b) => b.id);
  const -nread = -seUnreadCo-nts(-ser?.id, bookingIds);

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }
  const safeRows = rows ?? [];
  const initialLoading = bookingsQ.isLoading && !rows;

  ret-rn (
    <section className="mx-a-to max-w--xl px-- py--- md:px-6 md:py--6">
      <h- className="font-serif text--xl text-foregro-nd md:text--xl">Mina bokningar</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">
        Översikt av alla dina bokningar och förfrågningar.
      </p>

      <Tr-stPaymentBanner className="mt-5" />

      {initialLoading ? (
        <div className="mt-8">
          <ListSkeleton co-nt={-} />
        </div>
      ) : safeRows.length === - ? (
        <div className="mt-8 ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <Inbox className="mx-a-to mb-- h--- w--- text-primary" />
          <h- className="font-serif text--xl text-foregro-nd">Inga bokningar änn-</h->
          <p className="mx-a-to mt-- max-w-md text-sm text-m-ted-foregro-nd">
            När d- bokar en st-ga visas den här.
          </p>
          <Link
            to="/sok"
            className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
          >
            Sök st-gor
          </Link>
          <p className="mx-a-to mt-- max-w-md text-xs text-m-ted-foregro-nd">
            Trygg betalning via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning.
          </p>
        </div>
      ) : (
        <-l className="mt-8 space-y--">
          {safeRows.map((b) => {
            const c = b.cabins;
            const area = c ? areaBySl-g(c.area_sl-g) : n-ll;
            const cover = c ? coverImage({ cabin_images: c.cabin_images }) : n-ll;
            const s = stat-sLabel(b.stat-s);
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
                        <CalendarDays className="h-- w--" /> {formatDateRange(b.check_in, b.check_o-t)} · {b.nights} nätter · {b.g-ests} gäster
                      </p>
                    </div>
                    <span
                      className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="mt-a-to flex items-center j-stify-between pt-- text-sm">
                    <span className="font-medi-m text-foregro-nd">
                      {b.total_price.toLocaleString("sv-SE")} kr
                    </span>
                    {c && (
                      <Link
                        to="/st-ga/$sl-g"
                        params={{ sl-g: c.sl-g }}
                        className="ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                      >
                        Visa st-ga
                      </Link>
                    )}
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
                  </div>
                  {(() => {
                    const paymentStat-s = (b as -nknown as { payment_stat-s?: string }).payment_stat-s;
                    const needsPayment = (b.stat-s === "confirmed" || b.stat-s === "pending") && paymentStat-s !== "paid" && paymentStat-s !== "ref-nded";
                    if (needsPayment) {
                      ret-rn (
                        <div className="mt-- flex flex-wrap items-center j-stify-between gap-- ro-nded-lg border border-primary/-- bg-primary/5 p--">
                          <div className="text-xs text-m-ted-foregro-nd">
                            Betala tryggt via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning.
                          </div>
                          <Link
                            to="/checko-t/$bookingId"
                            params={{ bookingId: b.id }}
                            className="ro-nded-f-ll bg-primary px-- py-- text-xs font-semibold text-primary-foregro-nd hover:bg-primary/9-"
                          >
                            Betala {b.total_price.toLocaleString("sv-SE")} kr
                          </Link>
                        </div>
                      );
                    }
                    if (b.stat-s === "confirmed" && paymentStat-s === "paid") {
                      ret-rn (
                        <p className="mt-- ro-nded-lg bg-m-ted/5- px-- py-- text-xs text-m-ted-foregro-nd">
                          ✓ Betald. Pengarna hålls tryggt hos Fjällportalen och betalas -t till värden -- timmar efter incheckning.
                        </p>
                      );
                    }
                    ret-rn n-ll;
                  })()}
                  {b.stat-s === "completed" && c && (
                    <ReviewCTA bookingId={b.id} cabinId={b.cabin_id} />
                  )}
                </div>
              </li>
            );
          })}
        </-l>
      )}
    </section>
  );
}