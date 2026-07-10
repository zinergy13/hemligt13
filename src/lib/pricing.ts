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
  | { kind: "cleaning"; label: string; subtotal: number }
  | { kind: "adjustment"; label: string; subtotal: number; note?: string };

export type Quote = {
  nights: number;
  lines: QuoteLine[];
  nightlyTotal: number;
  cleaningFee: number;
  adjustmentsTotal: number;
  total: number;
  warnings: string[];
  blocked: boolean;
};

export type PricingRule = {
  last_minute_days: number;
  last_minute_discount_pct: number;
  long_stay_nights: number;
  long_stay_discount_pct: number;
  high_demand_markup_pct: number;
  early_bird_days: number;
  early_bird_discount_pct: number;
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

/**
 * Unified quote builder used by BOTH the guest checkout (BookingForm) and the
 * host price preview (/konto). Fetches season prices + dynamic rule for the
 * cabin and returns the final Quote with dynamic adjustments applied. Anything
 * that needs "the real final price a guest will pay" MUST go through this.
 */
export async function buildFinalQuote(opts: {
  cabinId: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  cleaningFee: number;
  minNights: number | null;
  checkInWeekday: number | null;
  today?: string;
}): Promise<{ quote: Quote; seasons: SeasonPrice[]; rule: PricingRule | null }> {
  const [seasons, rule] = await Promise.all([
    fetchSeasonPrices(opts.cabinId),
    fetchPricingRule(opts.cabinId),
  ]);
  const base = computeQuote({
    checkIn: opts.checkIn,
    checkOut: opts.checkOut,
    pricePerNight: opts.pricePerNight,
    cleaningFee: opts.cleaningFee,
    minNights: opts.minNights,
    checkInWeekday: opts.checkInWeekday,
    seasons,
  });
  const quote = applyDynamicRules(base, rule, { checkIn: opts.checkIn, today: opts.today });
  return { quote, seasons, rule };
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
    return { nights: 0, lines: [], nightlyTotal: 0, cleaningFee: 0, adjustmentsTotal: 0, total: 0, warnings, blocked: false };
  }

  const nights = eachNight(opts.checkIn, opts.checkOut);
  if (nights.length === 0) {
    return { nights: 0, lines: [], nightlyTotal: 0, cleaningFee: 0, adjustmentsTotal: 0, total: 0, warnings, blocked: false };
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
    adjustmentsTotal: 0,
    total: nightlyTotal + cleaningFee,
    warnings,
    blocked,
  };
}

/** Fetch dynamic pricing rule for a cabin (may return null). */
export async function fetchPricingRule(cabinId: string): Promise<PricingRule | null> {
  const { data, error } = await supabase
    .from("cabin_pricing_rules")
    .select("last_minute_days, last_minute_discount_pct, long_stay_nights, long_stay_discount_pct, high_demand_markup_pct, early_bird_days, early_bird_discount_pct")
    .eq("cabin_id", cabinId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PricingRule | null;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((da - db) / 86400000);
}

/**
 * Apply dynamic pricing rules on top of a base quote. Returns a new Quote with
 * adjustment lines appended. Rules apply as a percentage of nightlyTotal.
 */
export function applyDynamicRules(quote: Quote, rule: PricingRule | null, opts: { checkIn: string; today?: string }): Quote {
  if (!rule || quote.nights === 0) return quote;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const daysToCheckIn = daysBetween(opts.checkIn, today);

  const lines: QuoteLine[] = [...quote.lines];
  let adjustmentsTotal = 0;

  const pushAdj = (label: string, pct: number, sign: 1 | -1, note?: string) => {
    if (pct <= 0) return;
    const amount = sign * Math.round((quote.nightlyTotal * pct) / 100);
    if (amount === 0) return;
    adjustmentsTotal += amount;
    lines.push({ kind: "adjustment", label, subtotal: amount, note });
  };

  // Early-bird: booking far in advance
  if (rule.early_bird_days > 0 && rule.early_bird_discount_pct > 0 && daysToCheckIn >= rule.early_bird_days) {
    pushAdj(
      `Tidig-bokning-rabatt (−${rule.early_bird_discount_pct}%)`,
      rule.early_bird_discount_pct,
      -1,
      `Bokat ${daysToCheckIn} dagar i förväg (krav ≥ ${rule.early_bird_days})`,
    );
  }

  // Last-minute: booking close to check-in
  if (
    rule.last_minute_days > 0 &&
    rule.last_minute_discount_pct > 0 &&
    daysToCheckIn >= 0 &&
    daysToCheckIn <= rule.last_minute_days
  ) {
    pushAdj(
      `Sista minuten-rabatt (−${rule.last_minute_discount_pct}%)`,
      rule.last_minute_discount_pct,
      -1,
      `${daysToCheckIn} dagar till incheckning (krav ≤ ${rule.last_minute_days})`,
    );
  }

  // Long-stay: stay length threshold
  if (rule.long_stay_nights > 0 && rule.long_stay_discount_pct > 0 && quote.nights >= rule.long_stay_nights) {
    pushAdj(
      `Långtidsrabatt (−${rule.long_stay_discount_pct}%)`,
      rule.long_stay_discount_pct,
      -1,
      `${quote.nights} nätter (krav ≥ ${rule.long_stay_nights})`,
    );
  }

  // High-demand markup (applied as informational — hosts opt in per season in practice)
  if (rule.high_demand_markup_pct > 0) {
    pushAdj(
      `Högsäsongstillägg (+${rule.high_demand_markup_pct}%)`,
      rule.high_demand_markup_pct,
      1,
      "Aktivt när efterfrågan är hög",
    );
  }

  return {
    ...quote,
    lines,
    adjustmentsTotal,
    total: quote.nightlyTotal + quote.cleaningFee + adjustmentsTotal,
  };
}