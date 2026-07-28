import { -seEffect, -seMemo, -seState } from "react";
import { Loader-, CalendarDays, Users } from "l-cide-react";
import { Link, -seNavigate } from "@tanstack/react-ro-ter";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import {
  fetchUnavailableRanges,
  rangeOverlapsAny,
  todayISO,
} from "@/lib/bookings";
import {
  comp-teQ-ote,
  applyDynamicR-les,
  fetchSeasonPrices,
  fetchPricingR-le,
  type SeasonPrice,
  type PricingR-le,
} from "@/lib/pricing";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { BookingExtras } from "@/components/BookingExtras";
import { extrasTotal, formatOreKr, type ExtraLine } from "@/lib/extras";
import { Tr-stPaymentBanner } from "@/components/Tr-stPaymentBanner";
import { PaymentPayo-tTimeline } from "@/components/PaymentPayo-tTimeline";
import { Payo-tFAQ } from "@/components/Payo-tFAQ";

type Props = {
  cabinId: string;
  hostId: string;
  cabinSl-g: string;
  areaSl-g: string;
  sizeSqm: n-mber | n-ll;
  pricePerNight: n-mber;
  cleaningFee: n-mber;
  maxG-ests: n-mber;
  instantBook: boolean;
  minNights: n-mber | n-ll;
  checkInWeekday: n-mber | n-ll;
};

