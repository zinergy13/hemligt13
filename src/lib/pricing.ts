import { supabase } from "@/integrations/supabase/client";

export type SeasonPrice = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  price_per_week: number | null;
  min_nights: number | null;
  weekend_surcharge_pct: number;
};

export type QuoteLine =
  | {
      kind: "season" | "base";
      label: string;
      nights: number;
      rate: number;
      subtotal: number;
      weekendNights: number;
      weekendSurcharge: number;
      weeklyDiscount: number;
    }
  | { kind: "cleaning"; label: string; subtotal: number };

export type Quote = {
  nights: number;
  lines: QuoteLine[];
  nightlyTotal: number;
  cleaningFee: number;
  total: number;
  warnings: string[];
  blocked: boolean;
};

const WEEKDAYS_SV = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

function eachNight(checkIn: string, checkOut: string): Date[] {
  const out: Date[] = [];
  const start = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(new Date(d));
  }
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function seasonFor(date: string, seasons: SeasonPrice[]): SeasonPrice | null {
  for (const s of seasons) {
    if (date >= s.start_date && date <= s.end_date) return s;
  }
  return null;
}

/** Fetch all season prices for a cabin (public via cabin id). */
export async function fetchSeasonPrices(cabinId: string): Promise<SeasonPrice[]> {
  const { data, error } = await supabase
    .from("cabin_season_prices")
    .select("id, label, start_date, end_date, price_per_night, price_per_week, min_nights, weekend_surcharge_pct")
    .eq("cabin_id", cabinId)
    .order("start_date");
  if (error) throw error;
  return (data ?? []) as SeasonPrice[];
}

export function computeQuote(opts: {
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  cleaningFee: number;
  minNights: number | null;
  checkInWeekday: number | null; // 0=sön ... 6=lör; null = flexibelt
  seasons: SeasonPrice[];
}): Quote {
  const warnings: string[] = [];
  let blocked = false;

  if (!opts.checkIn || !opts.checkOut) {
    return { nights: 0, lines: [], nightlyTotal: 0, cleaningFee: 0, total: 0, warnings, blocked: false };
  }

  const nights = eachNight(opts.checkIn, opts.checkOut);
  if (nights.length === 0) {
    return { nights: 0, lines: [], nightlyTotal: 0, cleaningFee: 0, total: 0, warnings, blocked: false };
  }

  // Group consecutive nights by season (or base)
  type Bucket = { seasonId: string | null; label: string; rate: number; weeklyRate: number | null; weekendPct: number; minNights: number | null; nights: Date[] };
  const buckets: Bucket[] = [];
  for (const d of nights) {
    const iso = isoDate(d);
    const s = seasonFor(iso, opts.seasons);
    const key = s?.id ?? null;
    const last = buckets[buckets.length - 1];
    if (last && last.seasonId === key) {
      last.nights.push(d);
    } else {
      buckets.push({
        seasonId: key,
        label: s ? s.label : "Grundpris",
        rate: s ? s.price_per_night : opts.pricePerNight,
        weeklyRate: s?.price_per_week ?? null,
        weekendPct: s?.weekend_surcharge_pct ?? 0,
        minNights: s?.min_nights ?? null,
        nights: [d],
      });
    }
  }

  const lines: QuoteLine[] = [];
  let nightlyTotal = 0;

  for (const b of buckets) {
    const n = b.nights.length;
    // Fri (5) + Sat (6) get weekend surcharge
    const weekendNights = b.nights.filter((d) => {
      const w = d.getUTCDay();
      return w === 5 || w === 6;
    }).length;
    const weekdayNights = n - weekendNights;

    let subtotal: number;
    let weeklyDiscount = 0;
    let weekendSurcharge = 0;

    const weeks = Math.floor(n / 7);
    if (b.weeklyRate && weeks > 0) {
      const remainder = n - weeks * 7;
      subtotal = weeks * b.weeklyRate + remainder * b.rate;
      weeklyDiscount = Math.max(0, weeks * 7 * b.rate - weeks * b.weeklyRate);
    } else {
      subtotal = n * b.rate;
    }

    if (b.weekendPct > 0 && weekendNights > 0 && !(b.weeklyRate && weeks > 0)) {
      weekendSurcharge = Math.round(weekendNights * b.rate * (b.weekendPct / 100));
      subtotal += weekendSurcharge;
    }

    void weekdayNights;
    nightlyTotal += subtotal;
    lines.push({
      kind: b.seasonId ? "season" : "base",
      label: b.label,
      nights: n,
      rate: b.rate,
      subtotal,
      weekendNights,
      weekendSurcharge,
      weeklyDiscount,
    });
  }

  // Min nights validation — starts from the FIRST bucket's rule (or base)
  const totalNights = nights.length;
  const firstBucket = buckets[0];
  const effectiveMin = firstBucket.minNights ?? opts.minNights ?? 0;
  if (effectiveMin > 0 && totalNights < effectiveMin) {
    warnings.push(`Denna period kräver minst ${effectiveMin} nätter (du valde ${totalNights}).`);
    blocked = true;
  }

  // Saturday-to-Saturday / weekday check
  if (opts.checkInWeekday !== null && opts.checkInWeekday !== undefined) {
    const inDay = new Date(opts.checkIn + "T00:00:00Z").getUTCDay();
    const outDay = new Date(opts.checkOut + "T00:00:00Z").getUTCDay();
    if (inDay !== opts.checkInWeekday) {
      warnings.push(
        `Incheckning måste ske på en ${WEEKDAYS_SV[opts.checkInWeekday]} (valt: ${WEEKDAYS_SV[inDay]}).`,
      );
      blocked = true;
    } else if (outDay !== opts.checkInWeekday) {
      warnings.push(
        `Utcheckning måste ske på en ${WEEKDAYS_SV[opts.checkInWeekday]} (valt: ${WEEKDAYS_SV[outDay]}).`,
      );
      blocked = true;
    }
  }

  const cleaningFee = opts.cleaningFee;
  if (cleaningFee > 0) {
    lines.push({ kind: "cleaning", label: "Städavgift", subtotal: cleaningFee });
  }

  return {
    nights: totalNights,
    lines,
    nightlyTotal,
    cleaningFee,
    total: nightlyTotal + cleaningFee,
    warnings,
    blocked,
  };
}