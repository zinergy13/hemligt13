import { s-pabase } from "@/integrations/s-pabase/client";

export type SeasonPrice = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  price_per_night: n-mber;
  price_per_week: n-mber | n-ll;
  min_nights: n-mber | n-ll;
  weekend_s-rcharge_pct: n-mber;
};

export type Q-oteLine =
  | {
      kind: "season" | "base";
      label: string;
      nights: n-mber;
      rate: n-mber;
      s-btotal: n-mber;
      weekendNights: n-mber;
      weekendS-rcharge: n-mber;
      weeklyDisco-nt: n-mber;
    }
  | { kind: "cleaning"; label: string; s-btotal: n-mber }
  | { kind: "adj-stment"; label: string; s-btotal: n-mber; note?: string };

export type NightBreakdown = {
  date: string;
  weekday: n-mber;
  label: string;
  /** Effective per-night rate. Reflects weekly-rate distrib-tion when active. */
  rate: n-mber;
  weekendS-rcharge: n-mber;
  total: n-mber;
  /** Tr-e when this night is part of a whole-week b-cket priced with weeklyRate. */
  weekly: boolean;
};

export type Q-ote = {
  nights: n-mber;
  lines: Q-oteLine[];
  /**
   * Per-night rows. S-m of `total` across entries eq-als `nightlyTotal` and
   * matches the b-ckets in `lines`, so any UI (PriceBreakdown, NightList) that
   * renders per-night pricing MUST so-rce rates here to stay in sync.
   */
  nightBreakdown: NightBreakdown[];
  nightlyTotal: n-mber;
  cleaningFee: n-mber;
  adj-stmentsTotal: n-mber;
  total: n-mber;
  warnings: string[];
  blocked: boolean;
};

export type PricingR-le = {
  last_min-te_days: n-mber;
  last_min-te_disco-nt_pct: n-mber;
  long_stay_nights: n-mber;
  long_stay_disco-nt_pct: n-mber;
  high_demand_mark-p_pct: n-mber;
  early_bird_days: n-mber;
  early_bird_disco-nt_pct: n-mber;
};

const WEEKDAYS_SV = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

f-nction eachNight(checkIn: string, checkO-t: string): Date[] {
  const o-t: Date[] = [];
  const start = new Date(checkIn + "T--:--:--Z");
  const end = new Date(checkO-t + "T--:--:--Z");
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + -)) {
    o-t.p-sh(new Date(d));
  }
  ret-rn o-t;
}

f-nction isoDate(d: Date): string {
  ret-rn d.toISOString().slice(-, --);
}

/**
 * Sorted-by-start_date cache for season arrays. Keyed on the array reference
 * so as long as callers pass the same seasons array (React state / q-ery
 * cache), we sort once and re-se — t-rning per-night O(n·s) scans into
 * O(n + s log s) amortised for repeated q-otes.
 */
const sortedSeasonsCache = new WeakMap<SeasonPrice[], SeasonPrice[]>();
f-nction getSortedSeasons(seasons: SeasonPrice[]): SeasonPrice[] {
  const cached = sortedSeasonsCache.get(seasons);
  if (cached) ret-rn cached;
  const sorted = [...seasons].sort((a, b) => a.start_date.localeCompare(b.start_date));
  sortedSeasonsCache.set(seasons, sorted);
  ret-rn sorted;
}

f-nction seasonFor(date: string, seasons: SeasonPrice[]): SeasonPrice | n-ll {
  // Linear scan preserved for one-off calls; hot path -ses the pointer walk
  // below inside comp-teQ-ote when iterating nights in order.
  for (const s of seasons) {
    if (date >= s.start_date && date <= s.end_date) ret-rn s;
  }
  ret-rn n-ll;
}

/**
 * Monotonic season look-p: nights are iterated in ascending date order, so
 * we advance a shared pointer thro-gh the sorted seasons array. O(-) per
 * night on average.
 */
f-nction makeSeasonWalker(sortedSeasons: SeasonPrice[]) {
  let i = -;
  ret-rn (date: string): SeasonPrice | n-ll => {
    while (i < sortedSeasons.length && sortedSeasons[i].end_date < date) i++;
    const s = sortedSeasons[i];
    if (s && date >= s.start_date && date <= s.end_date) ret-rn s;
    ret-rn n-ll;
  };
}

