import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarDays, Users } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchUnavailableRanges,
  rangeOverlapsAny,
  todayISO,
} from "@/lib/bookings";
import {
  computeQuote,
  applyDynamicRules,
  fetchSeasonPrices,
  fetchPricingRule,
  type SeasonPrice,
  type PricingRule,
} from "@/lib/pricing";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { BookingExtras } from "@/components/BookingExtras";
import { extrasTotal, formatOreKr, type ExtraLine } from "@/lib/extras";

type Props = {
  cabinId: string;
  hostId: string;
  cabinSlug: string;
  areaSlug: string;
  sizeSqm: number | null;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  instantBook: boolean;
  minNights: number | null;
  checkInWeekday: number | null;
};

export function BookingForm({
  cabinId,
  hostId,
  cabinSlug,
  areaSlug,
  sizeSqm,
  pricePerNight,
  cleaningFee,
  maxGuests,
  instantBook,
  minNights,
  checkInWeekday,
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const today = todayISO();
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [unavailable, setUnavailable] = useState<{ check_in: string; check_out: string }[]>([]);
  const [seasons, setSeasons] = useState<SeasonPrice[]>([]);
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [extras, setExtras] = useState<ExtraLine[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchUnavailableRanges(cabinId),
      fetchSeasonPrices(cabinId),
      fetchPricingRule(cabinId),
    ])
      .then(([ranges, s, r]) => {
        if (!active) return;
        setUnavailable(ranges);
        setSeasons(s);
        setRule(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cabinId]);

  const quote = useMemo(() => {
    const base = computeQuote({
      checkIn,
      checkOut,
      pricePerNight,
      cleaningFee,
      minNights,
      checkInWeekday,
      seasons,
    });
    return applyDynamicRules(base, rule, { checkIn });
  }, [checkIn, checkOut, pricePerNight, cleaningFee, minNights, checkInWeekday, seasons, rule]);
  const nights = quote.nights;

  const extrasTotalOre = useMemo(() => extrasTotal(extras), [extras]);
  const grandTotal = quote.total + Math.round(extrasTotalOre / 100);

  const overlaps = checkIn && checkOut && rangeOverlapsAny(checkIn, checkOut, unavailable);
  const tooManyGuests = guests > maxGuests;
  const datesValid = nights > 0 && checkIn >= today;

  const canSubmit = !!user && datesValid && !overlaps && !tooManyGuests && !submitting && !quote.blocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/logga-in", search: { redirect: `/stuga/${cabinSlug}` } });
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const status = instantBook ? "confirmed" : "pending";
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          cabin_id: cabinId,
          host_id: hostId,
          guest_id: user.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          nights,
          nightly_total: quote.nightlyTotal,
          cleaning_fee: quote.cleaningFee,
          service_fee: 0,
          total_price: quote.total,
          guest_message: message.trim() || null,
          status,
        })
        .select("id")
        .single();

      if (error) {
        if (error.message.toLowerCase().includes("conflicting key value") || error.message.toLowerCase().includes("exclud")) {
          toast.error("Datumen är redan upptagna. Välj andra datum.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Spara valda extras kopplade till bokningen
      if (data?.id && extras.length > 0) {
        const rows = extras.map((l) => ({
          booking_id: data.id,
          service_type: l.service_type,
          service_provider_id: l.service_provider_id ?? null,
          quantity: l.quantity,
          cost_price: l.cost_price,
          guest_price: l.guest_price,
          platform_fee: l.platform_fee,
          status: "pending" as const,
        }));
        const { error: exErr } = await supabase.from("booking_extras").insert(rows);
        if (exErr) {
          toast.error("Bokningen skapades men extratjänster kunde inte sparas: " + exErr.message);
        }
      }

      toast.success(
        instantBook
          ? "Bokningen är bekräftad! Värden hör av sig om betalningen."
          : "Förfrågan skickad. Värden svarar inom 24 timmar.",
      );
      navigate({ to: "/mina-bokningar" });
      void data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Incheckning
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut("");
              }}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Utcheckning
          </span>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Gäster
        </span>
        <div className="relative">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            min={1}
            max={maxGuests}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {tooManyGuests && (
          <p className="mt-1 text-xs text-destructive">Max {maxGuests} gäster i denna stuga.</p>
        )}
      </label>

      {!instantBook && (
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Meddelande till värden (valfritt)
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Hej! Vi är två vuxna och en hund som ser fram emot…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      )}

      {overlaps && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Stugan är upptagen på de valda datumen.
        </p>
      )}

      {!overlaps && nights > 0 && <PriceBreakdown quote={quote} />}

      {nights > 0 && (
        <BookingExtras
          areaSlug={areaSlug}
          sizeSqm={sizeSqm}
          guests={guests}
          onChange={setExtras}
        />
      )}

      {extras.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
          <span className="text-foreground">Totalt inkl. tillval</span>
          <span className="font-semibold text-foreground">
            {grandTotal.toLocaleString("sv-SE")} kr
            <span className="ml-1 text-xs text-muted-foreground">(+{formatOreKr(extrasTotalOre)})</span>
          </span>
        </div>
      )}

      {!user && !authLoading ? (
        <Link
          to="/logga-in"
          search={{ redirect: `/stuga/${cabinSlug}` }}
          className="block w-full rounded-full bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Logga in för att boka
        </Link>
      ) : (
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {instantBook ? "Boka direkt" : "Skicka förfrågan"}
        </button>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        {instantBook
          ? "Direktbokning bekräftas omedelbart. Betalning sker direkt till värden (Swish, faktura eller efter överenskommelse)."
          : "Värden svarar inom 24 timmar. Betalning sker direkt mellan dig och värden — Fjällportalen hanterar inte pengarna."}
      </p>
    </form>
  );
}