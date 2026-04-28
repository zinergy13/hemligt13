import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, SlidersHorizontal, MapPin } from "lucide-react";
import { areas } from "../data/areas";

export const Route = createFileRoute("/sok")({
  head: () => ({
    meta: [
      { title: "Sök stuga i Sälen — Fjällmys" },
      { name: "description", content: "Sök bland stugor, lägenheter och ski-in/ski-out-boenden i hela Sälenfjällen. Filtrera på område, datum, antal bäddar och pris." },
      { property: "og:title", content: "Sök stuga i Sälen" },
      { property: "og:description", content: "Hitta din stuga i Sälen — sökbart, kalenderkopplat, redo att boka." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Sök i Sälen</p>
        <h1 className="font-serif text-3xl text-foreground md:text-5xl">Hitta din nästa fjällvistelse</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Sökfunktionen kommer snart. Tills dess — bläddra bland områdena nedan eller prenumerera så hör vi av oss när vi släpper sökresultaten.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <SlidersHorizontal className="h-4 w-4" /> Filter
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <Map className="h-4 w-4" /> Visa karta
        </button>
      </div>

      <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">Snart kan du söka här</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Just nu fyller vi plattformen med stugor från värdar i Sälen. Är du värd? Lägg upp din stuga redan nu så syns den från lansering.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/hyr-ut" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Lägg upp din stuga
          </Link>
          <Link to="/" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
            Tillbaka hem
          </Link>
        </div>
      </div>

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
                <p className="text-xs text-muted-foreground">{area.estimatedListings} stugor</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}