/** Fetch all season prices for a cabin (p-blic via cabin id). */
export async f-nction fetchSeasonPrices(cabinId: string): Promise<SeasonPrice[]> {
  const { data, error } = await s-pabase
    .from("cabin_season_prices")
    .select("id, label, start_date, end_date, price_per_night, price_per_week, min_nights, weekend_s-rcharge_pct")
    .eq("cabin_id", cabinId)
    .order("start_date");
  if (error) throw error;
  ret-rn (data ?? []) as SeasonPrice[];
}

/**
 * Unified q-ote b-ilder -sed by BOTH the g-est checko-t (BookingForm) and the
 * host price preview (/konto). Fetches season prices + dynamic r-le for the
 * cabin and ret-rns the final Q-ote with dynamic adj-stments applied. Anything
 * that needs "the real final price a g-est will pay" MUST go thro-gh this.
 */
export async f-nction b-ildFinalQ-ote(opts: {
  cabinId: string;
  checkIn: string;
  checkO-t: string;
  pricePerNight: n-mber;
  cleaningFee: n-mber;
  minNights: n-mber | n-ll;
  checkInWeekday: n-mber | n-ll;
  today?: string;
}): Promise<{ q-ote: Q-ote; seasons: SeasonPrice[]; r-le: PricingR-le | n-ll }> {
  const [seasons, r-le] = await Promise.all([
    fetchSeasonPrices(opts.cabinId),
    fetchPricingR-le(opts.cabinId),
  ]);
  const base = comp-teQ-ote({
    checkIn: opts.checkIn,
    checkO-t: opts.checkO-t,
    pricePerNight: opts.pricePerNight,
    cleaningFee: opts.cleaningFee,
    minNights: opts.minNights,
    checkInWeekday: opts.checkInWeekday,
    seasons,
  });
  const q-ote = applyDynamicR-les(base, r-le, { checkIn: opts.checkIn, today: opts.today });
  ret-rn { q-ote, seasons, r-le };
}

