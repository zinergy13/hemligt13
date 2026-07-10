import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, Save, Sparkles, CalendarRange, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { areaBySlug } from "@/data/areas";

type Cabin = {
  id: string;
  title: string;
  slug: string;
  area_slug: string;
  price_per_night: number;
};

type SeasonPrice = {
  id: string;
  cabin_id: string;
  label: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  price_per_week: number | null;
  min_nights: number | null;
  weekend_only: boolean;
  weekend_surcharge_pct: number;
};

type PricingRule = {
  cabin_id: string;
  last_minute_days: number;
  last_minute_discount_pct: number;
  long_stay_nights: number;
  long_stay_discount_pct: number;
  high_demand_markup_pct: number;
  early_bird_days: number;
  early_bird_discount_pct: number;
};

const emptyRule = (cabin_id: string): PricingRule => ({
  cabin_id,
  last_minute_days: 7,
  last_minute_discount_pct: 0,
  long_stay_nights: 7,
  long_stay_discount_pct: 0,
  high_demand_markup_pct: 0,
  early_bird_days: 60,
  early_bird_discount_pct: 0,
});

const presetSeasons = (year: number) => [
  { label: "Högsäsong vinter", start_date: `${year}-02-15`, end_date: `${year}-03-15`, mult: 1.8 },
  { label: "Sportlov", start_date: `${year}-02-22`, end_date: `${year}-03-08`, mult: 2.2 },
  { label: "Påsk", start_date: `${year}-03-28`, end_date: `${year}-04-07`, mult: 1.6 },
  { label: "Lågsäsong sommar", start_date: `${year}-05-01`, end_date: `${year}-06-15`, mult: 0.7 },
];

