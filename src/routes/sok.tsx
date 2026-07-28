import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SlidersHorizontal, MapPin, Loader2, Search } from "lucide-react";
import { areas } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

type SearchParams = {
  omrade?: string;
  gaster?: number;
  prismax?: number;
};

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    omrade: typeof search.omrade === "string" ? search.omrade : undefined,
    gaster: search.gaster ? Number(search.gaster) || undefined : undefined,
    prismax: search.prismax ? Number(search.prismax) || undefined : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sök stuga i svenska fjällen — Fjällportalen" },
      { name: "description", content: "Sök bland stugor, lägenheter och ski-in/ski-out-boenden i hela svenska fjällen." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: 2, name: "Sök", item: "https://fjallportalen.com/sok" },
          ],
        }),
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [cabins, setCabins] = useState<CabinWithImages[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (search.omrade) query = query.eq("area_slug", search.omrade);
      if (search.gaster) query = query.gte("max_guests", search.gaster);
      if (search.prismax) query = query.lte("price_per_night", search.prismax);

      const { data } = await query;
      if (active) {
        setCabins((data as CabinWithImages[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search.omrade, search.gaster, search.prismax]);

  const updateSearch = (patch: Partial<SearchParams>) =>
    navigate({ to: "/sok", search: (prev: SearchParams) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Sök i svenska fjällen</p>
        <h1 className="font-serif text-3xl text-foreground md:text-5xl">Hitta din nästa fjällvistelse</h1>
      </div>

      {/* Filter bar */}
      <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-background p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Område</label>
          <select
            value={search.omrade ?? ""}
            onChange={(e) => updateSearch({ omrade: e.target.value || undefined })}
            className="w-full bg-transparent py-1 text-sm text-foreground outline-none"
          >
            <option value="">Alla områden</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Min. gäster</label>
          <input
            type="number"
            min={1}
            value={search.gaster ?? ""}
            onChange={(e) => updateSearch({ gaster: e.target.value ? Number(e.target.value) : undefined })}
            className="w-24 bg-transparent py-1 text-sm text-foreground outline-none"
            placeholder="2"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Max pris/natt</label>
          <input
            type="number"
            min={0}
            step={500}
            value={search.prismax ?? ""}
            onChange={(e) => updateSearch({ prismax: e.target.value ? Number(e.target.value) : undefined })}
            className="w-28 bg-transparent py-1 text-sm text-foreground outline-none"
            placeholder="5000"
          />
        </div>
        <button
          onClick={() => navigate({ to: "/sok", search: {} })}
          className="self-end rounded-full border border-border px-4 py-2 text-xs text-foreground hover:bg-muted"
        >
          Rensa
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cabins && cabins.length > 0 ? (
        <>
          <p className="mb-5 text-sm text-muted-foreground">
            {cabins.length} {cabins.length === 1 ? "stuga" : "stugor"} hittades
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cabins.map((cabin) => <CabinCard key={cabin.id} cabin={cabin} />)}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">Inga stugor här ännu</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Just nu fyller vi plattformen med stugor från värdar i svenska fjällen. Är du värd? Lägg upp din stuga redan nu så syns den från lansering.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/hyr-ut" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Lägg upp din stuga
            </Link>
            <button onClick={() => navigate({ to: "/sok", search: {} })} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              <Search className="h-4 w-4" /> Rensa filter
            </button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
            Alla bokningar hos Fjällportalen är trygga — vi håller betalningen och släpper den till värden 24 timmar efter incheckning.
          </p>
        </div>
      )}

      {/* Areas browse */}
      <div className="mt-16">
        <h2 className="mb-6 font-serif text-2xl text-foreground">Eller bläddra per område</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area) => (
            <Link
              key={area.slug}
              to="/omrade/$slug"
              params={{ slug: area.slug }}
              className="group overflow-hidden rounded-xl bg-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={area.image} alt={area.name} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg text-foreground">{area.name}</h3>
                <p className="text-xs text-muted-foreground">{area.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Suppress unused import warning for SlidersHorizontal removal
void SlidersHorizontal;