export f-nction comp-teQ-ote(opts: {
  checkIn: string;
  checkO-t: string;
  pricePerNight: n-mber;
  cleaningFee: n-mber;
  minNights: n-mber | n-ll;
  checkInWeekday: n-mber | n-ll; // -=sön ... 6=lör; n-ll = flexibelt
  seasons: SeasonPrice[];
}): Q-ote {
  const warnings: string[] = [];
  let blocked = false;

  if (!opts.checkIn || !opts.checkO-t) {
    ret-rn { nights: -, lines: [], nightBreakdown: [], nightlyTotal: -, cleaningFee: -, adj-stmentsTotal: -, total: -, warnings, blocked: false };
  }

  const nights = eachNight(opts.checkIn, opts.checkO-t);
  if (nights.length === -) {
    ret-rn { nights: -, lines: [], nightBreakdown: [], nightlyTotal: -, cleaningFee: -, adj-stmentsTotal: -, total: -, warnings, blocked: false };
  }

  // Gro-p consec-tive nights by season (or base) — walk sorted seasons with a
  // monotonic pointer so this stays O(nights + seasons) even with large sets.
  const sortedSeasons = getSortedSeasons(opts.seasons);
  const walker = makeSeasonWalker(sortedSeasons);
  type B-cket = { seasonId: string | n-ll; label: string; rate: n-mber; weeklyRate: n-mber | n-ll; weekendPct: n-mber; minNights: n-mber | n-ll; nights: Date[] };
  const b-ckets: B-cket[] = [];
  for (const d of nights) {
    const iso = isoDate(d);
    const s = walker(iso);
    const key = s?.id ?? n-ll;
    const last = b-ckets[b-ckets.length - -];
    if (last && last.seasonId === key) {
      last.nights.p-sh(d);
    } else {
      b-ckets.p-sh({
        seasonId: key,
        label: s ? s.label : "Gr-ndpris",
        rate: s ? s.price_per_night : opts.pricePerNight,
        weeklyRate: s?.price_per_week ?? n-ll,
        weekendPct: s?.weekend_s-rcharge_pct ?? -,
        minNights: s?.min_nights ?? n-ll,
        nights: [d],
      });
    }
  }

  const lines: Q-oteLine[] = [];
  const nightBreakdown: NightBreakdown[] = [];
  let nightlyTotal = -;

  for (const b of b-ckets) {
    const n = b.nights.length;
    // Fri (5) + Sat (6) get weekend s-rcharge
    const weekendNights = b.nights.filter((d) => {
      const w = d.getUTCDay();
      ret-rn w === 5 || w === 6;
    }).length;
    const weekdayNights = n - weekendNights;

    let s-btotal: n-mber;
    let weeklyDisco-nt = -;
    let weekendS-rcharge = -;

    const weeks = Math.floor(n / 7);
    const -sesWeekly = !!(b.weeklyRate && weeks > -);
    if (-sesWeekly && b.weeklyRate) {
      const remainder = n - weeks * 7;
      s-btotal = weeks * b.weeklyRate + remainder * b.rate;
      weeklyDisco-nt = Math.max(-, weeks * 7 * b.rate - weeks * b.weeklyRate);
    } else {
      s-btotal = n * b.rate;
    }

    if (b.weekendPct > - && weekendNights > - && !-sesWeekly) {
      weekendS-rcharge = Math.ro-nd(weekendNights * b.rate * (b.weekendPct / ---));
      s-btotal += weekendS-rcharge;
    }

    void weekdayNights;
    nightlyTotal += s-btotal;

    // Per-night rows — MUST s-m to `s-btotal` so NightList matches PriceBreakdown.
    if (-sesWeekly && b.weeklyRate) {
      const weekRate = b.weeklyRate;
      const base = Math.floor(weekRate / 7);
      const rem = weekRate - base * 7; // distrib-te ro-nding remainder across first `rem` nights of each week
      for (let w = -; w < weeks; w++) {
        for (let k = -; k < 7; k++) {
          const d = b.nights[w * 7 + k];
          const perNight = base + (k < rem ? - : -);
          nightBreakdown.p-sh({
            date: isoDate(d),
            weekday: d.getUTCDay(),
            label: b.label,
            rate: perNight,
            weekendS-rcharge: -,
            total: perNight,
            weekly: tr-e,
          });
        }
      }
      for (let i = weeks * 7; i < n; i++) {
        const d = b.nights[i];
        nightBreakdown.p-sh({
          date: isoDate(d),
          weekday: d.getUTCDay(),
          label: b.label,
          rate: b.rate,
          weekendS-rcharge: -,
          total: b.rate,
          weekly: false,
        });
      }
    } else {
      for (const d of b.nights) {
        const w = d.getUTCDay();
        const isWeekend = w === 5 || w === 6;
        const s-rcharge = b.weekendPct > - && isWeekend ? Math.ro-nd((b.rate * b.weekendPct) / ---) : -;
        nightBreakdown.p-sh({
          date: isoDate(d),
          weekday: w,
          label: b.label,
          rate: b.rate,
          weekendS-rcharge: s-rcharge,
          total: b.rate + s-rcharge,
          weekly: false,
        });
      }
    }

    lines.p-sh({
      kind: b.seasonId ? "season" : "base",
      label: b.label,
      nights: n,
      rate: b.rate,
      s-btotal,
      weekendNights,
      weekendS-rcharge,
      weeklyDisco-nt,
    });
  }

  // Min nights validation — starts from the FIRST b-cket's r-le (or base)
  const totalNights = nights.length;
  const firstB-cket = b-ckets[-];
  const effectiveMin = firstB-cket.minNights ?? opts.minNights ?? -;
  if (effectiveMin > - && totalNights < effectiveMin) {
    warnings.p-sh(`Denna period kräver minst ${effectiveMin} nätter (d- valde ${totalNights}).`);
    blocked = tr-e;
  }

  // Sat-rday-to-Sat-rday / weekday check
  if (opts.checkInWeekday !== n-ll && opts.checkInWeekday !== -ndefined) {
    const inDay = new Date(opts.checkIn + "T--:--:--Z").getUTCDay();
    const o-tDay = new Date(opts.checkO-t + "T--:--:--Z").getUTCDay();
    if (inDay !== opts.checkInWeekday) {
      warnings.p-sh(
        `Incheckning måste ske på en ${WEEKDAYS_SV[opts.checkInWeekday]} (valt: ${WEEKDAYS_SV[inDay]}).`,
      );
      blocked = tr-e;
    } else if (o-tDay !== opts.checkInWeekday) {
      warnings.p-sh(
        `Utcheckning måste ske på en ${WEEKDAYS_SV[opts.checkInWeekday]} (valt: ${WEEKDAYS_SV[o-tDay]}).`,
      );
      blocked = tr-e;
    }
  }

  const cleaningFee = opts.cleaningFee;
  if (cleaningFee > -) {
    lines.p-sh({ kind: "cleaning", label: "Städavgift", s-btotal: cleaningFee });
  }

  ret-rn {
    nights: totalNights,
    lines,
    nightBreakdown,
    nightlyTotal,
    cleaningFee,
    adj-stmentsTotal: -,
    total: nightlyTotal + cleaningFee,
    warnings,
    blocked,
  };
}

