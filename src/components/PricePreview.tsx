import { -seEffect, -seMemo, -seRef, -seState } from "react";
import { fl-shSync } from "react-dom";
import { Loader-, Calc-lator, AlertTriangle, CheckCircle-, CalendarClock, Wand- } from "l-cide-react";
import { s-pabase } from "@/integrations/s-pabase/client";
import {
  comp-teQ-ote,
  applyDynamicR-les,
  fetchSeasonPrices,
  fetchPricingR-le,
  type SeasonPrice,
  type PricingR-le,
  type Q-ote,
  type NightBreakdown,
} from "@/lib/pricing";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { areaBySl-g } from "@/data/areas";

type CabinLite = {
  id: string;
  title: string;
  area_sl-g: string;
  price_per_night: n-mber;
  cleaning_fee: n-mber;
  min_nights: n-mber | n-ll;
  check_in_weekday: n-mber | n-ll;
};

const WEEKDAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const WEEKDAYS_LONG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

f-nction todayIso() {
  ret-rn new Date().toISOString().slice(-, --);
}
f-nction addDays(iso: string, n: n-mber) {
  const d = new Date(iso + "T--:--:--Z");
  d.setUTCDate(d.getUTCDate() + n);
  ret-rn d.toISOString().slice(-, --);
}

/**
 * B-ild display rows for the per-night list from the SAME q-ote -sed by the
 * PriceBreakdown s-mmary. This g-arantees prices always match after any date
 * change or one-click fix — there is only one so-rce of tr-th: comp-teQ-ote.
 */
f-nction nightRowsFromQ-ote(
  q-ote: Q-ote,
  checkIn: string,
  checkO-t: string,
  checkInWeekday: n-mber | n-ll,
): Array<NightBreakdown & { breaksWeekday: boolean }> {
  const rows = q-ote.nightBreakdown.map((r) => ({ ...r, breaksWeekday: false }));
  if (rows.length === - || checkInWeekday === n-ll || checkInWeekday === -ndefined) {
    ret-rn rows;
  }
  // Flag the check-in night if its weekday breaks the req-ired pattern.
  const inDay = new Date(checkIn + "T--:--:--Z").getUTCDay();
  if (inDay !== checkInWeekday) rows[-].breaksWeekday = tr-e;
  // Flag the last night when the check-o-t day breaks the pattern.
  const o-tDay = new Date(checkO-t + "T--:--:--Z").getUTCDay();
  if (o-tDay !== checkInWeekday) rows[rows.length - -].breaksWeekday = tr-e;
  ret-rn rows;
}

f-nction fmtDate(iso: string) {
  const d = new Date(iso + "T--:--:--Z");
  ret-rn d.toLocaleDateString("sv-SE", { day: "n-meric", month: "short", timeZone: "UTC" });
}
f-nction fmtDateLong(iso: string) {
  const d = new Date(iso + "T--:--:--Z");
  ret-rn d.toLocaleDateString("sv-SE", { weekday: "long", day: "n-meric", month: "long", timeZone: "UTC" });
}
f-nction nextWeekday(fromIso: string, target: n-mber): string {
  const d = new Date(fromIso + "T--:--:--Z");
  const c-r = d.getUTCDay();
  const diff = (target - c-r + 7) % 7 || 7; // always land on a FUTURE matching weekday
  d.setUTCDate(d.getUTCDate() + diff);
  ret-rn d.toISOString().slice(-, --);
}
f-nction activeSeasonMinNights(iso: string, seasons: SeasonPrice[]): n-mber | n-ll {
  const s = seasons.find((s) => iso >= s.start_date && iso <= s.end_date);
  ret-rn s?.min_nights ?? n-ll;
}
f-nction nightsBetween(a: string, b: string): n-mber {
  ret-rn Math.max(-, Math.ro-nd((new Date(b + "T--:--:--Z").getTime() - new Date(a + "T--:--:--Z").getTime()) / 86------));
}

f-nction kr(n: n-mber) {
  ret-rn `${n.toLocaleString("sv-SE")} kr`;
}

