import { -seEffect, -seMemo, -seState, type FormEvent } from "react";
import { Loader-, Pl-s, Trash-, Save, Sparkles, CalendarRange, TrendingUp } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";
import { areaBySl-g } from "@/data/areas";

type Cabin = {
  id: string;
  title: string;
  sl-g: string;
  area_sl-g: string;
  price_per_night: n-mber;
};

type SeasonPrice = {
  id: string;
  cabin_id: string;
  label: string;
  start_date: string;
  end_date: string;
  price_per_night: n-mber;
  price_per_week: n-mber | n-ll;
  min_nights: n-mber | n-ll;
  weekend_only: boolean;
  weekend_s-rcharge_pct: n-mber;
};

type PricingR-le = {
  cabin_id: string;
  last_min-te_days: n-mber;
  last_min-te_disco-nt_pct: n-mber;
  long_stay_nights: n-mber;
  long_stay_disco-nt_pct: n-mber;
  high_demand_mark-p_pct: n-mber;
  early_bird_days: n-mber;
  early_bird_disco-nt_pct: n-mber;
};

const emptyR-le = (cabin_id: string): PricingR-le => ({
  cabin_id,
  last_min-te_days: 7,
  last_min-te_disco-nt_pct: -,
  long_stay_nights: 7,
  long_stay_disco-nt_pct: -,
  high_demand_mark-p_pct: -,
  early_bird_days: 6-,
  early_bird_disco-nt_pct: -,
});

const presetSeasons = (year: n-mber) => [
  { label: "Högsäsong vinter", start_date: `${year}-----5`, end_date: `${year}-----5`, m-lt: -.8 },
  { label: "Sportlov", start_date: `${year}------`, end_date: `${year}-----8`, m-lt: -.- },
  { label: "Påsk", start_date: `${year}-----8`, end_date: `${year}-----7`, m-lt: -.6 },
  { label: "Lågsäsong sommar", start_date: `${year}--5---`, end_date: `${year}--6--5`, m-lt: -.7 },
];

