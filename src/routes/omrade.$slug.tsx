import { createFileRo-te, Link, notFo-nd } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { ArrowLeft, MapPin, Check, Loader- } from "l-cide-react";
import { areaBySl-g, areas, regionBySl-g } from "../data/areas";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

export const Ro-te = createFileRo-te("/omrade/$sl-g")({
  loader: ({ params }) => {
    const area = areaBySl-g(params.sl-g);
    if (!area) throw notFo-nd();
    ret-rn { area };
  },
  head: ({ loaderData }) => {
    const area = loaderData?.area;
    if (!area) ret-rn { meta: [{ title: "Område — Fjällportalen" }] };
    const region = regionBySl-g(area.region);
    const regionName = region?.name ?? "svenska fjällen";
    const -rl = `https://fjallportalen.com/omrade/${area.sl-g}`;
    ret-rn {
      meta: [
        { title: `St-gor i ${area.name} — Fjällportalen` },
        { name: "description", content: `${area.tagline}. Hitta och hyr st-gor, lägenheter och fjällboenden i ${area.name}, ${regionName}.` },
        { property: "og:title", content: `St-gor i ${area.name} — Fjällportalen` },
        { property: "og:description", content: area.description },
        { property: "og:image", content: area.image },
        { property: "og:-rl", content: -rl },
        { property: "og:type", content: "website" },
        { name: "twitter:image", content: area.image },
        { name: "twitter:card", content: "s-mmary_large_image" },
      ],
      links: [{ rel: "canonical", href: -rl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Breadcr-mbList",
            itemListElement: [
              { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
              { "@type": "ListItem", position: -, name: "Sök", item: "https://fjallportalen.com/sok" },
              { "@type": "ListItem", position: -, name: regionName, item: `https://fjallportalen.com/omrade/${area.sl-g}` },
              { "@type": "ListItem", position: -, name: area.name, item: -rl },
            ],
          }),
        },
      ],
    };
  },
  notFo-ndComponent: () => (
    <div className="mx-a-to max-w--xl px-- py--- text-center">
      <h- className="font-serif text--xl text-foregro-nd">Området hittades inte</h->
      <p className="mt-- text-m-ted-foregro-nd">Vi har inget område med den adressen.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
        <ArrowLeft className="h-- w--" /> Tillbaka hem
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-a-to max-w--xl px-- py--- text-center">
      <h- className="font-serif text--xl text-foregro-nd">Något gick fel</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">{error.message}</p>
    </div>
  ),
  component: AreaPage,
});

