import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Loader2, Calculator, AlertTriangle, CheckCircle2, CalendarClock, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeQuote,
  applyDynamicRules,
  fetchSeasonPrices,
  fetchPricingRule,
  type SeasonPrice,
  type PricingRule,
  type Quote,
  type NightBreakdown,
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
const WEEKDAYS_LONG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build display rows for the per-night list from the SAME quote used by the
 * PriceBreakdown summary. This guarantees prices always match after any date
 * change or one-click fix - there is only one source of truth: computeQuote.
 */
function nightRowsFromQuote(
  quote: Quote,
  checkIn: string,
  checkOut: string,
  checkInWeekday: number | null,
): Array<NightBreakdown & { breaksWeekday: boolean }> {
  const rows = quote.nightBreakdown.map((r) => ({ ...r, breaksWeekday: false }));
  if (rows.length === 0 || checkInWeekday === null || checkInWeekday === undefined) {
    return rows;
  }
  // Flag the check-in night if its weekday breaks the required pattern.
  const inDay = new Date(checkIn + "T00:00:00Z").getUTCDay();
  if (inDay !== checkInWeekday) rows[0].breaksWeekday = true;
  // Flag the last night when the check-out day breaks the pattern.
  const outDay = new Date(checkOut + "T00:00:00Z").getUTCDay();
  if (outDay !== checkInWeekday) rows[rows.length - 1].breaksWeekday = true;
  return rows;
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", timeZone: "UTC" });
}
function fmtDateLong(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
function nextWeekday(fromIso: string, target: number): string {
  const d = new Date(fromIso + "T00:00:00Z");
  const cur = d.getUTCDay();
  const diff = (target - cur + 7) % 7 || 7; // always land on a FUTURE matching weekday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
function activeSeasonMinNights(iso: string, seasons: SeasonPrice[]): number | null {
  const s = seasons.find((s) => iso >= s.start_date && iso <= s.end_date);
  return s?.min_nights ?? null;
}
function nightsBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000));
}

function kr(n: number) {
  return `${n.toLocaleString("sv-SE")} kr`;
}

