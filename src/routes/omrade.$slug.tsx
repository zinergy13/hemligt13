import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Check, Loader2 } from "lucide-react";
import { areaBySlug, areas, regionBySlug } from "../data/areas";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

export const Route = createFileRoute("/omrade/$slug")({
  loader: ({ params }) => {
    const area = areaBySlug(params.slug);
    if (!area) throw notFound();
    return { area };
  },
  head: ({ loaderData }) => {
    const area = loaderData?.area;
    if (!area) return { meta: [{ title: "Område - Fjällportalen" }] };
    const region = regionBySlug(area.region);
    const regionName = region?.name ?? "svenska fjällen";
    const url = `https://fjallportalen.com/omrade/${area.slug}`;
    return {
      meta: [
        { title: `Stugor i ${area.name} - Fjällportalen` },
        { name: "description", content: `${area.tagline}. Hitta och hyr stugor, lägenheter och fjällboenden i ${area.name}, ${regionName}.` },
        { property: "og:title", content: `Stugor i ${area.name} - Fjällportalen` },
        { property: "og:description", content: area.description },
        { property: "og:image", content: area.image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:image", content: area.image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Hem", item: "https://fjallportalen.com/" },
              { "@type": "ListItem", position: 2, name: "Sök", item: "https://fjallportalen.com/sok" },
              { "@type": "ListItem", position: 3, name: regionName, item: `https://fjallportalen.com/omrade/${area.slug}` },
              { "@type": "ListItem", position: 4, name: area.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl text-foreground">Området hittades inte</h1>
      <p className="mt-3 text-muted-foreground">Vi har inget område med den adressen.</p>
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
  component: AreaPage,
});

function AreaPage() {
  const { area } = Route.useLoaderData();
  const region = regionBySlug(area.region);
  const others = areas.filter((a) => a.region === area.region && a.slug !== area.slug).slice(0, 4);
  const [cabins, setCabins] = useState<CabinWithImages[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .eq("status", "published")
        .eq("area_slug", area.slug)
        .order("created_at", { ascending: false });
      if (active) setCabins((data as CabinWithImages[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [area.slug]);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={area.image} alt={`${area.name} - ${region?.name ?? "fjällen"}`} width={1920} height={900} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-24 md:px-6 md:pb-24 md:pt-40">
          {region && (
            <Link
              to="/region/$slug"
              params={{ slug: region.slug }}
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Alla områden i {region.name}
            </Link>
          )}
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4" /> {region?.name ?? "Sverige"}
          </p>
          <h1 className="font-serif text-4xl text-white md:text-7xl">{area.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/90">{area.tagline}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-serif text-2xl text-foreground md:text-3xl">Om {area.name}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{area.description}</p>
          </div>
          <aside className="rounded-2xl bg-muted/60 p-6">
            <h3 className="font-serif text-lg text-foreground">Höjdpunkter</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {area.highlights.map((h: string) => (
                <li key={h} className="flex items-start gap-2 text-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-primary" /> {h}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
              Just nu finns ca <span className="font-semibold text-foreground">{area.estimatedListings}</span> boenden listade i {area.name}.
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <h3 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">Stugor i {area.name}</h3>
          {cabins === null ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cabins.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cabins.map((c) => <CabinCard key={c.id} cabin={c} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center md:p-14">
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Vi fyller plattformen med boenden från värdar i {area.name} just nu. Är du värd i området? Lägg upp din stuga så hamnar den högst i listan vid lansering.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/hyr-ut" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Lägg upp din stuga
                </Link>
                <Link to="/sok" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                  Sök i hela fjällkedjan
                </Link>
              </div>
              <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
                Trygg betalning via Fjällportalen - pengarna släpps till värden 24 timmar efter incheckning.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <h2 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">
          Andra områden i {region?.name ?? "regionen"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <Link key={o.slug} to="/omrade/$slug" params={{ slug: o.slug }} className="group overflow-hidden rounded-xl bg-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={o.image} alt={`Vintervy över fjällområdet ${o.name}`} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg text-foreground">{o.name}</h3>
                <p className="text-xs text-muted-foreground">{o.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}