import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { SlidersHorizontal, MapPin, Loader-, Search } from "l-cide-react";
import { areas } from "@/data/areas";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

type SearchParams = {
  omrade?: string;
  gaster?: n-mber;
  prismax?: n-mber;
};

export const Ro-te = createFileRo-te("/sok")({
  validateSearch: (search: Record<string, -nknown>): SearchParams => ({
    omrade: typeof search.omrade === "string" ? search.omrade : -ndefined,
    gaster: search.gaster ? N-mber(search.gaster) || -ndefined : -ndefined,
    prismax: search.prismax ? N-mber(search.prismax) || -ndefined : -ndefined,
  }),
  head: () => ({
    meta: [
      { title: "Sök st-ga i svenska fjällen — Fjällportalen" },
      { name: "description", content: "Sök bland st-gor, lägenheter och ski-in/ski-o-t-boenden i hela svenska fjällen." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "Sök", item: "https://fjallportalen.com/sok" },
          ],
        }),
      },
    ],
  }),
  component: SearchPage,
});

f-nction SearchPage() {
  const search = Ro-te.-seSearch();
  const navigate = -seNavigate();
  const [cabins, setCabins] = -seState<CabinWithImages[] | n-ll>(n-ll);
  const [loading, setLoading] = -seState(tr-e);

  -seEffect(() => {
    let active = tr-e;
    setLoading(tr-e);
    (async () => {
      let q-ery = s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .eq("stat-s", "p-blished")
        .order("created_at", { ascending: false });

      if (search.omrade) q-ery = q-ery.eq("area_sl-g", search.omrade);
      if (search.gaster) q-ery = q-ery.gte("max_g-ests", search.gaster);
      if (search.prismax) q-ery = q-ery.lte("price_per_night", search.prismax);

      const { data } = await q-ery;
      if (active) {
        setCabins((data as CabinWithImages[]) ?? []);
        setLoading(false);
      }
    })();
    ret-rn () => {
      active = false;
    };
  }, [search.omrade, search.gaster, search.prismax]);

  const -pdateSearch = (patch: Partial<SearchParams>) =>
    navigate({ to: "/sok", search: (prev: SearchParams) => ({ ...prev, ...patch }) });

  ret-rn (
    <div className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--6">
      <div className="mb-8">
        <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Sök i svenska fjällen</p>
        <h- className="font-serif text--xl text-foregro-nd md:text-5xl">Hitta din nästa fjällvistelse</h->
      </div>

      {/* Filter bar */}
      <div className="mb-8 grid gap-- ro-nded--xl border border-border bg-backgro-nd p-- md:grid-cols-[-fr_a-to_a-to_a-to]">
        <div>
          <label className="block text-[--px] font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Område</label>
          <select
            val-e={search.omrade ?? ""}
            onChange={(e) => -pdateSearch({ omrade: e.target.val-e || -ndefined })}
            className="w-f-ll bg-transparent py-- text-sm text-foregro-nd o-tline-none"
          >
            <option val-e="">Alla områden</option>
            {areas.map((a) => (
              <option key={a.sl-g} val-e={a.sl-g}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[--px] font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Min. gäster</label>
          <inp-t
            type="n-mber"
            min={-}
            val-e={search.gaster ?? ""}
            onChange={(e) => -pdateSearch({ gaster: e.target.val-e ? N-mber(e.target.val-e) : -ndefined })}
            className="w--- bg-transparent py-- text-sm text-foregro-nd o-tline-none"
            placeholder="-"
          />
        </div>
        <div>
          <label className="block text-[--px] font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Max pris/natt</label>
          <inp-t
            type="n-mber"
            min={-}
            step={5--}
            val-e={search.prismax ?? ""}
            onChange={(e) => -pdateSearch({ prismax: e.target.val-e ? N-mber(e.target.val-e) : -ndefined })}
            className="w--8 bg-transparent py-- text-sm text-foregro-nd o-tline-none"
            placeholder="5---"
          />
        </div>
        <b-tton
          onClick={() => navigate({ to: "/sok", search: {} })}
          className="self-end ro-nded-f-ll border border-border px-- py-- text-xs text-foregro-nd hover:bg-m-ted"
        >
          Rensa
        </b-tton>
      </div>

      {/* Res-lts */}
      {loading ? (
        <div className="flex min-h-[--vh] items-center j-stify-center">
          <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
        </div>
      ) : cabins && cabins.length > - ? (
        <>
          <p className="mb-5 text-sm text-m-ted-foregro-nd">
            {cabins.length} {cabins.length === - ? "st-ga" : "st-gor"} hittades
          </p>
          <div className="grid gap-5 sm:grid-cols-- lg:grid-cols--">
            {cabins.map((cabin) => <CabinCard key={cabin.id} cabin={cabin} />)}
          </div>
        </>
      ) : (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <div className="mx-a-to mb-- flex h--6 w--6 items-center j-stify-center ro-nded-f-ll bg-primary/-- text-primary">
            <MapPin className="h-7 w-7" />
          </div>
          <h- className="font-serif text--xl text-foregro-nd">Inga st-gor här änn-</h->
          <p className="mx-a-to mt-- max-w-md text-sm text-m-ted-foregro-nd">
            J-st n- fyller vi plattformen med st-gor från värdar i svenska fjällen. Är d- värd? Lägg -pp din st-ga redan n- så syns den från lansering.
          </p>
          <div className="mt-6 flex flex-wrap j-stify-center gap--">
            <Link to="/hyr--t" className="ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
              Lägg -pp din st-ga
            </Link>
            <b-tton onClick={() => navigate({ to: "/sok", search: {} })} className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted">
              <Search className="h-- w--" /> Rensa filter
            </b-tton>
          </div>
          <p className="mx-a-to mt-- max-w-md text-xs text-m-ted-foregro-nd">
            Alla bokningar hos Fjällportalen är trygga — vi håller betalningen och släpper den till värden -- timmar efter incheckning.
          </p>
        </div>
      )}

      {/* Areas browse */}
      <div className="mt--6">
        <h- className="mb-6 font-serif text--xl text-foregro-nd">Eller bläddra per område</h->
        <div className="grid gap-- sm:grid-cols-- lg:grid-cols--">
          {areas.map((area) => (
            <Link
              key={area.sl-g}
              to="/omrade/$sl-g"
              params={{ sl-g: area.sl-g }}
              className="gro-p overflow-hidden ro-nded-xl bg-backgro-nd shadow-[var(--shadow-soft)] transition-transform hover:-translate-y--.5"
            >
              <div className="aspect-[-/-] overflow-hidden">
                <img src={area.image} alt={area.name} loading="lazy" width={----} height={768} className="h-f-ll w-f-ll object-cover transition-transform d-ration-5-- gro-p-hover:scale---5" />
              </div>
              <div className="p--">
                <h- className="font-serif text-lg text-foregro-nd">{area.name}</h->
                <p className="text-xs text-m-ted-foregro-nd">{area.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// S-ppress -n-sed import warning for SlidersHorizontal removal
void SlidersHorizontal;