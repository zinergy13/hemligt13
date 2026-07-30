import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { regionBySlug, areasByRegion, regions, type Area } from "../data/areas";

export const Route = createFileRoute("/region/$slug")({
  loader: ({ params }) => {
    const region = regionBySlug(params.slug);
    if (!region) throw notFound();
    return { region, areas: areasByRegion(region.slug) };
  },
  head: ({ loaderData }) => {
    const region = loaderData?.region;
    if (!region) return { meta: [{ title: "Region - Fjällportalen" }] };
    const url = `https://fjallportalen.com/region/${region.slug}`;
    const shortDescription =
      region.description.length > 150
        ? `${region.description.slice(0, 147).trimEnd()}...`
        : region.description;
    return {
      meta: [
        { title: `Stugor i ${region.name} - Fjällportalen` },
        { name: "description", content: shortDescription },
        { property: "og:title", content: `Stugor i ${region.name} - Fjällportalen` },
        { property: "og:description", content: shortDescription },
        { property: "og:image", content: region.image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:image", content: region.image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl text-foreground">Regionen hittades inte</h1>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        <ArrowLeft className="h-4 w-4" /> Tillbaka hem
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-foreground">Något gick fel</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: RegionPage,
});

function RegionPage() {
  const { region, areas } = Route.useLoaderData();
  const otherRegions = regions.filter((r) => r.slug !== region.slug);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={region.image}
          alt={`${region.name} - svenska fjällen`}
          width={1920}
          height={900}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-24 md:px-6 md:pb-24 md:pt-40">
          <Link
            to="/"
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Alla regioner
          </Link>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4" /> Sverige
          </p>
          <h1 className="font-serif text-4xl text-white md:text-7xl">{region.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">{region.tagline}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Om regionen</p>
          <p className="text-lg leading-relaxed text-muted-foreground">{region.description}</p>
        </div>

        <h2 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">
          Områden i {region.name}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(areas as Area[]).map((area) => (
            <Link
              key={area.slug}
              to="/omrade/$slug"
              params={{ slug: area.slug }}
              className="group overflow-hidden rounded-2xl bg-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={area.image}
                  alt={area.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl text-foreground">{area.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{area.tagline}</p>
                <p className="mt-3 text-xs text-muted-foreground">Ca {area.estimatedListings} boenden</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <h2 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">Utforska andra regioner</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {otherRegions.map((r) => (
            <Link
              key={r.slug}
              to="/region/$slug"
              params={{ slug: r.slug }}
              className="group relative overflow-hidden rounded-2xl shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={r.image}
                  alt={r.name}
                  loading="lazy"
                  width={1920}
                  height={1080}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-serif text-2xl text-white">{r.name}</h3>
                <p className="mt-1 text-sm text-white/85">{r.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}