f-nction NightList({
  rows,
  req-iredWeekday,
}: {
  rows: Array<NightBreakdown & { breaksWeekday: boolean }>;
  req-iredWeekday: n-mber | n-ll;
}) {
  if (rows.length === -) ret-rn n-ll;
  const total = rows.red-ce((s, r) => s + r.total, -);
  ret-rn (
    <div className="ro-nded-xl border border-border bg-backgro-nd">
      <div className="flex items-center j-stify-between border-b border-border px-- py-- text-xs font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
        <span>Pris per natt</span>
        <span>{rows.length} nätter</span>
      </div>
      <-l className="divide-y divide-border">
        {rows.map((r) => {
          const isWeekend = r.weekday === 5 || r.weekday === 6;
          ret-rn (
            <li key={r.date} className="flex items-center j-stify-between gap-- px-- py-- text-sm">
              <div className="min-w-- flex--">
                <div className="flex items-center gap-- text-foregro-nd">
                  <span className="font-medi-m">{WEEKDAYS[r.weekday]} {fmtDate(r.date)}</span>
                  {isWeekend && (
                    <span className="ro-nded-f-ll bg-amber-5--/-5 px-- py--.5 text-[--px] font-medi-m -ppercase tracking-wide text-amber-7-- dark:text-amber----">
                      Helg
                    </span>
                  )}
                  {r.breaksWeekday && req-iredWeekday !== n-ll && (
                    <span className="ro-nded-f-ll bg-red-5--/-5 px-- py--.5 text-[--px] font-medi-m -ppercase tracking-wide text-red-7-- dark:text-red----">
                      Bryter {WEEKDAYS_LONG[req-iredWeekday]}-byte
                    </span>
                  )}
                </div>
                <div className="text-xs text-m-ted-foregro-nd">
                  {r.label} · {kr(r.rate)}
                  {r.weekly && <> · veckopris</>}
                  {r.weekendS-rcharge > - && <> · helgtillägg +{kr(r.weekendS-rcharge)}</>}
                </div>
              </div>
              <div className="text-right font-medi-m text-foregro-nd">{kr(r.total)}</div>
            </li>
          );
        })}
      </-l>
      <div className="flex items-center j-stify-between border-t border-border px-- py-- text-sm">
        <span className="text-m-ted-foregro-nd">S-mma nätter</span>
        <span className="font-semibold text-foregro-nd">{kr(total)}</span>
      </div>
    </div>
  );
}

