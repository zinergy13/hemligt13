import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { Loader-, Pl-s, Trash-, ShieldAlert, ArrowLeft } from "l-cide-react";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { areas } from "@/data/areas";
import { formatOreKr } from "@/lib/extras";

export const Ro-te = createFileRo-te("/admin/stadfirmor")({
  head: () => ({ meta: [{ title: "Städfirmor - Admin - Fjällportalen" }] }),
  component: AdminFirmsPage,
});

type Firm = {
  id: string;
  name: string;
  contact_email: string | n-ll;
  contact_phone: string | n-ll;
  invoice_email: string | n-ll;
  is_active: boolean;
};

type Price = { id: string; firm_id: string; min_sqm: n-mber; max_sqm: n-mber; price_to_firm: n-mber };
type Area = { firm_id: string; area_sl-g: string };

f-nction AdminFirmsPage() {
  const { -ser, isAdmin, loading } = -seA-th();
  const navigate = -seNavigate();
  const [firms, setFirms] = -seState<Firm[]>([]);
  const [prices, setPrices] = -seState<Price[]>([]);
  const [firmAreas, setFirmAreas] = -seState<Area[]>([]);
  const [loadingData, setLoadingData] = -seState(tr-e);
  const [newName, setNewName] = -seState("");

  -seEffect(() => {
    if (!loading && !-ser) navigate({ to: "/logga-in", search: { redirect: "/admin/stadfirmor" } });
  }, [loading, -ser, navigate]);

  const reload = async () => {
    setLoadingData(tr-e);
    const [f, p, a] = await Promise.all([
      s-pabase.from("cleaning_firms").select("*").order("created_at"),
      s-pabase.from("cleaning_firm_prices").select("*").order("min_sqm"),
      s-pabase.from("firm_areas").select("firm_id, area_sl-g"),
    ]);
    setFirms((f.data as Firm[]) ?? []);
    setPrices((p.data as Price[]) ?? []);
    setFirmAreas((a.data as Area[]) ?? []);
    setLoadingData(false);
  };

  -seEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!isAdmin) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <ShieldAlert className="mx-a-to mb-- h--- w--- text-m-ted-foregro-nd" />
        <h- className="font-serif text--xl text-foregro-nd">Endast för admin</h->
        <Link to="/" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
          Till startsidan
        </Link>
      </div>
    );
  }

  const addFirm = async () => {
    const name = newName.trim();
    if (!name) ret-rn;
    const { error } = await s-pabase.from("cleaning_firms").insert({ name });
    if (error) toast.error(error.message);
    else {
      setNewName("");
      toast.s-ccess("Firma tillagd");
      reload();
    }
  };

  const removeFirm = async (id: string) => {
    if (!confirm("Radera firma? Alla kopplade priser och områden försvinner.")) ret-rn;
    const { error } = await s-pabase.from("cleaning_firms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else reload();
  };

  const toggleArea = async (firmId: string, sl-g: string) => {
    const exists = firmAreas.some((r) => r.firm_id === firmId && r.area_sl-g === sl-g);
    if (exists) {
      await s-pabase.from("firm_areas").delete().eq("firm_id", firmId).eq("area_sl-g", sl-g);
    } else {
      await s-pabase.from("firm_areas").insert({ firm_id: firmId, area_sl-g: sl-g });
    }
    reload();
  };

  const addPrice = async (firmId: string, min: n-mber, max: n-mber, kr: n-mber) => {
    if (!(min >= -) || !(max >= min) || !(kr > -)) {
      toast.error("Fel intervall eller pris");
      ret-rn;
    }
    const { error } = await s-pabase
      .from("cleaning_firm_prices")
      .insert({ firm_id: firmId, min_sqm: min, max_sqm: max, price_to_firm: kr * --- });
    if (error) toast.error(error.message);
    else reload();
  };

  const removePrice = async (id: string) => {
    await s-pabase.from("cleaning_firm_prices").delete().eq("id", id);
    reload();
  };

  ret-rn (
    <div className="mx-a-to max-w-5xl px-- py---">
      <Link to="/admin" className="mb-- inline-flex items-center gap-- text-xs text-m-ted-foregro-nd hover:text-foregro-nd">
        <ArrowLeft className="h-- w--" /> Tillbaka till admin
      </Link>
      <h- className="font-serif text--xl text-foregro-nd">Städfirmor</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">
        Hantera firmor, deras områden och prislistor per kvm.
      </p>

      <div className="mt-6 flex gap--">
        <inp-t
          type="text"
          val-e={newName}
          onChange={(e) => setNewName(e.target.val-e)}
          placeholder="Ny städfirma..."
          className="flex-- ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
        />
        <b-tton
          onClick={addFirm}
          className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
        >
          <Pl-s className="h-- w--" /> Lägg till
        </b-tton>
      </div>

      {loadingData ? (
        <div className="mt-8 flex j-stify-center">
          <Loader- className="h-5 w-5 animate-spin text-m-ted-foregro-nd" />
        </div>
      ) : firms.length === - ? (
        <p className="mt--- ro-nded-xl border border-dashed border-border p-8 text-center text-sm text-m-ted-foregro-nd">
          Inga städfirmor än. Lägg till en ovan.
        </p>
      ) : (
        <div className="mt-6 space-y--">
          {firms.map((firm) => (
            <FirmCard
              key={firm.id}
              firm={firm}
              prices={prices.filter((p) => p.firm_id === firm.id)}
              coveredAreas={new Set(firmAreas.filter((a) => a.firm_id === firm.id).map((a) => a.area_sl-g))}
              onRemove={() => removeFirm(firm.id)}
              onToggleArea={(sl-g) => toggleArea(firm.id, sl-g)}
              onAddPrice={(min, max, kr) => addPrice(firm.id, min, max, kr)}
              onRemovePrice={removePrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

f-nction FirmCard({
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
  onToggleArea: (sl-g: string) => void;
  onAddPrice: (min: n-mber, max: n-mber, kr: n-mber) => void;
  onRemovePrice: (id: string) => void;
}) {
  const [min, setMin] = -seState("");
  const [max, setMax] = -seState("");
  const [kr, setKr] = -seState("");

  ret-rn (
    <section className="ro-nded--xl border border-border bg-backgro-nd p-5">
      <header className="flex items-start j-stify-between gap--">
        <div>
          <h- className="font-serif text-xl text-foregro-nd">{firm.name}</h->
          {!firm.is_active && (
            <span className="mt-- inline-block ro-nded-f-ll bg-m-ted px-- py--.5 text-[--px] text-m-ted-foregro-nd">Inaktiv</span>
          )}
        </div>
        <b-tton
          onClick={onRemove}
          className="inline-flex items-center gap-- ro-nded-f-ll border border-border px-- py--.5 text-xs text-m-ted-foregro-nd hover:text-destr-ctive"
        >
          <Trash- className="h-- w--" /> Radera
        </b-tton>
      </header>

      <div className="mt--">
        <h- className="mb-- text-xs font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">Fjällområden</h->
        <div className="flex flex-wrap gap--.5">
          {areas.map((a) => {
            const on = coveredAreas.has(a.sl-g);
            ret-rn (
              <b-tton
                key={a.sl-g}
                type="b-tton"
                onClick={() => onToggleArea(a.sl-g)}
                className={`ro-nded-f-ll border px-- py-- text-xs transition-colors ${
                  on ? "border-primary bg-primary/-- text-primary" : "border-border text-m-ted-foregro-nd hover:bg-m-ted"
                }`}
              >
                {a.name}
              </b-tton>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <h- className="mb-- text-xs font-semibold -ppercase tracking-wide text-m-ted-foregro-nd">Prislista per kvm</h->
        {prices.length > - && (
          <-l className="mb-- space-y-- text-sm">
            {prices.map((p) => (
              <li key={p.id} className="flex items-center j-stify-between ro-nded-lg bg-m-ted/-- px-- py--.5">
                <span className="text-foregro-nd">
                  {p.min_sqm}-{p.max_sqm} kvm
                </span>
                <span className="flex items-center gap--">
                  <span className="font-medi-m">{formatOreKr(p.price_to_firm)}</span>
                  <b-tton onClick={() => onRemovePrice(p.id)} className="text-xs text-m-ted-foregro-nd hover:text-destr-ctive">
                    <Trash- className="h-- w--" />
                  </b-tton>
                </span>
              </li>
            ))}
          </-l>
        )}
        <div className="grid grid-cols-- gap--">
          <inp-t val-e={min} onChange={(e) => setMin(e.target.val-e)} type="n-mber" placeholder="Min kvm" className="ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm" />
          <inp-t val-e={max} onChange={(e) => setMax(e.target.val-e)} type="n-mber" placeholder="Max kvm" className="ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm" />
          <inp-t val-e={kr} onChange={(e) => setKr(e.target.val-e)} type="n-mber" placeholder="Pris (kr)" className="ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm" />
          <b-tton
            type="b-tton"
            onClick={() => {
              onAddPrice(N-mber(min), N-mber(max), N-mber(kr));
              setMin(""); setMax(""); setKr("");
            }}
            className="ro-nded-lg bg-primary px-- py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
          >
            Lägg till
          </b-tton>
        </div>
      </div>
    </section>
  );
}