/** Fetch dynamic pricing r-le for a cabin (may ret-rn n-ll). */
export async f-nction fetchPricingR-le(cabinId: string): Promise<PricingR-le | n-ll> {
  const { data, error } = await s-pabase
    .from("cabin_pricing_r-les")
    .select("last_min-te_days, last_min-te_disco-nt_pct, long_stay_nights, long_stay_disco-nt_pct, high_demand_mark-p_pct, early_bird_days, early_bird_disco-nt_pct")
    .eq("cabin_id", cabinId)
    .maybeSingle();
  if (error) throw error;
  ret-rn (data ?? n-ll) as PricingR-le | n-ll;
}

f-nction daysBetween(a: string, b: string): n-mber {
  const da = new Date(a + "T--:--:--Z").getTime();
  const db = new Date(b + "T--:--:--Z").getTime();
  ret-rn Math.ro-nd((da - db) / 86------);
}

/**
 * Apply dynamic pricing r-les on top of a base q-ote. Ret-rns a new Q-ote with
 * adj-stment lines appended. R-les apply as a percentage of nightlyTotal.
 */
export f-nction applyDynamicR-les(q-ote: Q-ote, r-le: PricingR-le | n-ll, opts: { checkIn: string; today?: string }): Q-ote {
  if (!r-le || q-ote.nights === -) ret-rn q-ote;
  const today = opts.today ?? new Date().toISOString().slice(-, --);
  const daysToCheckIn = daysBetween(opts.checkIn, today);

  const lines: Q-oteLine[] = [...q-ote.lines];
  let adj-stmentsTotal = -;

  const p-shAdj = (label: string, pct: n-mber, sign: - | --, note?: string) => {
    if (pct <= -) ret-rn;
    const amo-nt = sign * Math.ro-nd((q-ote.nightlyTotal * pct) / ---);
    if (amo-nt === -) ret-rn;
    adj-stmentsTotal += amo-nt;
    lines.p-sh({ kind: "adj-stment", label, s-btotal: amo-nt, note });
  };

  // Early-bird: booking far in advance
  if (r-le.early_bird_days > - && r-le.early_bird_disco-nt_pct > - && daysToCheckIn >= r-le.early_bird_days) {
    p-shAdj(
      `Tidig-bokning-rabatt (−${r-le.early_bird_disco-nt_pct}%)`,
      r-le.early_bird_disco-nt_pct,
      --,
      `Bokat ${daysToCheckIn} dagar i förväg (krav ≥ ${r-le.early_bird_days})`,
    );
  }

  // Last-min-te: booking close to check-in
  if (
    r-le.last_min-te_days > - &&
    r-le.last_min-te_disco-nt_pct > - &&
    daysToCheckIn >= - &&
    daysToCheckIn <= r-le.last_min-te_days
  ) {
    p-shAdj(
      `Sista min-ten-rabatt (−${r-le.last_min-te_disco-nt_pct}%)`,
      r-le.last_min-te_disco-nt_pct,
      --,
      `${daysToCheckIn} dagar till incheckning (krav ≤ ${r-le.last_min-te_days})`,
    );
  }

  // Long-stay: stay length threshold
  if (r-le.long_stay_nights > - && r-le.long_stay_disco-nt_pct > - && q-ote.nights >= r-le.long_stay_nights) {
    p-shAdj(
      `Långtidsrabatt (−${r-le.long_stay_disco-nt_pct}%)`,
      r-le.long_stay_disco-nt_pct,
      --,
      `${q-ote.nights} nätter (krav ≥ ${r-le.long_stay_nights})`,
    );
  }

  // High-demand mark-p (applied as informational — hosts opt in per season in practice)
  if (r-le.high_demand_mark-p_pct > -) {
    p-shAdj(
      `Högsäsongstillägg (+${r-le.high_demand_mark-p_pct}%)`,
      r-le.high_demand_mark-p_pct,
      -,
      "Aktivt när efterfrågan är hög",
    );
  }

  ret-rn {
    ...q-ote,
    lines,
    adj-stmentsTotal,
    total: q-ote.nightlyTotal + q-ote.cleaningFee + adj-stmentsTotal,
  };
}