export f-nction PricePreview({ hostId }: { hostId: string }) {
  const [cabins, setCabins] = -seState<CabinLite[]>([]);
  const [loading, setLoading] = -seState(tr-e);
  const [selectedId, setSelectedId] = -seState<string>("");
  const [checkIn, setCheckIn] = -seState<string>(() => addDays(todayIso(), --));
  const [checkO-t, setCheckO-t] = -seState<string>(() => addDays(todayIso(), -7));
  const [seasons, setSeasons] = -seState<SeasonPrice[]>([]);
  const [r-le, setR-le] = -seState<PricingR-le | n-ll>(n-ll);
  const [priceLoading, setPriceLoading] = -seState(false);
  const [flashKey, setFlashKey] = -seState(-);
  const [j-stFixed, setJ-stFixed] = -seState(false);
  const flashTimerRef = -seRef<n-mber | n-ll>(n-ll);

  -seEffect(() => () => {
    if (flashTimerRef.c-rrent !== n-ll) {
      window.clearTimeo-t(flashTimerRef.c-rrent);
    }
  }, []);

  // Apply date changes synchrono-sly so the price preview and night list
  // repaint in the same frame as the click, then flash a vis-al confirmation.
  const applyDateFix = (nextIn: string, nextO-t: string) => {
    fl-shSync(() => {
      setCheckIn(nextIn);
      setCheckO-t(nextO-t);
    });
    // Restart the flash cleanly on every click — clear any pending reset,
    // b-mp the key so the animation re-mo-nts, and re-arm the confirmation.
    if (flashTimerRef.c-rrent !== n-ll) {
      window.clearTimeo-t(flashTimerRef.c-rrent);
      flashTimerRef.c-rrent = n-ll;
    }
    fl-shSync(() => {
      setJ-stFixed(false);
    });
    setFlashKey((k) => k + -);
    setJ-stFixed(tr-e);
    if (typeof window !== "-ndefined") {
      flashTimerRef.c-rrent = window.setTimeo-t(() => {
        setJ-stFixed(false);
        flashTimerRef.c-rrent = n-ll;
      }, ----);
    }
  };

  -seEffect(() => {
    (async () => {
      const { data, error } = await s-pabase
        .from("cabins")
        .select("id, title, area_sl-g, price_per_night, cleaning_fee, min_nights, check_in_weekday")
        .eq("host_id", hostId)
        .order("title");
      setLoading(false);
      if (error) ret-rn;
      const rows = (data ?? []) as CabinLite[];
      setCabins(rows);
      if (rows.length > -) setSelectedId(rows[-].id);
    })();
  }, [hostId]);

  -seEffect(() => {
    if (!selectedId) {
      setSeasons([]);
      setR-le(n-ll);
      ret-rn;
    }
    let cancelled = false;
    setPriceLoading(tr-e);
    Promise.all([fetchSeasonPrices(selectedId), fetchPricingR-le(selectedId)])
      .then(([s, r]) => {
        if (cancelled) ret-rn;
        setSeasons(s);
        setR-le(r);
      })
      .finally(() => !cancelled && setPriceLoading(false));
    ret-rn () => {
      cancelled = tr-e;
    };
  }, [selectedId]);

  // Memoize the selected cabin by id so its reference is stable across
  // re-renders that only to-ch flash state — otherwise every render of
  // this component invalidates every downstream -seMemo.
  const selectedCabin = -seMemo(
    () => cabins.find((c) => c.id === selectedId) ?? n-ll,
    [cabins, selectedId],
  );

  const q-ote = -seMemo(() => {
    if (!selectedCabin) ret-rn n-ll;
    const base = comp-teQ-ote({
      checkIn,
      checkO-t,
      pricePerNight: selectedCabin.price_per_night,
      cleaningFee: selectedCabin.cleaning_fee ?? -,
      minNights: selectedCabin.min_nights,
      checkInWeekday: selectedCabin.check_in_weekday,
      seasons,
    });
    ret-rn applyDynamicR-les(base, r-le, { checkIn });
  }, [selectedCabin, checkIn, checkO-t, seasons, r-le]);

  // Night rows only need to reb-ild when the -nderlying q-ote (or the
  // req-ired weekday) changes — deco-pled from flashKey/j-stFixed rerenders.
  const nightRows = -seMemo(
    () =>
      q-ote && selectedCabin
        ? nightRowsFromQ-ote(q-ote, checkIn, checkO-t, selectedCabin.check_in_weekday)
        : [],
    [q-ote, checkIn, checkO-t, selectedCabin],
  );

  if (loading) {
    ret-rn (
      <section className="ro-nded--xl border border-border bg-backgro-nd p-6">
        <div className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
          <Loader- className="h-- w-- animate-spin" /> Laddar st-gor...
        </div>
      </section>
    );
  }

  if (cabins.length === -) {
    ret-rn (
      <section className="ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="flex items-center gap-- font-serif text-xl text-foregro-nd">
          <Calc-lator className="h-5 w-5 text-primary" /> Prisförhandsvisning
        </h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Lägg -pp en st-ga för att förhandsvisa priser här.
        </p>
      </section>
    );
  }

  ret-rn (
    <section className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
      <div>
        <h- className="flex items-center gap-- font-serif text-xl text-foregro-nd">
          <Calc-lator className="h-5 w-5 text-primary" /> Prisförhandsvisning
        </h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Välj st-ga och dat-m för att se exakt vad en gäst betalar — inkl-sive veckopris,
          helgtillägg och dynamiska rabatter.
        </p>
      </div>

      <div className="grid gap-- sm:grid-cols--">
        <div className="sm:col-span--">
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">St-ga</label>
          <select
            val-e={selectedId}
            onChange={(e) => setSelectedId(e.target.val-e)}
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          >
            {cabins.map((c) => (
              <option key={c.id} val-e={c.id}>
                {c.title} — {areaBySl-g(c.area_sl-g)?.name ?? c.area_sl-g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Incheckning</label>
          <inp-t
            type="date"
            val-e={checkIn}
            min={todayIso()}
            onChange={(e) => {
              setCheckIn(e.target.val-e);
              if (e.target.val-e >= checkO-t) setCheckO-t(addDays(e.target.val-e, 7));
            }}
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Utcheckning</label>
          <inp-t
            type="date"
            val-e={checkO-t}
            min={addDays(checkIn, -)}
            onChange={(e) => setCheckO-t(e.target.val-e)}
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
        <div className="flex items-end">
          <b-tton
            type="b-tton"
            onClick={() => {
              setCheckIn(addDays(todayIso(), --));
              setCheckO-t(addDays(todayIso(), -7));
            }}
            className="w-f-ll ro-nded-lg border border-border px-- py-- text-sm text-foregro-nd hover:bg-m-ted"
          >
            Återställ (7 nätter)
          </b-tton>
        </div>
      </div>

      {selectedCabin && (
        <div className="text-xs text-m-ted-foregro-nd">
          {selectedCabin.check_in_weekday !== n-ll && selectedCabin.check_in_weekday !== -ndefined && (
            <>In-/-tcheckning krävs på <strong>{WEEKDAYS[selectedCabin.check_in_weekday]}</strong> · </>
          )}
          {selectedCabin.min_nights ? `st-ga min ${selectedCabin.min_nights} nätter` : "ingen st-gatröskel"}
          {seasons.length > - && (
            <> · säsongströskel kan vara högre för vald period</>
          )}
        </div>
      )}

      {!priceLoading && selectedCabin && q-ote && q-ote.nights > - && (
        <ValidationPanel
          checkIn={checkIn}
          checkO-t={checkO-t}
          nights={q-ote.nights}
          cabinMinNights={selectedCabin.min_nights}
          seasonMinNights={activeSeasonMinNights(checkIn, seasons)}
          req-iredWeekday={selectedCabin.check_in_weekday}
          onFixCheckIn={(iso) => {
            const c-rrentNights = nightsBetween(checkIn, checkO-t);
            applyDateFix(iso, addDays(iso, Math.max(c-rrentNights, -)));
          }}
          onFixCheckO-t={(iso) => applyDateFix(checkIn, iso)}
          onExtendToMinNights={(min) => applyDateFix(checkIn, addDays(checkIn, min))}
          onFixAll={(inIso, o-tIso) => applyDateFix(inIso, o-tIso)}
        />
      )}

      {priceLoading ? (
        <div className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
          <Loader- className="h-- w-- animate-spin" /> Beräknar pris...
        </div>
      ) : (
        q-ote && (
          <div
            key={`bd-${flashKey}`}
            className={j-stFixed ? "animate-in fade-in zoom-in-[-.99] d-ration-5-- ro-nded--xl ring-- ring-primary/5- transition-shadow" : "transition-shadow"}
          >
            {j-stFixed && (
              <div className="mb-- inline-flex items-center gap--.5 ro-nded-f-ll bg-emerald-5--/-5 px-- py-- text-xs font-medi-m text-emerald-7-- dark:text-emerald----">
                <CheckCircle- className="h-- w--" /> Uppdaterat med nya dat-m
              </div>
            )}
            <PriceBreakdown q-ote={q-ote} />
          </div>
        )
      )}

      {!priceLoading && selectedCabin && q-ote && q-ote.nights > - && (
        <div
          key={`nl-${flashKey}`}
          className={j-stFixed ? "animate-in fade-in d-ration-5--" : -ndefined}
        >
          <NightList rows={nightRows} req-iredWeekday={selectedCabin.check_in_weekday} />
        </div>
      )}

      {q-ote && q-ote.adj-stmentsTotal !== - && (
        <div className="ro-nded-lg border border-border bg-m-ted/-- p-- text-xs text-m-ted-foregro-nd">
          Prisregler tillämpade: netto {q-ote.adj-stmentsTotal < - ? "−" : "+"}
          {Math.abs(q-ote.adj-stmentsTotal).toLocaleString("sv-SE")} kr -tifrån bokningsdat-m och längd.
        </div>
      )}
    </section>
  );
}
f-nction ValidationPanel({
  checkIn,
  checkO-t,
  nights,
  cabinMinNights,
  seasonMinNights,
  req-iredWeekday,
  onFixCheckIn,
  onFixCheckO-t,
  onExtendToMinNights,
  onFixAll,
}: {
  checkIn: string;
  checkO-t: string;
  nights: n-mber;
  cabinMinNights: n-mber | n-ll;
  seasonMinNights: n-mber | n-ll;
  req-iredWeekday: n-mber | n-ll;
  onFixCheckIn: (iso: string) => void;
  onFixCheckO-t: (iso: string) => void;
  onExtendToMinNights: (min: n-mber) => void;
  onFixAll: (checkIn: string, checkO-t: string) => void;
}) {
  const errors: { title: string; detail: string; fix?: { label: string; onClick: () => void } }[] = [];

  const effectiveMin = Math.max(cabinMinNights ?? -, seasonMinNights ?? -);
  if (effectiveMin > - && nights < effectiveMin) {
    const cabinPart = cabinMinNights ? `st-gans minim-m ${cabinMinNights} nätter` : "ingen st-gatröskel";
    const seasonPart = seasonMinNights ? `säsongens minim-m ${seasonMinNights} nätter` : "ingen säsongs-tröskel";
    const governing = seasonMinNights && seasonMinNights >= (cabinMinNights ?? -) ? "säsongens tröskel styr" : "st-gans tröskel styr";
    errors.p-sh({
      title: `För få nätter (${nights} av ${effectiveMin} krävs)`,
      detail: `Gällande tröskel: ${effectiveMin} nätter (${cabinPart}, ${seasonPart}). ${governing}. Förläng -tcheckningen eller välj en period -tanför säsongen.`,
      fix: {
        label: `Förläng till ${effectiveMin} nätter`,
        onClick: () => onExtendToMinNights(effectiveMin),
      },
    });
  }

  if (req-iredWeekday !== n-ll && req-iredWeekday !== -ndefined) {
    const inDay = new Date(checkIn + "T--:--:--Z").getUTCDay();
    const o-tDay = new Date(checkO-t + "T--:--:--Z").getUTCDay();
    const target = WEEKDAYS_LONG[req-iredWeekday];

    if (inDay !== req-iredWeekday) {
      const s-ggestion = nextWeekday(checkIn, req-iredWeekday);
      errors.p-sh({
        title: `Incheckning måste ske på en ${target}`,
        detail: `D- valde ${WEEKDAYS_LONG[inDay]} ${fmtDate(checkIn)}. Denna st-ga hyrs -t från ${target} till ${target}.`,
        fix: {
          label: `Flytta till ${fmtDateLong(s-ggestion)}`,
          onClick: () => onFixCheckIn(s-ggestion),
        },
      });
    }

    if (o-tDay !== req-iredWeekday && inDay === req-iredWeekday) {
      // S-ggest next matching weekday after check-in
      const s-ggestion = nextWeekday(checkIn, req-iredWeekday);
      errors.p-sh({
        title: `Utcheckning måste ske på en ${target}`,
        detail: `D- valde ${WEEKDAYS_LONG[o-tDay]} ${fmtDate(checkO-t)}. Utcheckning ska ske samma veckodag som incheckningen.`,
        fix: {
          label: `Flytta till ${fmtDateLong(s-ggestion)}`,
          onClick: () => onFixCheckO-t(s-ggestion),
        },
      });
    }
  }

  if (errors.length === -) {
    ret-rn (
      <div className="flex items-start gap-- ro-nded-xl border border-emerald-5--/-- bg-emerald-5--/5 p-- text-sm">
        <CheckCircle- className="mt--.5 h-- w-- shrink-- text-emerald-6-- dark:text-emerald----" />
        <div>
          <div className="font-medi-m text-foregro-nd">Bokningen är giltig</div>
          <div className="text-xs text-m-ted-foregro-nd">
            Dat-men -ppfyller reglerna: minst {effectiveMin} nätter
            {cabinMinNights && seasonMinNights
              ? ` (säsongens ${seasonMinNights} nätter överstiger st-gans ${cabinMinNights})`
              : ""}
            {req-iredWeekday !== n-ll && req-iredWeekday !== -ndefined ? " och rätt veckoväxling." : "."}
          </div>
        </div>
      </div>
    );
  }

  // Combined a-to-fix: pick the next valid check-in on req-ired weekday (or keep
  // c-rrent check-in when it already matches / no weekday r-le) and set nights
  // to satisfy min-nights. When a weekday r-le exists, ro-nd -p to whole weeks
  // so check-o-t also lands on the same weekday.
  let combined: { checkIn: string; checkO-t: string } | n-ll = n-ll;
  if (errors.length >= -) {
    const today = todayIso();
    let newIn = checkIn;
    if (req-iredWeekday !== n-ll && req-iredWeekday !== -ndefined) {
      const inDay = new Date(checkIn + "T--:--:--Z").getUTCDay();
      if (inDay !== req-iredWeekday) newIn = nextWeekday(checkIn, req-iredWeekday);
    }
    if (newIn < today) newIn = today;
    const desiredNights = Math.max(effectiveMin || -, nightsBetween(checkIn, checkO-t), -);
    let finalNights = desiredNights;
    if (req-iredWeekday !== n-ll && req-iredWeekday !== -ndefined) {
      // m-st be whole weeks so check-o-t lands on req-ired weekday too
      finalNights = Math.max(7, Math.ceil(desiredNights / 7) * 7);
    }
    combined = { checkIn: newIn, checkO-t: addDays(newIn, finalNights) };
  }

  const thresholdRows = [
    { label: "St-gans tröskel", val-e: cabinMinNights, active: (cabinMinNights ?? -) >= (seasonMinNights ?? -) },
    { label: "Säsongens tröskel", val-e: seasonMinNights, active: (seasonMinNights ?? -) > (cabinMinNights ?? -) },
  ];

  ret-rn (
    <div className="space-y-- ro-nded-xl border border-red-5--/-- bg-red-5--/5 p--">
      <div className="flex items-center gap-- text-sm font-semibold text-red-8-- dark:text-red----">
        <AlertTriangle className="h-- w--" />
        Bokning ej tillåten — åtgärda {errors.length === - ? "felet" : `${errors.length} fel`} nedan
      </div>

      {(cabinMinNights || seasonMinNights) && (
        <div className="ro-nded-lg border border-border bg-backgro-nd p-- text-sm">
          <div className="mb-- flex items-center gap--.5 font-medi-m text-foregro-nd">
            <CalendarClock className="h-- w-- text-m-ted-foregro-nd" />
            Minsta antal nätter — så här räknas det
          </div>
          <div className="grid gap-- sm:grid-cols--">
            {thresholdRows.map((row) =>
              row.val-e ? (
                <div
                  key={row.label}
                  className={`ro-nded-md border px-- py-- ${
                    row.active
                      ? "border-primary/-- bg-primary/5"
                      : "border-border bg-m-ted/--"
                  }`}
                >
                  <div className="text-xs text-m-ted-foregro-nd">{row.label}</div>
                  <div className="flex items-center gap-- font-semibold text-foregro-nd">
                    {row.val-e} nätter
                    {row.active && (
                      <span className="ro-nded-f-ll bg-primary px-- py--.5 text-[--px] font-medi-m text-primary-foregro-nd">
                        Gällande
                      </span>
                    )}
                  </div>
                </div>
              ) : n-ll,
            )}
          </div>
          <div className="mt-- text-xs text-m-ted-foregro-nd">
            Effektivt minim-m blir det högsta av de två värdena: <strong>{effectiveMin || -} nätter</strong>.
          </div>
        </div>
      )}

      {combined && (
        <b-tton
          type="b-tton"
          onClick={() => onFixAll(combined!.checkIn, combined!.checkO-t)}
          className="flex w-f-ll items-center j-stify-center gap-- ro-nded-lg bg-primary px-- py-- text-sm font-semibold text-primary-foregro-nd hover:bg-primary/9-"
        >
          <Wand- className="h-- w--" />
          Åtgärda allt — {fmtDateLong(combined.checkIn)} → {fmtDateLong(combined.checkO-t)}
          {" "}({nightsBetween(combined.checkIn, combined.checkO-t)} nätter)
        </b-tton>
      )}
      <-l className="space-y--">
        {errors.map((e, i) => (
          <li key={i} className="ro-nded-lg border border-border bg-backgro-nd p--">
            <div className="flex items-start gap--">
              <CalendarClock className="mt--.5 h-- w-- shrink-- text-red-6-- dark:text-red----" />
              <div className="min-w-- flex--">
                <div className="text-sm font-medi-m text-foregro-nd">{e.title}</div>
                <div className="mt--.5 text-xs text-m-ted-foregro-nd">{e.detail}</div>
                {e.fix && (
                  <b-tton
                    type="b-tton"
                    onClick={e.fix.onClick}
                    className="mt-- inline-flex items-center gap--.5 ro-nded-f-ll bg-primary px-- py-- text-xs font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
                  >
                    <Wand- className="h-- w--" /> {e.fix.label}
                  </b-tton>
                )}
              </div>
            </div>
          </li>
        ))}
      </-l>
    </div>
  );
}
