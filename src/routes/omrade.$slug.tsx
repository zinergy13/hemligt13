import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { areaBySlug, areas } from "../data/areas";

export const Route = createFileRoute("/omrade/$slug")({
  loader: ({ params }) => {
    const area = areaBySlug(params.slug);
    if (!area) throw notFound();
    return { area };
  },
  head: ({ loaderData }) => {
    const area = loaderData?.area;
    if (!area) return { meta: [{ title: "Område — Fjällmys" }] };
    return {
      meta: [
        { title: `Stugor i ${area.name} — Fjällmys` },
        { name: "description", content: `${area.tagline}. Hitta och hyr stugor, lägenheter och fjällboenden i ${area.name}, Sälen.` },
        { property: "og:title", content: `Stugor i ${area.name} — Fjällmys` },
        { property: "og:description", content: area.description },
        { property: "og:image", content: area.image },
        { name: "twitter:image", content: area.image },
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
  const others = areas.filter((a) => a.slug !== area.slug).slice(0, 4);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={area.image} alt={`${area.name} i Sälen`} width={1920} height={900} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-24 md:px-6 md:pb-24 md:pt-40">
          <Link to="/" className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/25">
            <ArrowLeft className="h-3.5 w-3.5" /> Alla områden
          </Link>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4" /> Sälen
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

        <div className="mt-12 rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center md:p-14">
          <h3 className="font-serif text-2xl text-foreground">Stugor i {area.name}</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Vi fyller plattformen med boenden från värdar i {area.name} just nu. Är du värd i området? Lägg upp din stuga så hamnar den högst i listan vid lansering.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/hyr-ut" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Lägg upp din stuga
            </Link>
            <Link to="/sok" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Sök i hela Sälen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <h2 className="mb-6 font-serif text-2xl text-foreground md:text-3xl">Andra områden i Sälen</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <Link key={o.slug} to="/omrade/$slug" params={{ slug: o.slug }} className="group overflow-hidden rounded-xl bg-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={o.image} alt={o.name} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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