import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SlidersHorizontal, MapPin, Loader2, Search } from "lucide-react";
import { areas, areasSorted, regions, type RegionSlug } from "@/data/areas";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import { SwedenMap } from "@/components/SwedenMap";
import type { CabinWithImages } from "@/lib/cabins";

type SearchParams = {
  region?: string;
  omrade?: string;
  gaster?: number;
  prismax?: number;
};

export const Route = createFileRoute("/sok")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    region: typeof search.region === "string" ? search.region : undefined,
    omrade: typeof search.omrade === "string" ? search.omrade : undefined,
    gaster: search.gaster ? Number(search.gaster) || undefined : undefined,
    prismax: search.prismax ? Number(search.prismax) || undefined : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sök stuga i svenska fjällen - Fjällportalen" },
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

  const activeRegion = search.region && regions.some((r) => r.slug === search.region)
    ? (search.region as RegionSlug)
    : undefined;

  // Restore last region/area from localStorage when URL has no filters set.
  useEffect(() => {
    if (search.region || search.omrade) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("fp:lastRegion");
      if (!raw) return;
      const saved = JSON.parse(raw) as { region?: string; omrade?: string };
      const regionOk = saved.region && regions.some((r) => r.slug === saved.region);
      const areaOk =
        saved.omrade &&
        areas.some((a) => a.slug === saved.omrade && (!regionOk || a.region === saved.region));
      if (regionOk || areaOk) {
        navigate({
          to: "/sok",
          replace: true,
          search: (prev: SearchParams) => ({
            ...prev,
            region: regionOk ? saved.region : prev.region,
            omrade: areaOk ? saved.omrade : prev.omrade,
          }),
        });
      }
    } catch {
      // ignore malformed storage
    }
    // Only on mount - subsequent edits should not re-hydrate from storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current region/area choice (or clear when the user resets).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (search.region || search.omrade) {
        window.localStorage.setItem(
          "fp:lastRegion",
          JSON.stringify({ region: search.region, omrade: search.omrade }),
        );
      } else {
        window.localStorage.removeItem("fp:lastRegion");
      }
    } catch {
      // storage may be unavailable (private mode / quota)
    }
  }, [search.region, search.omrade]);

  const areasInRegion = activeRegion ? areas.filter((a) => a.region === activeRegion) : areasSorted;
  const selectedArea = search.omrade ? areas.find((a) => a.slug === search.omrade) : undefined;
  // If area no longer belongs to region, clear it on next render.
  const areaMismatch = !!(activeRegion && selectedArea && selectedArea.region !== activeRegion);

  useEffect(() => {
    if (areaMismatch) {
      navigate({ to: "/sok", search: (prev: SearchParams) => ({ ...prev, omrade: undefined }) });
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      let query = supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (search.omrade) query = query.eq("area_slug", search.omrade);
      else if (activeRegion) {
        const slugs = areas.filter((a) => a.region === activeRegion).map((a) => a.slug);
        query = query.in("area_slug", slugs);
      }
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
  }, [search.omrade, search.gaster, search.prismax, activeRegion, areaMismatch]);

  const updateSearch = (patch: Partial<SearchParams>) =>
    navigate({ to: "/sok", search: (prev: SearchParams) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Sök i svenska fjällen</p>
        <h1 className="font-serif text-3xl text-foreground md:text-5xl">Hitta din nästa fjällvistelse</h1>
      </div>

      {/* Selected region/area status - only visible when a filter is active */}
      {(activeRegion || search.omrade) && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 sm:px-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-primary">Vald region</p>
              <p className="truncate font-serif text-base text-foreground sm:text-lg">
                {activeRegion
                  ? regions.find((r) => r.slug === activeRegion)?.name
                  : "Alla regioner"}
                {search.omrade && (
                  <>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-foreground">
                      {areas.find((a) => a.slug === search.omrade)?.name}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSearch({ region: undefined, omrade: undefined })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10"
            aria-label="Rensa valt region- och områdesfilter"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Rensa val</span>
            <span className="sm:hidden">Rensa</span>
          </button>
        </div>
      )}

      {/* Map picker + area chips */}
      <div className="mb-8 grid gap-8 rounded-3xl border border-border bg-background p-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start md:p-8">
        <div>
          <SwedenMap
            selectedSlug={activeRegion ?? null}
            onSelect={(slug) =>
              updateSearch({
                region: activeRegion === slug ? undefined : slug,
                omrade: undefined,
              })
            }
            helperText={
              activeRegion
                ? "Tryck på regionen igen för att rensa"
                : "Tryck på en region för att filtrera"
            }
          />
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-lg text-foreground">
              {activeRegion
                ? regions.find((r) => r.slug === activeRegion)?.name
                : "Alla områden"}
            </h2>
            {(activeRegion || search.omrade) && (
              <button
                type="button"
                onClick={() => updateSearch({ region: undefined, omrade: undefined })}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Visa alla
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {areasInRegion.map((a) => {
              const selected = search.omrade === a.slug;
              return (
                <button
                  key={a.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    updateSearch({
                      omrade: selected ? undefined : a.slug,
                      region: search.region ?? a.region,
                    })
                  }
                  className={
                    selected
                      ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-sm"
                      : "rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/10"
                  }
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-background p-4 md:grid-cols-[1fr_1fr_auto_auto_auto]">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Region</label>
          <select
            value={search.region ?? ""}
            onChange={(e) => updateSearch({ region: e.target.value || undefined, omrade: undefined })}
            className="w-full bg-transparent py-1 text-sm text-foreground outline-none"
          >
            <option value="">Alla regioner</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Område</label>
          <select
            value={search.omrade ?? ""}
            onChange={(e) => updateSearch({ omrade: e.target.value || undefined })}
            className="w-full bg-transparent py-1 text-sm text-foreground outline-none"
          >
            <option value="">Alla områden</option>
            {activeRegion
              ? areasInRegion.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.name}</option>
                ))
              : regions.map((r) => (
                  <optgroup key={r.slug} label={r.name}>
                    {areas.filter((a) => a.region === r.slug).map((a) => (
                      <option key={a.slug} value={a.slug}>{a.name}</option>
                    ))}
                  </optgroup>
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
            Alla bokningar hos Fjällportalen är trygga - vi håller betalningen och släpper den till värden 24 timmar efter incheckning.
          </p>
        </div>
      )}

      {/* Areas browse */}
      <div className="mt-16">
        <h2 className="mb-6 font-serif text-2xl text-foreground">
          {activeRegion
            ? `Områden i ${regions.find((r) => r.slug === activeRegion)?.name}`
            : "Eller bläddra per område"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areasInRegion.map((area) => (
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