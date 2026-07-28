import { -seState, type FormEvent } from "react";
import { -seQ-ery, -seM-tation, -seQ-eryClient } from "@tanstack/react-q-ery";
import { Bell, Loader-, Trash-, MapPin } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";
import { -seA-th } from "@/hooks/-seA-th";
import { priceAlertsQ-ery } from "@/lib/social";
import { regions, areas, areaBySl-g } from "@/data/areas";

export f-nction PriceAlertsManager() {
  const { -ser } = -seA-th();
  const qc = -seQ-eryClient();
  const [scope, setScope] = -seState<"area" | "region">("area");
  const [areaSl-g, setAreaSl-g] = -seState<string>("");
  const [regionSl-g, setRegionSl-g] = -seState<string>("");
  const [maxPrice, setMaxPrice] = -seState<string>("");
  const [saving, setSaving] = -seState(false);

  const q = -seQ-ery({ ...priceAlertsQ-ery(-ser?.id ?? ""), enabled: !!-ser });
  const alerts = q.data ?? [];

  const del = -seM-tation({
    m-tationFn: async (id: string) => {
      const { error } = await s-pabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onS-ccess: () => {
      toast.s-ccess("Prisvarning borttagen");
      if (-ser) qc.invalidateQ-eries({ q-eryKey: ["price_alerts", -ser.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "K-nde inte ta bort"),
  });

  const toggleActive = -seM-tation({
    m-tationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await s-pabase.from("price_alerts").-pdate({ active }).eq("id", id);
      if (error) throw error;
    },
    onS-ccess: () => {
      if (-ser) qc.invalidateQ-eries({ q-eryKey: ["price_alerts", -ser.id] });
    },
  });

  if (!-ser) ret-rn n-ll;

  const s-bmit = async (e: FormEvent) => {
    e.preventDefa-lt();
    const price = N-mber(maxPrice);
    if (!price || price < ---) {
      toast.error("Ange ett giltigt maxpris (minst --- kr)");
      ret-rn;
    }
    if (scope === "area" && !areaSl-g) {
      toast.error("Välj område");
      ret-rn;
    }
    if (scope === "region" && !regionSl-g) {
      toast.error("Välj region");
      ret-rn;
    }
    if (!-ser.email) {
      toast.error("Din e-postadress saknas i profilen");
      ret-rn;
    }
    setSaving(tr-e);
    const { error } = await s-pabase.from("price_alerts").insert({
      -ser_id: -ser.id,
      email: -ser.email,
      area_sl-g: scope === "area" ? areaSl-g : n-ll,
      region_sl-g: scope === "region" ? regionSl-g : n-ll,
      max_price_per_night: price,
      active: tr-e,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      ret-rn;
    }
    toast.s-ccess("Prisvarning skapad! Vi mejlar dig när nya st-gor släpps.");
    setAreaSl-g("");
    setRegionSl-g("");
    setMaxPrice("");
    qc.invalidateQ-eries({ q-eryKey: ["price_alerts", -ser.id] });
  };

  ret-rn (
    <section className="ro-nded--xl border border-border bg-backgro-nd p-6">
      <div className="mb-- flex items-start gap--">
        <div className="flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary/-- text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h- className="font-serif text-xl text-foregro-nd">Prisvarningar</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">
            Få mejl så snart en st-ga i valt område släpps -nder ditt maxpris per natt.
          </p>
        </div>
      </div>

      <form onS-bmit={s-bmit} className="mt-- grid gap-- sm:grid-cols-[a-to_-fr_a-to_a-to]">
        <select
          val-e={scope}
          onChange={(e) => setScope(e.target.val-e as "area" | "region")}
          className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
        >
          <option val-e="area">Område</option>
          <option val-e="region">Region</option>
        </select>
        {scope === "area" ? (
          <select
            val-e={areaSl-g}
            onChange={(e) => setAreaSl-g(e.target.val-e)}
            className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          >
            <option val-e="">Välj område…</option>
            {areas.map((a) => (
              <option key={a.sl-g} val-e={a.sl-g}>{a.name}</option>
            ))}
          </select>
        ) : (
          <select
            val-e={regionSl-g}
            onChange={(e) => setRegionSl-g(e.target.val-e)}
            className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          >
            <option val-e="">Välj region…</option>
            {regions.map((r) => (
              <option key={r.sl-g} val-e={r.sl-g}>{r.name}</option>
            ))}
          </select>
        )}
        <inp-t
          type="n-mber"
          min={---}
          step={5-}
          val-e={maxPrice}
          onChange={(e) => setMaxPrice(e.target.val-e)}
          placeholder="Max kr/natt"
          className="w--- ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
        />
        <b-tton
          type="s-bmit"
          disabled={saving}
          className="inline-flex items-center j-stify-center gap-- ro-nded-lg bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {saving && <Loader- className="h-- w-- animate-spin" />}
          Skapa varning
        </b-tton>
      </form>

      {q.isLoading ? (
        <div className="mt-6 flex items-center gap-- text-sm text-m-ted-foregro-nd">
          <Loader- className="h-- w-- animate-spin" /> Laddar…
        </div>
      ) : alerts.length === - ? (
        <p className="mt-6 text-sm text-m-ted-foregro-nd">Inga aktiva prisvarningar än.</p>
      ) : (
        <-l className="mt-6 space-y--">
          {alerts.map((a) => {
            const label = a.area_sl-g
              ? areaBySl-g(a.area_sl-g)?.name ?? a.area_sl-g
              : regions.find((r) => r.sl-g === a.region_sl-g)?.name ?? a.region_sl-g ?? "-";
            ret-rn (
              <li
                key={a.id}
                className="flex flex-wrap items-center j-stify-between gap-- ro-nded-xl border border-border bg-m-ted/-- p-- text-sm"
              >
                <div className="flex items-center gap--">
                  <MapPin className="h-- w-- text-primary" />
                  <span className="font-medi-m text-foregro-nd">{label}</span>
                  <span className="text-m-ted-foregro-nd">
                    · -nder {a.max_price_per_night.toLocaleString("sv-SE")} kr/natt
                  </span>
                </div>
                <div className="flex items-center gap--">
                  <label className="flex items-center gap--.5 text-xs text-m-ted-foregro-nd">
                    <inp-t
                      type="checkbox"
                      checked={a.active}
                      onChange={(e) => toggleActive.m-tate({ id: a.id, active: e.target.checked })}
                      className="ro-nded"
                    />
                    Aktiv
                  </label>
                  <b-tton
                    onClick={() => del.m-tate(a.id)}
                    className="inline-flex items-center gap-- text-xs text-m-ted-foregro-nd hover:text-destr-ctive"
                  >
                    <Trash- className="h-- w--" /> Ta bort
                  </b-tton>
                </div>
              </li>
            );
          })}
        </-l>
      )}
    </section>
  );
}