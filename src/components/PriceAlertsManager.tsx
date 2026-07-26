import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { priceAlertsQuery } from "@/lib/social";
import { regions, areas, areaBySlug } from "@/data/areas";

export function PriceAlertsManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<"area" | "region">("area");
  const [areaSlug, setAreaSlug] = useState<string>("");
  const [regionSlug, setRegionSlug] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const q = useQuery({ ...priceAlertsQuery(user?.id ?? ""), enabled: !!user });
  const alerts = q.data ?? [];

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prisvarning borttagen");
      if (user) qc.invalidateQueries({ queryKey: ["price_alerts", user.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte ta bort"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("price_alerts").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ["price_alerts", user.id] });
    },
  });

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const price = Number(maxPrice);
    if (!price || price < 100) {
      toast.error("Ange ett giltigt maxpris (minst 100 kr)");
      return;
    }
    if (scope === "area" && !areaSlug) {
      toast.error("Välj område");
      return;
    }
    if (scope === "region" && !regionSlug) {
      toast.error("Välj region");
      return;
    }
    if (!user.email) {
      toast.error("Din e-postadress saknas i profilen");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      email: user.email,
      area_slug: scope === "area" ? areaSlug : null,
      region_slug: scope === "region" ? regionSlug : null,
      max_price_per_night: price,
      active: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Prisvarning skapad! Vi mejlar dig när nya stugor släpps.");
    setAreaSlug("");
    setRegionSlug("");
    setMaxPrice("");
    qc.invalidateQueries({ queryKey: ["price_alerts", user.id] });
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-foreground">Prisvarningar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Få mejl så snart en stuga i valt område släpps under ditt maxpris per natt.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto_auto]">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "area" | "region")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="area">Område</option>
          <option value="region">Region</option>
        </select>
        {scope === "area" ? (
          <select
            value={areaSlug}
            onChange={(e) => setAreaSlug(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Välj område…</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        ) : (
          <select
            value={regionSlug}
            onChange={(e) => setRegionSlug(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Välj region…</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        )}
        <input
          type="number"
          min={100}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max kr/natt"
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Skapa varning
        </button>
      </form>

      {q.isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
        </div>
      ) : alerts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Inga aktiva prisvarningar än.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {alerts.map((a) => {
            const label = a.area_slug
              ? areaBySlug(a.area_slug)?.name ?? a.area_slug
              : regions.find((r) => r.slug === a.region_slug)?.name ?? a.region_slug ?? "—";
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground">
                    · under {a.max_price_per_night.toLocaleString("sv-SE")} kr/natt
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={a.active}
                      onChange={(e) => toggleActive.mutate({ id: a.id, active: e.target.checked })}
                      className="rounded"
                    />
                    Aktiv
                  </label>
                  <button
                    onClick={() => del.mutate(a.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Ta bort
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}