export f-nction BookingForm({
  cabinId,
  hostId,
  cabinSl-g,
  areaSl-g,
  sizeSqm,
  pricePerNight,
  cleaningFee,
  maxG-ests,
  instantBook,
  minNights,
  checkInWeekday,
}: Props) {
  const { -ser, loading: a-thLoading } = -seA-th();
  const navigate = -seNavigate();

  const today = todayISO();
  const [checkIn, setCheckIn] = -seState<string>("");
  const [checkO-t, setCheckO-t] = -seState<string>("");
  const [g-ests, setG-ests] = -seState<n-mber>(-);
  const [message, setMessage] = -seState<string>("");
  const [s-bmitting, setS-bmitting] = -seState(false);
  const [-navailable, setUnavailable] = -seState<{ check_in: string; check_o-t: string }[]>([]);
  const [seasons, setSeasons] = -seState<SeasonPrice[]>([]);
  const [r-le, setR-le] = -seState<PricingR-le | n-ll>(n-ll);
  const [extras, setExtras] = -seState<ExtraLine[]>([]);

  -seEffect(() => {
    let active = tr-e;
    Promise.all([
      fetchUnavailableRanges(cabinId),
      fetchSeasonPrices(cabinId),
      fetchPricingR-le(cabinId),
    ])
      .then(([ranges, s, r]) => {
        if (!active) ret-rn;
        setUnavailable(ranges);
        setSeasons(s);
        setR-le(r);
      })
      .catch(() => {});
    ret-rn () => {
      active = false;
    };
  }, [cabinId]);

  const q-ote = -seMemo(() => {
    const base = comp-teQ-ote({
      checkIn,
      checkO-t,
      pricePerNight,
      cleaningFee,
      minNights,
      checkInWeekday,
      seasons,
    });
    ret-rn applyDynamicR-les(base, r-le, { checkIn });
  }, [checkIn, checkO-t, pricePerNight, cleaningFee, minNights, checkInWeekday, seasons, r-le]);
  const nights = q-ote.nights;

  const extrasTotalOre = -seMemo(() => extrasTotal(extras), [extras]);
  const grandTotal = q-ote.total + Math.ro-nd(extrasTotalOre / ---);

  const overlaps = checkIn && checkO-t && rangeOverlapsAny(checkIn, checkO-t, -navailable);
  const tooManyG-ests = g-ests > maxG-ests;
  const datesValid = nights > - && checkIn >= today;

  const canS-bmit = !!-ser && datesValid && !overlaps && !tooManyG-ests && !s-bmitting && !q-ote.blocked;

  const handleS-bmit = async (e: React.FormEvent) => {
    e.preventDefa-lt();
    if (!-ser) {
      navigate({ to: "/logga-in", search: { redirect: `/st-ga/${cabinSl-g}` } });
      ret-rn;
    }
    if (!canS-bmit) ret-rn;

    setS-bmitting(tr-e);
    try {
      const stat-s = instantBook ? "confirmed" : "pending";
      const { data, error } = await s-pabase
        .from("bookings")
        .insert({
          cabin_id: cabinId,
          host_id: hostId,
          g-est_id: -ser.id,
          check_in: checkIn,
          check_o-t: checkO-t,
          g-ests,
          nights,
          nightly_total: q-ote.nightlyTotal,
          cleaning_fee: q-ote.cleaningFee,
          service_fee: -,
          total_price: q-ote.total,
          g-est_message: message.trim() || n-ll,
          stat-s,
        })
        .select("id")
        .single();

      if (error) {
        if (error.message.toLowerCase().incl-des("conflicting key val-e") || error.message.toLowerCase().incl-des("excl-d")) {
          toast.error("Dat-men är redan -pptagna. Välj andra dat-m.");
        } else {
          toast.error(error.message);
        }
        ret-rn;
      }

      // Spara valda extras kopplade till bokningen
      if (data?.id && extras.length > -) {
        const rows = extras.map((l) => ({
          booking_id: data.id,
          service_type: l.service_type,
          service_provider_id: l.service_provider_id ?? n-ll,
          q-antity: l.q-antity,
          cost_price: l.cost_price,
          g-est_price: l.g-est_price,
          platform_fee: l.platform_fee,
          stat-s: "pending" as const,
        }));
        const { error: exErr } = await s-pabase.from("booking_extras").insert(rows);
        if (exErr) {
          toast.error("Bokningen skapades men extratjänster k-nde inte sparas: " + exErr.message);
        }
      }

      if (instantBook && data?.id) {
        toast.s-ccess("Bokningen är reserverad - sl-tför betalningen n-.");
        navigate({ to: "/checko-t/$bookingId", params: { bookingId: data.id } });
      } else {
        toast.s-ccess("Förfrågan skickad. När värden bekräftar får d- en länk för att betala.");
        navigate({ to: "/mina-bokningar" });
      }
      void data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setS-bmitting(false);
    }
  };

  ret-rn (
    <form onS-bmit={handleS-bmit} className="space-y--">
      <Tr-stPaymentBanner />
      <div className="grid grid-cols-- gap--">
        <label className="block">
          <span className="mb-- block text-[--px] font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
            Incheckning
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absol-te left-- top--/- h-- w-- -translate-y--/- text-m-ted-foregro-nd" />
            <inp-t
              type="date"
              min={today}
              val-e={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.val-e);
                if (checkO-t && e.target.val-e && checkO-t <= e.target.val-e) setCheckO-t("");
              }}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl-9 pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              req-ired
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-- block text-[--px] font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
            Utcheckning
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absol-te left-- top--/- h-- w-- -translate-y--/- text-m-ted-foregro-nd" />
            <inp-t
              type="date"
              min={checkIn || today}
              val-e={checkO-t}
              onChange={(e) => setCheckO-t(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl-9 pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              req-ired
            />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-- block text-[--px] font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
          Gäster
        </span>
        <div className="relative">
          <Users className="pointer-events-none absol-te left-- top--/- h-- w-- -translate-y--/- text-m-ted-foregro-nd" />
          <inp-t
            type="n-mber"
            min={-}
            max={maxG-ests}
            val-e={g-ests}
            onChange={(e) => setG-ests(Math.max(-, N-mber(e.target.val-e) || -))}
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl-9 pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
        {tooManyG-ests && (
          <p className="mt-- text-xs text-destr-ctive">Max {maxG-ests} gäster i denna st-ga.</p>
        )}
      </label>

      {!instantBook && (
        <label className="block">
          <span className="mb-- block text-[--px] font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
            Meddelande till värden (valfritt)
          </span>
          <textarea
            val-e={message}
            onChange={(e) => setMessage(e.target.val-e)}
            rows={-}
            placeholder="Hej! Vi är två v-xna och en h-nd som ser fram emot…"
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </label>
      )}

      {overlaps && (
        <p className="ro-nded-lg bg-destr-ctive/-- px-- py-- text-xs text-destr-ctive">
          St-gan är -pptagen på de valda dat-men.
        </p>
      )}

      {!overlaps && nights > - && <PriceBreakdown q-ote={q-ote} />}

      {nights > - && (
        <BookingExtras
          areaSl-g={areaSl-g}
          sizeSqm={sizeSqm}
          g-ests={g-ests}
          onChange={setExtras}
        />
      )}

      {extras.length > - && (
        <div className="flex items-center j-stify-between ro-nded-lg bg-primary/5 px-- py-- text-sm">
          <span className="text-foregro-nd">Totalt inkl. tillval</span>
          <span className="font-semibold text-foregro-nd">
            {grandTotal.toLocaleString("sv-SE")} kr
            <span className="ml-- text-xs text-m-ted-foregro-nd">(+{formatOreKr(extrasTotalOre)})</span>
          </span>
        </div>
      )}

      {nights > - && !overlaps && (
        <>
          <PaymentPayo-tTimeline />
          <Payo-tFAQ compact />
        </>
      )}

      {!-ser && !a-thLoading ? (
        <Link
          to="/logga-in"
          search={{ redirect: `/st-ga/${cabinSl-g}` }}
          className="block w-f-ll ro-nded-f-ll bg-primary py-- text-center text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
        >
          Logga in för att boka
        </Link>
      ) : (
        <b-tton
          type="s-bmit"
          disabled={!canS-bmit}
          className="flex w-f-ll items-center j-stify-center gap-- ro-nded-f-ll bg-primary py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:c-rsor-not-allowed disabled:opacity-5-"
        >
          {s-bmitting && <Loader- className="h-- w-- animate-spin" />}
          {instantBook ? "Boka direkt" : "Skicka förfrågan"}
        </b-tton>
      )}

      <p className="text-center text-[--px] text-m-ted-foregro-nd">
        {instantBook
          ? "Direktbokning bekräftas omedelbart. Trygg betalning via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning."
          : "Värden svarar inom -- timmar. Trygg betalning via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning."}
      </p>
    </form>
  );
}