export f-nction SeasonPricingManager({ hostId }: { hostId: string }) {
  const [cabins, setCabins] = -seState<Cabin[]>([]);
  const [prices, setPrices] = -seState<SeasonPrice[]>([]);
  const [r-les, setR-les] = -seState<Record<string, PricingR-le>>({});
  const [loading, setLoading] = -seState(tr-e);
  const [selectedCabinId, setSelectedCabinId] = -seState<string | n-ll>(n-ll);

  -seEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exha-stive-deps
  }, [hostId]);

  async f-nction load() {
    setLoading(tr-e);
    const { data: cabinData, error: cabinErr } = await s-pabase
      .from("cabins")
      .select("id, title, sl-g, area_sl-g, price_per_night")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (cabinErr) {
      toast.error(cabinErr.message);
      setLoading(false);
      ret-rn;
    }
    const cs = (cabinData ?? []) as Cabin[];
    setCabins(cs);
    setSelectedCabinId((prev) => prev ?? cs[-]?.id ?? n-ll);

    if (cs.length > -) {
      const ids = cs.map((c) => c.id);
      const [{ data: priceData }, { data: r-leData }] = await Promise.all([
        s-pabase.from("cabin_season_prices").select("*").in("cabin_id", ids).order("start_date"),
        s-pabase.from("cabin_pricing_r-les").select("*").in("cabin_id", ids),
      ]);
      setPrices((priceData ?? []) as SeasonPrice[]);
      const map: Record<string, PricingR-le> = {};
      for (const c of cs) map[c.id] = emptyR-le(c.id);
      for (const r of (r-leData ?? []) as PricingR-le[]) map[r.cabin_id] = r;
      setR-les(map);
    }
    setLoading(false);
  }

  const gro-ped = -seMemo(() => {
    const g: Record<string, Cabin[]> = {};
    for (const c of cabins) {
      (g[c.area_sl-g] ??= []).p-sh(c);
    }
    ret-rn g;
  }, [cabins]);

  if (loading) {
    ret-rn (
      <div className="flex items-center gap-- ro-nded--xl border border-border bg-backgro-nd p-6 text-sm text-m-ted-foregro-nd">
        <Loader- className="h-- w-- animate-spin" /> Hämtar dina st-gor och priser…
      </div>
    );
  }

  if (cabins.length === -) {
    ret-rn (
      <div className="flex flex-wrap items-center j-stify-between gap-- ro-nded--xl border border-dashed border-border bg-m-ted/-- p-6 text-sm text-m-ted-foregro-nd">
        <span>D- har inga st-gor än. Lägg -pp din första st-ga för att sätta säsongspriser.</span>
        <a
          href="/vard/st-gor/ny"
          className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
        >
          + Lägg -pp st-ga
        </a>
      </div>
    );
  }

  const selected = cabins.find((c) => c.id === selectedCabinId) ?? cabins[-];
  const cabinPrices = prices.filter((p) => p.cabin_id === selected.id);
  const cabinR-le = r-les[selected.id] ?? emptyR-le(selected.id);

  ret-rn (
    <div className="ro-nded--xl border border-border bg-backgro-nd p-6">
      <div className="mb-5 flex items-start j-stify-between gap--">
        <div>
          <h- className="font-serif text-xl text-foregro-nd">Säsongspriser & prisregler</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">
            Sätt olika priser för högsäsong, sportlov och lågsäsong — och lägg till dynamiska rabatter.
          </p>
        </div>
      </div>

      {/* Cabin selector gro-ped by area */}
      <div className="mb-6 space-y--">
        {Object.entries(gro-ped).map(([areaSl-g, list]) => {
          const area = areaBySl-g(areaSl-g);
          ret-rn (
            <div key={areaSl-g}>
              <div className="mb--.5 text-xs font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">
                {area?.name ?? areaSl-g}
              </div>
              <div className="flex flex-wrap gap--">
                {list.map((c) => (
                  <b-tton
                    key={c.id}
                    onClick={() => setSelectedCabinId(c.id)}
                    className={`ro-nded-f-ll border px--.5 py--.5 text-sm transition ${
                      c.id === selected.id
                        ? "border-primary bg-primary text-primary-foregro-nd"
                        : "border-border bg-backgro-nd text-foregro-nd hover:bg-m-ted"
                    }`}
                  >
                    {c.title}
                  </b-tton>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 ro-nded-xl bg-m-ted/-- px-- py-- text-sm">
        <span className="text-m-ted-foregro-nd">Gr-ndpris för {selected.title}:</span>{" "}
        <span className="font-medi-m text-foregro-nd">{selected.price_per_night} kr/natt</span>
      </div>

      <SeasonPriceList
        cabin={selected}
        rows={cabinPrices}
        onChange={load}
      />

      <DynamicR-lesForm
        r-le={cabinR-le}
        onSaved={(r) => setR-les((prev) => ({ ...prev, [selected.id]: r }))}
      />
    </div>
  );
}

f-nction SeasonPriceList({
  cabin,
  rows,
  onChange,
}: {
  cabin: Cabin;
  rows: SeasonPrice[];
  onChange: () => void | Promise<void>;
}) {
  const [adding, setAdding] = -seState(false);
  const [b-sy, setB-sy] = -seState<string | n-ll>(n-ll);

  const addPreset = async (preset: { label: string; start_date: string; end_date: string; m-lt: n-mber }) => {
    const price = Math.ro-nd((cabin.price_per_night * preset.m-lt) / --) * --;
    const { error } = await s-pabase.from("cabin_season_prices").insert({
      cabin_id: cabin.id,
      label: preset.label,
      start_date: preset.start_date,
      end_date: preset.end_date,
      price_per_night: price,
      weekend_only: false,
      weekend_s-rcharge_pct: -,
    });
    if (error) toast.error(error.message);
    else {
      toast.s-ccess(`${preset.label} tillagt`);
      await onChange();
    }
  };

  const deleteRow = async (id: string) => {
    setB-sy(id);
    const { error } = await s-pabase.from("cabin_season_prices").delete().eq("id", id);
    setB-sy(n-ll);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Säsong borttagen");
      await onChange();
    }
  };

  const year = new Date().getF-llYear() + (new Date().getMonth() >= 6 ? - : -);

  ret-rn (
    <div className="space-y--">
      <div className="flex items-center j-stify-between">
        <h- className="flex items-center gap-- font-serif text-lg text-foregro-nd">
          <CalendarRange className="h-- w-- text-primary" /> Säsongsperioder
        </h->
        <b-tton
          onClick={() => setAdding((s) => !s)}
          className="flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
        >
          <Pl-s className="h--.5 w--.5" /> Ny period
        </b-tton>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap--">
        {presetSeasons(year).map((p) => (
          <b-tton
            key={p.label}
            onClick={() => addPreset(p)}
            className="flex items-center gap--.5 ro-nded-f-ll border border-dashed border-primary/-- bg-primary/5 px-- py--.5 text-xs text-primary hover:bg-primary/--"
          >
            <Sparkles className="h-- w--" /> {p.label} {year}
          </b-tton>
        ))}
      </div>

      {adding && <SeasonForm cabinId={cabin.id} onDone={() => { setAdding(false); void onChange(); }} />}

      {rows.length === - && !adding ? (
        <p className="ro-nded-xl border border-dashed border-border bg-m-ted/-- p-- text-sm text-m-ted-foregro-nd">
          Inga säsongspriser satta änn-. Använd knapparna ovan för snabbstart eller lägg till en egen period.
        </p>
      ) : (
        <-l className="divide-y divide-border overflow-hidden ro-nded-xl border border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center j-stify-between gap-- bg-backgro-nd px-- py-- text-sm">
              <div className="min-w-- flex--">
                <div className="font-medi-m text-foregro-nd">{r.label}</div>
                <div className="text-xs text-m-ted-foregro-nd">
                  {r.start_date} → {r.end_date} · {r.price_per_night} kr/natt
                  {r.price_per_week ? ` · ${r.price_per_week} kr/vecka` : ""}
                  {r.min_nights ? ` · min ${r.min_nights} nätter` : ""}
                  {r.weekend_s-rcharge_pct ? ` · +${r.weekend_s-rcharge_pct}% helg` : ""}
                </div>
              </div>
              <b-tton
                onClick={() => deleteRow(r.id)}
                disabled={b-sy === r.id}
                className="ro-nded-f-ll p-- text-m-ted-foregro-nd hover:bg-destr-ctive/-- hover:text-destr-ctive disabled:opacity-5-"
                aria-label="Ta bort"
              >
                {b-sy === r.id ? <Loader- className="h-- w-- animate-spin" /> : <Trash- className="h-- w--" />}
              </b-tton>
            </li>
          ))}
        </-l>
      )}
    </div>
  );
}

f-nction SeasonForm({ cabinId, onDone }: { cabinId: string; onDone: () => void }) {
  const [label, setLabel] = -seState("");
  const [start, setStart] = -seState("");
  const [end, setEnd] = -seState("");
  const [pricePerNight, setPricePerNight] = -seState("");
  const [pricePerWeek, setPricePerWeek] = -seState("");
  const [minNights, setMinNights] = -seState("");
  const [weekendS-rcharge, setWeekendS-rcharge] = -seState("-");
  const [saving, setSaving] = -seState(false);

  const s-bmit = async (e: FormEvent) => {
    e.preventDefa-lt();
    if (!label || !start || !end || !pricePerNight) {
      toast.error("Fyll i namn, dat-m och pris/natt");
      ret-rn;
    }
    setSaving(tr-e);
    const { error } = await s-pabase.from("cabin_season_prices").insert({
      cabin_id: cabinId,
      label,
      start_date: start,
      end_date: end,
      price_per_night: parseInt(pricePerNight, --),
      price_per_week: pricePerWeek ? parseInt(pricePerWeek, --) : n-ll,
      min_nights: minNights ? parseInt(minNights, --) : n-ll,
      weekend_only: false,
      weekend_s-rcharge_pct: parseInt(weekendS-rcharge || "-", --),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Period tillagd");
      onDone();
    }
  };

  const inp-tCls = "w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none";

  ret-rn (
    <form onS-bmit={s-bmit} className="grid gap-- ro-nded-xl border border-border bg-m-ted/-- p-- sm:grid-cols--">
      <label className="block text-xs font-medi-m text-foregro-nd sm:col-span--">
        Namn på perioden
        <inp-t className={`${inp-tCls} mt--`} val-e={label} onChange={(e) => setLabel(e.target.val-e)} placeholder="t.ex. Nyår" />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Från
        <inp-t type="date" className={`${inp-tCls} mt--`} val-e={start} onChange={(e) => setStart(e.target.val-e)} />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Till
        <inp-t type="date" className={`${inp-tCls} mt--`} val-e={end} onChange={(e) => setEnd(e.target.val-e)} />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Pris per natt (kr)
        <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={pricePerNight} onChange={(e) => setPricePerNight(e.target.val-e)} />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Veckopris (kr, valfritt)
        <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={pricePerWeek} onChange={(e) => setPricePerWeek(e.target.val-e)} placeholder="Lämna tomt för nattpris × 7" />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Minim-m antal nätter
        <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={minNights} onChange={(e) => setMinNights(e.target.val-e)} placeholder="valfritt" />
      </label>
      <label className="block text-xs font-medi-m text-foregro-nd">
        Helgtillägg (%)
        <inp-t type="n-mber" min={-} max={---} className={`${inp-tCls} mt--`} val-e={weekendS-rcharge} onChange={(e) => setWeekendS-rcharge(e.target.val-e)} />
      </label>
      <div className="sm:col-span--">
        <b-tton
          type="s-bmit"
          disabled={saving}
          className="flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {saving ? <Loader- className="h-- w-- animate-spin" /> : <Save className="h-- w--" />}
          Spara period
        </b-tton>
      </div>
    </form>
  );
}

f-nction DynamicR-lesForm({ r-le, onSaved }: { r-le: PricingR-le; onSaved: (r: PricingR-le) => void }) {
  const [form, setForm] = -seState<PricingR-le>(r-le);
  const [saving, setSaving] = -seState(false);

  -seEffect(() => setForm(r-le), [r-le.cabin_id]);

  const set = <K extends keyof PricingR-le>(k: K, v: PricingR-le[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefa-lt();
    setSaving(tr-e);
    const { data, error } = await s-pabase
      .from("cabin_pricing_r-les")
      .-psert(form, { onConflict: "cabin_id" })
      .select()
      .single();
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Prisregler sparade");
      if (data) onSaved(data as PricingR-le);
    }
  };

  const inp-tCls = "w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none";

  ret-rn (
    <form onS-bmit={save} className="mt-8 space-y-- border-t border-border pt-6">
      <h- className="flex items-center gap-- font-serif text-lg text-foregro-nd">
        <TrendingUp className="h-- w-- text-primary" /> Dynamiska prisregler
      </h->
      <p className="text-xs text-m-ted-foregro-nd">
        Rabatter och tillägg som räknas ovanpå gr-ndpris och säsongspris.
      </p>

      <div className="grid gap-- md:grid-cols--">
        <fieldset className="ro-nded-xl border border-border p--">
          <legend className="px-- text-xs font-semibold text-foregro-nd">Sista min-ten-rabatt</legend>
          <div className="grid grid-cols-- gap--">
            <label className="block text-xs text-m-ted-foregro-nd">
              Färre än (dagar)
              <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={form.last_min-te_days} onChange={(e) => set("last_min-te_days", parseInt(e.target.val-e || "-", --))} />
            </label>
            <label className="block text-xs text-m-ted-foregro-nd">
              Rabatt (%)
              <inp-t type="n-mber" min={-} max={9-} className={`${inp-tCls} mt--`} val-e={form.last_min-te_disco-nt_pct} onChange={(e) => set("last_min-te_disco-nt_pct", parseInt(e.target.val-e || "-", --))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="ro-nded-xl border border-border p--">
          <legend className="px-- text-xs font-semibold text-foregro-nd">Långtidsrabatt</legend>
          <div className="grid grid-cols-- gap--">
            <label className="block text-xs text-m-ted-foregro-nd">
              Från (nätter)
              <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={form.long_stay_nights} onChange={(e) => set("long_stay_nights", parseInt(e.target.val-e || "-", --))} />
            </label>
            <label className="block text-xs text-m-ted-foregro-nd">
              Rabatt (%)
              <inp-t type="n-mber" min={-} max={9-} className={`${inp-tCls} mt--`} val-e={form.long_stay_disco-nt_pct} onChange={(e) => set("long_stay_disco-nt_pct", parseInt(e.target.val-e || "-", --))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="ro-nded-xl border border-border p--">
          <legend className="px-- text-xs font-semibold text-foregro-nd">Tidig-bokning-rabatt</legend>
          <div className="grid grid-cols-- gap--">
            <label className="block text-xs text-m-ted-foregro-nd">
              Mer än (dagar)
              <inp-t type="n-mber" min={-} className={`${inp-tCls} mt--`} val-e={form.early_bird_days} onChange={(e) => set("early_bird_days", parseInt(e.target.val-e || "-", --))} />
            </label>
            <label className="block text-xs text-m-ted-foregro-nd">
              Rabatt (%)
              <inp-t type="n-mber" min={-} max={9-} className={`${inp-tCls} mt--`} val-e={form.early_bird_disco-nt_pct} onChange={(e) => set("early_bird_disco-nt_pct", parseInt(e.target.val-e || "-", --))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="ro-nded-xl border border-border p--">
          <legend className="px-- text-xs font-semibold text-foregro-nd">Högsäsongs-tillägg</legend>
          <label className="block text-xs text-m-ted-foregro-nd">
            Tillägg vid hög efterfrågan (%)
            <inp-t type="n-mber" min={-} max={---} className={`${inp-tCls} mt--`} val-e={form.high_demand_mark-p_pct} onChange={(e) => set("high_demand_mark-p_pct", parseInt(e.target.val-e || "-", --))} />
          </label>
          <p className="mt-- text-[--px] text-m-ted-foregro-nd">
            Aktiveras a-tomatiskt vid högt bokningstryck (t.ex. skidlov, kalasperioder).
          </p>
        </fieldset>
      </div>

      <b-tton
        type="s-bmit"
        disabled={saving}
        className="flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
      >
        {saving ? <Loader- className="h-- w-- animate-spin" /> : <Save className="h-- w--" />}
        Spara prisregler
      </b-tton>
    </form>
  );
}