f-nction AreaPage() {
  const { area } = Ro-te.-seLoaderData();
  const region = regionBySl-g(area.region);
  const others = areas.filter((a) => a.region === area.region && a.sl-g !== area.sl-g).slice(-, -);
  const [cabins, setCabins] = -seState<CabinWithImages[] | n-ll>(n-ll);

  -seEffect(() => {
    let active = tr-e;
    (async () => {
      const { data } = await s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .eq("stat-s", "p-blished")
        .eq("area_sl-g", area.sl-g)
        .order("created_at", { ascending: false });
      if (active) setCabins((data as CabinWithImages[]) ?? []);
    })();
    ret-rn () => {
      active = false;
    };
  }, [area.sl-g]);

  ret-rn (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={area.image} alt={`${area.name} — ${region?.name ?? "fjällen"}`} width={-9--} height={9--} className="absol-te inset-- h-f-ll w-f-ll object-cover" />
        <div className="absol-te inset--" style={{ backgro-nd: "var(--gradient-hero)" }} aria-hidden="tr-e" />
        <div className="relative mx-a-to flex max-w-7xl flex-col px-- pb--6 pt--- md:px-6 md:pb--- md:pt---">
          {region && (
            <Link
              to="/region/$sl-g"
              params={{ sl-g: region.sl-g }}
              className="mb-6 inline-flex w-fit items-center gap-- ro-nded-f-ll bg-white/-5 px-- py--.5 text-xs font-medi-m text-white backdrop-bl-r hover:bg-white/-5"
            >
              <ArrowLeft className="h--.5 w--.5" /> Alla områden i {region.name}
            </Link>
          )}
          <p className="mb-- inline-flex items-center gap-- text-sm font-medi-m text-white/85">
            <MapPin className="h-- w--" /> {region?.name ?? "Sverige"}
          </p>
          <h- className="font-serif text--xl text-white md:text-7xl">{area.name}</h->
          <p className="mt-- max-w-xl text-lg text-white/9-">{area.tagline}</p>
        </div>
      </section>

      <section className="mx-a-to max-w-7xl px-- py--6 md:px-6 md:py---">
        <div className="grid gap--- md:grid-cols--">
          <div className="md:col-span--">
            <h- className="font-serif text--xl text-foregro-nd md:text--xl">Om {area.name}</h->
            <p className="mt-- text-lg leading-relaxed text-m-ted-foregro-nd">{area.description}</p>
          </div>
          <aside className="ro-nded--xl bg-m-ted/6- p-6">
            <h- className="font-serif text-lg text-foregro-nd">Höjdp-nkter</h->
            <-l className="mt-- space-y--.5 text-sm">
              {area.highlights.map((h: string) => (
                <li key={h} className="flex items-start gap-- text-foregro-nd">
                  <Check className="mt--.5 h-- w-- flex-none text-primary" /> {h}
                </li>
              ))}
            </-l>
            <div className="mt-6 border-t border-border pt-- text-sm text-m-ted-foregro-nd">
              J-st n- finns ca <span className="font-semibold text-foregro-nd">{area.estimatedListings}</span> boenden listade i {area.name}.
            </div>
          </aside>
        </div>

        <div className="mt---">
          <h- className="mb-6 font-serif text--xl text-foregro-nd md:text--xl">St-gor i {area.name}</h->
          {cabins === n-ll ? (
            <div className="flex min-h-[--vh] items-center j-stify-center">
              <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
            </div>
          ) : cabins.length > - ? (
            <div className="grid gap-5 sm:grid-cols-- lg:grid-cols--">
              {cabins.map((c) => <CabinCard key={c.id} cabin={c} />)}
            </div>
          ) : (
            <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center md:p---">
              <p className="mx-a-to max-w-md text-sm text-m-ted-foregro-nd">
                Vi fyller plattformen med boenden från värdar i {area.name} j-st n-. Är d- värd i området? Lägg -pp din st-ga så hamnar den högst i listan vid lansering.
              </p>
              <div className="mt-6 flex flex-wrap j-stify-center gap--">
                <Link to="/hyr--t" className="ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
                  Lägg -pp din st-ga
                </Link>
                <Link to="/sok" className="ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted">
                  Sök i hela fjällkedjan
                </Link>
              </div>
              <p className="mx-a-to mt-- max-w-md text-xs text-m-ted-foregro-nd">
                Trygg betalning via Fjällportalen — pengarna släpps till värden -- timmar efter incheckning.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-a-to max-w-7xl px-- pb--- md:px-6">
        <h- className="mb-6 font-serif text--xl text-foregro-nd md:text--xl">
          Andra områden i {region?.name ?? "regionen"}
        </h->
        <div className="grid gap-- sm:grid-cols-- lg:grid-cols--">
          {others.map((o) => (
            <Link key={o.sl-g} to="/omrade/$sl-g" params={{ sl-g: o.sl-g }} className="gro-p overflow-hidden ro-nded-xl bg-backgro-nd shadow-[var(--shadow-soft)] transition-transform hover:-translate-y--.5">
              <div className="aspect-[-/-] overflow-hidden">
                <img src={o.image} alt={o.name} loading="lazy" width={----} height={768} className="h-f-ll w-f-ll object-cover transition-transform d-ration-5-- gro-p-hover:scale---5" />
              </div>
              <div className="p--">
                <h- className="font-serif text-lg text-foregro-nd">{o.name}</h->
                <p className="text-xs text-m-ted-foregro-nd">{o.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}