function NightList({
  rows,
  requiredWeekday,
}: {
  rows: Array<NightBreakdown & { breaksWeekday: boolean }>;
  requiredWeekday: number | null;
}) {
  if (rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.total, 0);
  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Pris per natt</span>
        <span>{rows.length} nätter</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => {
          const isWeekend = r.weekday === 5 || r.weekday === 6;
          return (
            <li key={r.date} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="font-medium">{WEEKDAYS[r.weekday]} {fmtDate(r.date)}</span>
                  {isWeekend && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Helg
                    </span>
                  )}
                  {r.breaksWeekday && requiredWeekday !== null && (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700 dark:text-red-300">
                      Bryter {WEEKDAYS_LONG[requiredWeekday]}-byte
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.label} · {kr(r.rate)}
                  {r.weekly && <> · veckopris</>}
                  {r.weekendSurcharge > 0 && <> · helgtillägg +{kr(r.weekendSurcharge)}</>}
                </div>
              </div>
              <div className="text-right font-medium text-foreground">{kr(r.total)}</div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
        <span className="text-muted-foreground">Summa nätter</span>
        <span className="font-semibold text-foreground">{kr(total)}</span>
      </div>
    </div>
  );
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
  const [flashKey, setFlashKey] = useState(0);
  const [justFixed, setJustFixed] = useState(false);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
  }, []);

  // Apply date changes synchronously so the price preview and night list
  // repaint in the same frame as the click, then flash a visual confirmation.
  const applyDateFix = (nextIn: string, nextOut: string) => {
    flushSync(() => {
      setCheckIn(nextIn);
      setCheckOut(nextOut);
    });
    // Restart the flash cleanly on every click - clear any pending reset,
    // bump the key so the animation re-mounts, and re-arm the confirmation.
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    flushSync(() => {
      setJustFixed(false);
    });
    setFlashKey((k) => k + 1);
    setJustFixed(true);
    if (typeof window !== "undefined") {
      flashTimerRef.current = window.setTimeout(() => {
        setJustFixed(false);
        flashTimerRef.current = null;
      }, 1400);
    }
  };

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

  // Memoize the selected cabin by id so its reference is stable across
  // re-renders that only touch flash state - otherwise every render of
  // this component invalidates every downstream useMemo.
  const selectedCabin = useMemo(
    () => cabins.find((c) => c.id === selectedId) ?? null,
    [cabins, selectedId],
  );

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

  // Night rows only need to rebuild when the underlying quote (or the
  // required weekday) changes - decoupled from flashKey/justFixed rerenders.
  const nightRows = useMemo(
    () =>
      quote && selectedCabin
        ? nightRowsFromQuote(quote, checkIn, checkOut, selectedCabin.check_in_weekday)
        : [],
    [quote, checkIn, checkOut, selectedCabin],
  );

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
          Välj stuga och datum för att se exakt vad en gäst betalar - inklusive veckopris,
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
                {c.title} - {areaBySlug(c.area_slug)?.name ?? c.area_slug}
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

      {selectedCabin && (
        <div className="text-xs text-muted-foreground">
          {selectedCabin.check_in_weekday !== null && selectedCabin.check_in_weekday !== undefined && (
            <>In-/utcheckning krävs på <strong>{WEEKDAYS[selectedCabin.check_in_weekday]}</strong> · </>
          )}
          {selectedCabin.min_nights ? `stuga min ${selectedCabin.min_nights} nätter` : "ingen stugatröskel"}
          {seasons.length > 0 && (
            <> · säsongströskel kan vara högre för vald period</>
          )}
        </div>
      )}

      {!priceLoading && selectedCabin && quote && quote.nights > 0 && (
        <ValidationPanel
          checkIn={checkIn}
          checkOut={checkOut}
          nights={quote.nights}
          cabinMinNights={selectedCabin.min_nights}
          seasonMinNights={activeSeasonMinNights(checkIn, seasons)}
          requiredWeekday={selectedCabin.check_in_weekday}
          onFixCheckIn={(iso) => {
            const currentNights = nightsBetween(checkIn, checkOut);
            applyDateFix(iso, addDays(iso, Math.max(currentNights, 1)));
          }}
          onFixCheckOut={(iso) => applyDateFix(checkIn, iso)}
          onExtendToMinNights={(min) => applyDateFix(checkIn, addDays(checkIn, min))}
          onFixAll={(inIso, outIso) => applyDateFix(inIso, outIso)}
        />
      )}

      {priceLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Beräknar pris...
        </div>
      ) : (
        quote && (
          <div
            key={`bd-${flashKey}`}
            className={justFixed ? "animate-in fade-in zoom-in-[0.99] duration-500 rounded-2xl ring-2 ring-primary/50 transition-shadow" : "transition-shadow"}
          >
            {justFixed && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Uppdaterat med nya datum
              </div>
            )}
            <PriceBreakdown quote={quote} />
          </div>
        )
      )}

      {!priceLoading && selectedCabin && quote && quote.nights > 0 && (
        <div
          key={`nl-${flashKey}`}
          className={justFixed ? "animate-in fade-in duration-500" : undefined}
        >
          <NightList rows={nightRows} requiredWeekday={selectedCabin.check_in_weekday} />
        </div>
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
function ValidationPanel({
  checkIn,
  checkOut,
  nights,
  cabinMinNights,
  seasonMinNights,
  requiredWeekday,
  onFixCheckIn,
  onFixCheckOut,
  onExtendToMinNights,
  onFixAll,
}: {
  checkIn: string;
  checkOut: string;
  nights: number;
  cabinMinNights: number | null;
  seasonMinNights: number | null;
  requiredWeekday: number | null;
  onFixCheckIn: (iso: string) => void;
  onFixCheckOut: (iso: string) => void;
  onExtendToMinNights: (min: number) => void;
  onFixAll: (checkIn: string, checkOut: string) => void;
}) {
  const errors: { title: string; detail: string; fix?: { label: string; onClick: () => void } }[] = [];

  const effectiveMin = Math.max(cabinMinNights ?? 0, seasonMinNights ?? 0);
  if (effectiveMin > 0 && nights < effectiveMin) {
    const cabinPart = cabinMinNights ? `stugans minimum ${cabinMinNights} nätter` : "ingen stugatröskel";
    const seasonPart = seasonMinNights ? `säsongens minimum ${seasonMinNights} nätter` : "ingen säsongs-tröskel";
    const governing = seasonMinNights && seasonMinNights >= (cabinMinNights ?? 0) ? "säsongens tröskel styr" : "stugans tröskel styr";
    errors.push({
      title: `För få nätter (${nights} av ${effectiveMin} krävs)`,
      detail: `Gällande tröskel: ${effectiveMin} nätter (${cabinPart}, ${seasonPart}). ${governing}. Förläng utcheckningen eller välj en period utanför säsongen.`,
      fix: {
        label: `Förläng till ${effectiveMin} nätter`,
        onClick: () => onExtendToMinNights(effectiveMin),
      },
    });
  }

  if (requiredWeekday !== null && requiredWeekday !== undefined) {
    const inDay = new Date(checkIn + "T00:00:00Z").getUTCDay();
    const outDay = new Date(checkOut + "T00:00:00Z").getUTCDay();
    const target = WEEKDAYS_LONG[requiredWeekday];

    if (inDay !== requiredWeekday) {
      const suggestion = nextWeekday(checkIn, requiredWeekday);
      errors.push({
        title: `Incheckning måste ske på en ${target}`,
        detail: `Du valde ${WEEKDAYS_LONG[inDay]} ${fmtDate(checkIn)}. Denna stuga hyrs ut från ${target} till ${target}.`,
        fix: {
          label: `Flytta till ${fmtDateLong(suggestion)}`,
          onClick: () => onFixCheckIn(suggestion),
        },
      });
    }

    if (outDay !== requiredWeekday && inDay === requiredWeekday) {
      // Suggest next matching weekday after check-in
      const suggestion = nextWeekday(checkIn, requiredWeekday);
      errors.push({
        title: `Utcheckning måste ske på en ${target}`,
        detail: `Du valde ${WEEKDAYS_LONG[outDay]} ${fmtDate(checkOut)}. Utcheckning ska ske samma veckodag som incheckningen.`,
        fix: {
          label: `Flytta till ${fmtDateLong(suggestion)}`,
          onClick: () => onFixCheckOut(suggestion),
        },
      });
    }
  }

  if (errors.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <div className="font-medium text-foreground">Bokningen är giltig</div>
          <div className="text-xs text-muted-foreground">
            Datumen uppfyller reglerna: minst {effectiveMin} nätter
            {cabinMinNights && seasonMinNights
              ? ` (säsongens ${seasonMinNights} nätter överstiger stugans ${cabinMinNights})`
              : ""}
            {requiredWeekday !== null && requiredWeekday !== undefined ? " och rätt veckoväxling." : "."}
          </div>
        </div>
      </div>
    );
  }

  // Combined auto-fix: pick the next valid check-in on required weekday (or keep
  // current check-in when it already matches / no weekday rule) and set nights
  // to satisfy min-nights. When a weekday rule exists, round up to whole weeks
  // so check-out also lands on the same weekday.
  let combined: { checkIn: string; checkOut: string } | null = null;
  if (errors.length >= 2) {
    const today = todayIso();
    let newIn = checkIn;
    if (requiredWeekday !== null && requiredWeekday !== undefined) {
      const inDay = new Date(checkIn + "T00:00:00Z").getUTCDay();
      if (inDay !== requiredWeekday) newIn = nextWeekday(checkIn, requiredWeekday);
    }
    if (newIn < today) newIn = today;
    const desiredNights = Math.max(effectiveMin || 0, nightsBetween(checkIn, checkOut), 1);
    let finalNights = desiredNights;
    if (requiredWeekday !== null && requiredWeekday !== undefined) {
      // must be whole weeks so check-out lands on required weekday too
      finalNights = Math.max(7, Math.ceil(desiredNights / 7) * 7);
    }
    combined = { checkIn: newIn, checkOut: addDays(newIn, finalNights) };
  }

  const thresholdRows = [
    { label: "Stugans tröskel", value: cabinMinNights, active: (cabinMinNights ?? 0) >= (seasonMinNights ?? 0) },
    { label: "Säsongens tröskel", value: seasonMinNights, active: (seasonMinNights ?? 0) > (cabinMinNights ?? 0) },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300">
        <AlertTriangle className="h-4 w-4" />
        Bokning ej tillåten - åtgärda {errors.length === 1 ? "felet" : `${errors.length} fel`} nedan
      </div>

      {(cabinMinNights || seasonMinNights) && (
        <div className="rounded-lg border border-border bg-background p-3 text-sm">
          <div className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Minsta antal nätter - så här räknas det
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {thresholdRows.map((row) =>
              row.value ? (
                <div
                  key={row.label}
                  className={`rounded-md border px-3 py-2 ${
                    row.active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{row.label}</div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {row.value} nätter
                    {row.active && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Gällande
                      </span>
                    )}
                  </div>
                </div>
              ) : null,
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Effektivt minimum blir det högsta av de två värdena: <strong>{effectiveMin || 0} nätter</strong>.
          </div>
        </div>
      )}

      {combined && (
        <button
          type="button"
          onClick={() => onFixAll(combined!.checkIn, combined!.checkOut)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Wand2 className="h-4 w-4" />
          Åtgärda allt - {fmtDateLong(combined.checkIn)} → {fmtDateLong(combined.checkOut)}
          {" "}({nightsBetween(combined.checkIn, combined.checkOut)} nätter)
        </button>
      )}
      <ul className="space-y-2">
        {errors.map((e, i) => (
          <li key={i} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{e.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{e.detail}</div>
                {e.fix && (
                  <button
                    type="button"
                    onClick={e.fix.onClick}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Wand2 className="h-3 w-3" /> {e.fix.label}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
