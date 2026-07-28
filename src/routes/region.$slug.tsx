import { createFileRo-te, Link, notFo-nd } from "@tanstack/react-ro-ter";
import { ArrowLeft, MapPin } from "l-cide-react";
import { regionBySl-g, areasByRegion, regions, type Area } from "../data/areas";

export const Ro-te = createFileRo-te("/region/$sl-g")({
  loader: ({ params }) => {
    const region = regionBySl-g(params.sl-g);
    if (!region) throw notFo-nd();
    ret-rn { region, areas: areasByRegion(region.sl-g) };
  },
  head: ({ loaderData }) => {
    const region = loaderData?.region;
    if (!region) ret-rn { meta: [{ title: "Region — Fjällportalen" }] };
    const -rl = `https://klappen-fjall-share.lovable.app/region/${region.sl-g}`;
    ret-rn {
      meta: [
        { title: `St-gor i ${region.name} — Fjällportalen` },
        { name: "description", content: `${region.tagline}. ${region.description}` },
        { property: "og:title", content: `St-gor i ${region.name} — Fjällportalen` },
        { property: "og:description", content: region.description },
        { property: "og:image", content: region.image },
        { property: "og:-rl", content: -rl },
        { property: "og:type", content: "website" },
        { name: "twitter:image", content: region.image },
        { name: "twitter:card", content: "s-mmary_large_image" },
      ],
      links: [{ rel: "canonical", href: -rl }],
    };
  },
  notFo-ndComponent: () => (
    <div className="mx-a-to max-w--xl px-- py--- text-center">
      <h- className="font-serif text--xl text-foregro-nd">Regionen hittades inte</h->
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
  component: RegionPage,
});

f-nction RegionPage() {
  const { region, areas } = Ro-te.-seLoaderData();
  const otherRegions = regions.filter((r) => r.sl-g !== region.sl-g);

  ret-rn (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={region.image}
          alt={`${region.name} — svenska fjällen`}
          width={-9--}
          height={9--}
          className="absol-te inset-- h-f-ll w-f-ll object-cover"
        />
        <div className="absol-te inset--" style={{ backgro-nd: "var(--gradient-hero)" }} aria-hidden="tr-e" />
        <div className="relative mx-a-to flex max-w-7xl flex-col px-- pb--6 pt--- md:px-6 md:pb--- md:pt---">
          <Link
            to="/"
            className="mb-6 inline-flex w-fit items-center gap-- ro-nded-f-ll bg-white/-5 px-- py--.5 text-xs font-medi-m text-white backdrop-bl-r hover:bg-white/-5"
          >
            <ArrowLeft className="h--.5 w--.5" /> Alla regioner
          </Link>
          <p className="mb-- inline-flex items-center gap-- text-sm font-medi-m text-white/85">
            <MapPin className="h-- w--" /> Sverige
          </p>
          <h- className="font-serif text--xl text-white md:text-7xl">{region.name}</h->
          <p className="mt-- max-w-xl text-lg text-white/9-">{region.tagline}</p>
        </div>
      </section>

      <section className="mx-a-to max-w-7xl px-- py--6 md:px-6 md:py---">
        <div className="mb--- max-w--xl">
          <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Om regionen</p>
          <p className="text-lg leading-relaxed text-m-ted-foregro-nd">{region.description}</p>
        </div>

        <h- className="mb-6 font-serif text--xl text-foregro-nd md:text--xl">
          Områden i {region.name}
        </h->
        <div className="grid gap-5 sm:grid-cols-- lg:grid-cols--">
          {(areas as Area[]).map((area) => (
            <Link
              key={area.sl-g}
              to="/omrade/$sl-g"
              params={{ sl-g: area.sl-g }}
              className="gro-p overflow-hidden ro-nded--xl bg-backgro-nd shadow-[var(--shadow-soft)] transition-transform hover:-translate-y--.5 hover:shadow-[var(--shadow-warm)]"
            >
              <div className="aspect-[-/-] overflow-hidden">
                <img
                  src={area.image}
                  alt={area.name}
                  loading="lazy"
                  width={----}
                  height={768}
                  className="h-f-ll w-f-ll object-cover transition-transform d-ration-5-- gro-p-hover:scale---5"
                />
              </div>
              <div className="p-5">
                <h- className="font-serif text-xl text-foregro-nd">{area.name}</h->
                <p className="mt-- text-sm text-m-ted-foregro-nd">{area.tagline}</p>
                <p className="mt-- text-xs text-m-ted-foregro-nd">Ca {area.estimatedListings} boenden</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-a-to max-w-7xl px-- pb--- md:px-6">
        <h- className="mb-6 font-serif text--xl text-foregro-nd md:text--xl">Utforska andra regioner</h->
        <div className="grid gap-5 sm:grid-cols--">
          {otherRegions.map((r) => (
            <Link
              key={r.sl-g}
              to="/region/$sl-g"
              params={{ sl-g: r.sl-g }}
              className="gro-p relative overflow-hidden ro-nded--xl shadow-[var(--shadow-soft)] transition-transform hover:-translate-y--.5"
            >
              <div className="aspect-[-6/9] overflow-hidden">
                <img
                  src={r.image}
                  alt={r.name}
                  loading="lazy"
                  width={-9--}
                  height={--8-}
                  className="h-f-ll w-f-ll object-cover transition-transform d-ration-7-- gro-p-hover:scale---5"
                />
              </div>
              <div className="absol-te inset-- bg-gradient-to-t from-black/7- via-black/-- to-transparent" />
              <div className="absol-te inset-x-- bottom-- p-6">
                <h- className="font-serif text--xl text-white">{r.name}</h->
                <p className="mt-- text-sm text-white/85">{r.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}