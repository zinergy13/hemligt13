import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ShieldAlert, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { areas } from "@/data/areas";
import { formatOreKr } from "@/lib/extras";

export const Route = createFileRoute("/admin/stadfirmor")({
  head: () => ({ meta: [{ title: "Städfirmor — Admin — Fjällhuset" }] }),
  component: AdminFirmsPage,
});

type Firm = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  invoice_email: string | null;
  is_active: boolean;
};

type Price = { id: string; firm_id: string; min_sqm: number; max_sqm: number; price_to_firm: number };
type Area = { firm_id: string; area_slug: string };

function AdminFirmsPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [firmAreas, setFirmAreas] = useState<Area[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/logga-in", search: { redirect: "/admin/stadfirmor" } });
  }, [loading, user, navigate]);

  const reload = async () => {
    setLoadingData(true);
    const [f, p, a] = await Promise.all([
      supabase.from("cleaning_firms").select("*").order("created_at"),
      supabase.from("cleaning_firm_prices").select("*").order("min_sqm"),
      supabase.from("firm_areas").select("firm_id, area_slug"),
    ]);
    setFirms((f.data as Firm[]) ?? []);
    setPrices((p.data as Price[]) ?? []);
    setFirmAreas((a.data as Area[]) ?? []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-serif text-3xl text-foreground">Endast för admin</h1>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Till startsidan
        </Link>
      </div>
    );
  }

  const addFirm = async () => {
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("cleaning_firms").insert({ name });
    if (error) toast.error(error.message);
    else {
      setNewName("");
      toast.success("Firma tillagd");
      reload();
    }
  };

  const removeFirm = async (id: string) => {
    if (!confirm("Radera firma? Alla kopplade priser och områden försvinner.")) return;
    const { error } = await supabase.from("cleaning_firms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else reload();
  };

  const toggleArea = async (firmId: string, slug: string) => {
    const exists = firmAreas.some((r) => r.firm_id === firmId && r.area_slug === slug);
    if (exists) {
      await supabase.from("firm_areas").delete().eq("firm_id", firmId).eq("area_slug", slug);
    } else {
      await supabase.from("firm_areas").insert({ firm_id: firmId, area_slug: slug });
    }
    reload();
  };

  const addPrice = async (firmId: string, min: number, max: number, kr: number) => {
    if (!(min >= 0) || !(max >= min) || !(kr > 0)) {
      toast.error("Fel intervall eller pris");
      return;
    }
    const { error } = await supabase
      .from("cleaning_firm_prices")
      .insert({ firm_id: firmId, min_sqm: min, max_sqm: max, price_to_firm: kr * 100 });
    if (error) toast.error(error.message);
    else reload();
  };

  const removePrice = async (id: string) => {
    await supabase.from("cleaning_firm_prices").delete().eq("id", id);
    reload();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Tillbaka till admin
      </Link>
      <h1 className="font-serif text-3xl text-foreground">Städfirmor</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hantera firmor, deras områden och prislistor per kvm.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ny städfirma..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={addFirm}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Lägg till
        </button>
      </div>

      {loadingData ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : firms.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Inga städfirmor än. Lägg till en ovan.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {firms.map((firm) => (
            <FirmCard
              key={firm.id}
              firm={firm}
              prices={prices.filter((p) => p.firm_id === firm.id)}
              coveredAreas={new Set(firmAreas.filter((a) => a.firm_id === firm.id).map((a) => a.area_slug))}
              onRemove={() => removeFirm(firm.id)}
              onToggleArea={(slug) => toggleArea(firm.id, slug)}
              onAddPrice={(min, max, kr) => addPrice(firm.id, min, max, kr)}
              onRemovePrice={removePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FirmCard({
  firm,
  prices,
  coveredAreas,
  onRemove,
  onToggleArea,
  onAddPrice,
  onRemovePrice,
}: {
  firm: Firm;
  prices: Price[];
  coveredAreas: Set<string>;
  onRemove: () => void;
  onToggleArea: (slug: string) => void;
  onAddPrice: (min: number, max: number, kr: number) => void;
  onRemovePrice: (id: string) => void;
}) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [kr, setKr] = useState("");

  return (
    <section className="rounded-2xl border border-border bg-background p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-foreground">{firm.name}</h2>
          {!firm.is_active && (
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inaktiv</span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Radera
        </button>
      </header>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fjällområden</h3>
        <div className="flex flex-wrap gap-1.5">
          {areas.map((a) => {
            const on = coveredAreas.has(a.slug);
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => onToggleArea(a.slug)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prislista per kvm</h3>
        {prices.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {prices.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5">
                <span className="text-foreground">
                  {p.min_sqm}–{p.max_sqm} kvm
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium">{formatOreKr(p.price_to_firm)}</span>
                  <button onClick={() => onRemovePrice(p.id)} className="text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-4 gap-2">
          <input value={min} onChange={(e) => setMin(e.target.value)} type="number" placeholder="Min kvm" className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          <input value={max} onChange={(e) => setMax(e.target.value)} type="number" placeholder="Max kvm" className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          <input value={kr} onChange={(e) => setKr(e.target.value)} type="number" placeholder="Pris (kr)" className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          <button
            type="button"
            onClick={() => {
              onAddPrice(Number(min), Number(max), Number(kr));
              setMin(""); setMax(""); setKr("");
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Lägg till
          </button>
        </div>
      </div>
    </section>
  );
}