import { useEffect, useMemo, useState } from "react";
import { Loader2, CalendarDays, Users } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  calcQuote,
  diffNights,
  fetchUnavailableRanges,
  rangeOverlapsAny,
  todayISO,
} from "@/lib/bookings";

type Props = {
  cabinId: string;
  hostId: string;
  cabinSlug: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  instantBook: boolean;
};

export function BookingForm({
  cabinId,
  hostId,
  cabinSlug,
  pricePerNight,
  cleaningFee,
  maxGuests,
  instantBook,
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

  useEffect(() => {
    let active = true;
    fetchUnavailableRanges(cabinId)
      .then((r) => {
        if (active) setUnavailable(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cabinId]);

  const nights = diffNights(checkIn, checkOut);
  const quote = useMemo(
    () => (nights > 0 ? calcQuote({ pricePerNight, cleaningFee, nights }) : null),
    [pricePerNight, cleaningFee, nights],
  );

  const overlaps = checkIn && checkOut && rangeOverlapsAny(checkIn, checkOut, unavailable);
  const tooManyGuests = guests > maxGuests;
  const datesValid = nights > 0 && checkIn >= today;

  const canSubmit = !!user && datesValid && !overlaps && !tooManyGuests && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/logga-in", search: { redirect: `/stuga/${cabinSlug}` } });
      return;
    }
    if (!quote || !canSubmit) return;

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
          service_fee: quote.serviceFee,
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

      {quote && !overlaps && (
        <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between text-foreground">
            <span>
              {pricePerNight.toLocaleString("sv-SE")} kr × {nights} nätter
            </span>
            <span>{quote.nightlyTotal.toLocaleString("sv-SE")} kr</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Städavgift</span>
              <span>{quote.cleaningFee.toLocaleString("sv-SE")} kr</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium text-foreground">
            <span>Totalt till värden</span>
            <span>{quote.total.toLocaleString("sv-SE")} kr</span>
          </div>
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
          : "Värden svarar inom 24 timmar. Betalning sker direkt mellan dig och värden — Fjällmys hanterar inte pengarna."}
      </p>
    </form>
  );
}