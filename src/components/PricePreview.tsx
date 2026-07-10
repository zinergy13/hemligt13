import { useEffect, useMemo, useState } from "react";
import { Loader2, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeQuote,
  applyDynamicRules,
  fetchSeasonPrices,
  fetchPricingRule,
  type SeasonPrice,
  type PricingRule,
} from "@/lib/pricing";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { areaBySlug } from "@/data/areas";

type CabinLite = {
  id: string;
  title: string;
  area_slug: string;
  price_per_night: number;
  cleaning_fee: number;
  min_nights: number | null;
  check_in_weekday: number | null;
};

const WEEKDAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function PricePreview({ hostId }: { hostId: string }) {
  const [cabins, setCabins] = useState<CabinLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [checkIn, setCheckIn] = useState<string>(() => addDays(todayIso(), 30));
  const [checkOut, setCheckOut] = useState<string>(() => addDays(todayIso(), 37));
  const [seasons, setSeasons] = useState<SeasonPrice[]>([]);
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("cabins")
        .select("id, title, area_slug, price_per_night, cleaning_fee, min_nights, check_in_weekday")
        .eq("host_id", hostId)
        .order("title");
      setLoading(false);
      if (error) return;
      const rows = (data ?? []) as CabinLite[];
      setCabins(rows);
      if (rows.length > 0) setSelectedId(rows[0].id);
    })();
  }, [hostId]);

  useEffect(() => {
    if (!selectedId) {
      setSeasons([]);
      setRule(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    Promise.all([fetchSeasonPrices(selectedId), fetchPricingRule(selectedId)])
      .then(([s, r]) => {
        if (cancelled) return;
        setSeasons(s);
        setRule(r);
      })
      .finally(() => !cancelled && setPriceLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedCabin = cabins.find((c) => c.id === selectedId);

  const quote = useMemo(() => {
    if (!selectedCabin) return null;
    const base = computeQuote({
      checkIn,
      checkOut,
      pricePerNight: selectedCabin.price_per_night,
      cleaningFee: selectedCabin.cleaning_fee ?? 0,
      minNights: selectedCabin.min_nights,
      checkInWeekday: selectedCabin.check_in_weekday,
      seasons,
    });
    return applyDynamicRules(base, rule, { checkIn });
  }, [selectedCabin, checkIn, checkOut, seasons, rule]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar stugor...
        </div>
      </section>
    );
  }

  if (cabins.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
          <Calculator className="h-5 w-5 text-primary" /> Prisförhandsvisning
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lägg upp en stuga för att förhandsvisa priser här.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
      <div>
        <h2 className="flex items-center gap-2 font-serif text-xl text-foreground">
          <Calculator className="h-5 w-5 text-primary" /> Prisförhandsvisning
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Välj stuga och datum för att se exakt vad en gäst betalar — inklusive veckopris,
          helgtillägg och dynamiska rabatter.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-foreground">Stuga</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {cabins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {areaBySlug(c.area_slug)?.name ?? c.area_slug}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Incheckning</label>
          <input
            type="date"
            value={checkIn}
            min={todayIso()}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 7));
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Utcheckning</label>
          <input
            type="date"
            value={checkOut}
            min={addDays(checkIn, 1)}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setCheckIn(addDays(todayIso(), 30));
              setCheckOut(addDays(todayIso(), 37));
            }}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Återställ (7 nätter)
          </button>
        </div>
      </div>

      {selectedCabin?.check_in_weekday !== null && selectedCabin?.check_in_weekday !== undefined && (
        <div className="text-xs text-muted-foreground">
          In-/utcheckning krävs på <strong>{WEEKDAYS[selectedCabin.check_in_weekday]}</strong>
          {selectedCabin.min_nights ? ` · min ${selectedCabin.min_nights} nätter` : ""}
        </div>
      )}

      {priceLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Beräknar pris...
        </div>
      ) : (
        quote && <PriceBreakdown quote={quote} />
      )}

      {quote && quote.adjustmentsTotal !== 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Prisregler tillämpade: netto {quote.adjustmentsTotal < 0 ? "−" : "+"}
          {Math.abs(quote.adjustmentsTotal).toLocaleString("sv-SE")} kr utifrån bokningsdatum och längd.
        </div>
      )}
    </section>
  );
}