export function SeasonPricingManager({ hostId }: { hostId: string }) {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [prices, setPrices] = useState<SeasonPrice[]>([]);
  const [rules, setRules] = useState<Record<string, PricingRule>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCabinId, setSelectedCabinId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId]);

  async function load() {
    setLoading(true);
    const { data: cabinData, error: cabinErr } = await supabase
      .from("cabins")
      .select("id, title, slug, area_slug, price_per_night")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (cabinErr) {
      toast.error(cabinErr.message);
      setLoading(false);
      return;
    }
    const cs = (cabinData ?? []) as Cabin[];
    setCabins(cs);
    setSelectedCabinId((prev) => prev ?? cs[0]?.id ?? null);

    if (cs.length > 0) {
      const ids = cs.map((c) => c.id);
      const [{ data: priceData }, { data: ruleData }] = await Promise.all([
        supabase.from("cabin_season_prices").select("*").in("cabin_id", ids).order("start_date"),
        supabase.from("cabin_pricing_rules").select("*").in("cabin_id", ids),
      ]);
      setPrices((priceData ?? []) as SeasonPrice[]);
      const map: Record<string, PricingRule> = {};
      for (const c of cs) map[c.id] = emptyRule(c.id);
      for (const r of (ruleData ?? []) as PricingRule[]) map[r.cabin_id] = r;
      setRules(map);
    }
    setLoading(false);
  }

  const grouped = useMemo(() => {
    const g: Record<string, Cabin[]> = {};
    for (const c of cabins) {
      (g[c.area_slug] ??= []).push(c);
    }
    return g;
  }, [cabins]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Hämtar dina stugor och priser…
      </div>
    );
  }

  if (cabins.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        Du har inga stugor än. Lägg upp din första stuga för att sätta säsongspriser.
      </div>
    );
  }

  const selected = cabins.find((c) => c.id === selectedCabinId) ?? cabins[0];
  const cabinPrices = prices.filter((p) => p.cabin_id === selected.id);
  const cabinRule = rules[selected.id] ?? emptyRule(selected.id);

  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-foreground">Säsongspriser & prisregler</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sätt olika priser för högsäsong, sportlov och lågsäsong — och lägg till dynamiska rabatter.
          </p>
        </div>
      </div>

      {/* Cabin selector grouped by area */}
      <div className="mb-6 space-y-3">
        {Object.entries(grouped).map(([areaSlug, list]) => {
          const area = areaBySlug(areaSlug);
          return (
            <div key={areaSlug}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {area?.name ?? areaSlug}
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCabinId(c.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      c.id === selected.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 rounded-xl bg-muted/40 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Grundpris för {selected.title}:</span>{" "}
        <span className="font-medium text-foreground">{selected.price_per_night} kr/natt</span>
      </div>

      <SeasonPriceList
        cabin={selected}
        rows={cabinPrices}
        onChange={load}
      />

      <DynamicRulesForm
        rule={cabinRule}
        onSaved={(r) => setRules((prev) => ({ ...prev, [selected.id]: r }))}
      />
    </div>
  );
}

function SeasonPriceList({
  cabin,
  rows,
  onChange,
}: {
  cabin: Cabin;
  rows: SeasonPrice[];
  onChange: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const addPreset = async (preset: { label: string; start_date: string; end_date: string; mult: number }) => {
    const price = Math.round((cabin.price_per_night * preset.mult) / 10) * 10;
    const { error } = await supabase.from("cabin_season_prices").insert({
      cabin_id: cabin.id,
      label: preset.label,
      start_date: preset.start_date,
      end_date: preset.end_date,
      price_per_night: price,
      weekend_only: false,
      weekend_surcharge_pct: 0,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`${preset.label} tillagt`);
      await onChange();
    }
  };

  const deleteRow = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from("cabin_season_prices").delete().eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Säsong borttagen");
      await onChange();
    }
  };

  const year = new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-serif text-lg text-foreground">
          <CalendarRange className="h-4 w-4 text-primary" /> Säsongsperioder
        </h3>
        <button
          onClick={() => setAdding((s) => !s)}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> Ny period
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presetSeasons(year).map((p) => (
          <button
            key={p.label}
            onClick={() => addPreset(p)}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10"
          >
            <Sparkles className="h-3 w-3" /> {p.label} {year}
          </button>
        ))}
      </div>

      {adding && <SeasonForm cabinId={cabin.id} onDone={() => { setAdding(false); void onChange(); }} />}

      {rows.length === 0 && !adding ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Inga säsongspriser satta ännu. Använd knapparna ovan för snabbstart eller lägg till en egen period.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 bg-background px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{r.label}</div>
                <div className="text-xs text-muted-foreground">
                  {r.start_date} → {r.end_date} · {r.price_per_night} kr/natt
                  {r.price_per_week ? ` · ${r.price_per_week} kr/vecka` : ""}
                  {r.min_nights ? ` · min ${r.min_nights} nätter` : ""}
                  {r.weekend_surcharge_pct ? ` · +${r.weekend_surcharge_pct}% helg` : ""}
                </div>
              </div>
              <button
                onClick={() => deleteRow(r.id)}
                disabled={busy === r.id}
                className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                aria-label="Ta bort"
              >
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeasonForm({ cabinId, onDone }: { cabinId: string; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [pricePerWeek, setPricePerWeek] = useState("");
  const [minNights, setMinNights] = useState("");
  const [weekendSurcharge, setWeekendSurcharge] = useState("0");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label || !start || !end || !pricePerNight) {
      toast.error("Fyll i namn, datum och pris/natt");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("cabin_season_prices").insert({
      cabin_id: cabinId,
      label,
      start_date: start,
      end_date: end,
      price_per_night: parseInt(pricePerNight, 10),
      price_per_week: pricePerWeek ? parseInt(pricePerWeek, 10) : null,
      min_nights: minNights ? parseInt(minNights, 10) : null,
      weekend_only: false,
      weekend_surcharge_pct: parseInt(weekendSurcharge || "0", 10),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Period tillagd");
      onDone();
    }
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
      <label className="block text-xs font-medium text-foreground sm:col-span-2">
        Namn på perioden
        <input className={`${inputCls} mt-1`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="t.ex. Nyår" />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Från
        <input type="date" className={`${inputCls} mt-1`} value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Till
        <input type="date" className={`${inputCls} mt-1`} value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Pris per natt (kr)
        <input type="number" min={0} className={`${inputCls} mt-1`} value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Veckopris (kr, valfritt)
        <input type="number" min={0} className={`${inputCls} mt-1`} value={pricePerWeek} onChange={(e) => setPricePerWeek(e.target.value)} placeholder="Lämna tomt för nattpris × 7" />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Minimum antal nätter
        <input type="number" min={1} className={`${inputCls} mt-1`} value={minNights} onChange={(e) => setMinNights(e.target.value)} placeholder="valfritt" />
      </label>
      <label className="block text-xs font-medium text-foreground">
        Helgtillägg (%)
        <input type="number" min={0} max={200} className={`${inputCls} mt-1`} value={weekendSurcharge} onChange={(e) => setWeekendSurcharge(e.target.value)} />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Spara period
        </button>
      </div>
    </form>
  );
}

function DynamicRulesForm({ rule, onSaved }: { rule: PricingRule; onSaved: (r: PricingRule) => void }) {
  const [form, setForm] = useState<PricingRule>(rule);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(rule), [rule.cabin_id]);

  const set = <K extends keyof PricingRule>(k: K, v: PricingRule[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("cabin_pricing_rules")
      .upsert(form, { onConflict: "cabin_id" })
      .select()
      .single();
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Prisregler sparade");
      if (data) onSaved(data as PricingRule);
    }
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <form onSubmit={save} className="mt-8 space-y-4 border-t border-border pt-6">
      <h3 className="flex items-center gap-2 font-serif text-lg text-foreground">
        <TrendingUp className="h-4 w-4 text-primary" /> Dynamiska prisregler
      </h3>
      <p className="text-xs text-muted-foreground">
        Rabatter och tillägg som räknas ovanpå grundpris och säsongspris.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-xs font-semibold text-foreground">Sista minuten-rabatt</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-muted-foreground">
              Färre än (dagar)
              <input type="number" min={0} className={`${inputCls} mt-1`} value={form.last_minute_days} onChange={(e) => set("last_minute_days", parseInt(e.target.value || "0", 10))} />
            </label>
            <label className="block text-xs text-muted-foreground">
              Rabatt (%)
              <input type="number" min={0} max={90} className={`${inputCls} mt-1`} value={form.last_minute_discount_pct} onChange={(e) => set("last_minute_discount_pct", parseInt(e.target.value || "0", 10))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-xs font-semibold text-foreground">Långtidsrabatt</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-muted-foreground">
              Från (nätter)
              <input type="number" min={0} className={`${inputCls} mt-1`} value={form.long_stay_nights} onChange={(e) => set("long_stay_nights", parseInt(e.target.value || "0", 10))} />
            </label>
            <label className="block text-xs text-muted-foreground">
              Rabatt (%)
              <input type="number" min={0} max={90} className={`${inputCls} mt-1`} value={form.long_stay_discount_pct} onChange={(e) => set("long_stay_discount_pct", parseInt(e.target.value || "0", 10))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-xs font-semibold text-foreground">Tidig-bokning-rabatt</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-muted-foreground">
              Mer än (dagar)
              <input type="number" min={0} className={`${inputCls} mt-1`} value={form.early_bird_days} onChange={(e) => set("early_bird_days", parseInt(e.target.value || "0", 10))} />
            </label>
            <label className="block text-xs text-muted-foreground">
              Rabatt (%)
              <input type="number" min={0} max={90} className={`${inputCls} mt-1`} value={form.early_bird_discount_pct} onChange={(e) => set("early_bird_discount_pct", parseInt(e.target.value || "0", 10))} />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-xs font-semibold text-foreground">Högsäsongs-tillägg</legend>
          <label className="block text-xs text-muted-foreground">
            Tillägg vid hög efterfrågan (%)
            <input type="number" min={0} max={200} className={`${inputCls} mt-1`} value={form.high_demand_markup_pct} onChange={(e) => set("high_demand_markup_pct", parseInt(e.target.value || "0", 10))} />
          </label>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Aktiveras automatiskt vid högt bokningstryck (t.ex. skidlov, kalasperioder).
          </p>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Spara prisregler
      </button>
    </form>
  );
}