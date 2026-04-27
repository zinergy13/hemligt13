import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Calendar, Users, ShieldCheck, Heart, KeyRound, ArrowRight, Snowflake } from "lucide-react";
import heroCabin from "../assets/hero-cabin.jpg";
import { areas } from "../data/areas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stuga i Sälen — Hyr stuga i Sälenfjällen direkt från värd" },
      { name: "description", content: "Sälens samlade plats för stuguthyrning. Sök ski-in/ski-out-stugor, lägenheter och fjällboenden i Lindvallen, Tandådalen, Kläppen, Stöten och hela Sälen." },
      { property: "og:title", content: "Stuga i Sälen — Hyr stuga i Sälenfjällen" },
      { property: "og:description", content: "Sök, hyr och hyr ut stugor i Sälen — direkt mellan värd och gäst." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroCabin}
          alt="Mysig stuga i Sälen vid solnedgång med snötäckta fjäll i bakgrunden"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-12 pt-24 md:px-6 md:pb-20 md:pt-40 lg:pt-48">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
            <Snowflake className="h-3.5 w-3.5" /> Säsong 2026/27 öppnar nu
          </span>
          <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] text-white md:text-6xl lg:text-7xl">
            Hitta din stuga<br />i Sälenfjällen.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/90 md:text-lg">
            Från Lindvallen till Stöten — Sälens samlade plats där värd möter gäst, direkt och utan mellanhänder.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-4xl rounded-2xl bg-background p-2 shadow-[var(--shadow-elevated)]">
            <div className="grid gap-1 md:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-muted">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Område</div>
                  <input
                    type="text"
                    placeholder="Lindvallen, Tandådalen ..."
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-muted">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Datum</div>
                  <input
                    type="text"
                    placeholder="V. 8–9"
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-muted">
                <Users className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gäster</div>
                  <input
                    type="text"
                    placeholder="2 vuxna"
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
              </label>
              <Link
                to="/sok"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Search className="h-5 w-5" />
                <span className="md:hidden lg:inline">Sök</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Trygg betalning</span>
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> Direkt från värdar i Sälen</span>
            <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Inga mellanhänder</span>
          </div>
        </div>
      </section>

      {/* AREAS */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Utforska Sälen</p>
            <h2 className="font-serif text-3xl text-foreground md:text-5xl">Områden i fjället</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Hela Sälenfjällen på ett ställe — från Lindvallens puls till Högfjällets vidsträckta vyer.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((area) => (
            <Link
              key={area.slug}
              to="/omrade/$slug"
              params={{ slug: area.slug }}
              className="group relative overflow-hidden rounded-2xl bg-muted shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-warm)]"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={area.image}
                  alt={`${area.name} i Sälen`}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-serif text-2xl text-white">{area.name}</h3>
                <p className="mt-1 text-sm text-white/80">{area.estimatedListings} stugor</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Varför Stuga i Sälen?</p>
            <h2 className="font-serif text-3xl text-foreground md:text-5xl">Sälen — samlat på ett ställe</h2>
            <p className="mt-4 text-muted-foreground">
              Slipp scrolla genom tio Facebook-grupper. Här hittar du alla stugor, lägenheter och fjällboenden i Sälen — sökbara, kalenderkopplade och betalningsklara.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Hela Sälen samlat", text: "Lindvallen, Tandådalen, Kläppen, Stöten, Hundfjället, Högfjället och alla områden där emellan." },
              { icon: ShieldCheck, title: "Tryggt och enkelt", text: "Säker betalning, tydliga villkor och recensioner från riktiga gäster — för båda parter." },
              { icon: Heart, title: "Lokalt och äkta", text: "Direkt från Sälens egna stugägare. Inga mellanhänder, inga onödiga avgifter." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-background p-7 shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOST CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 text-primary-foreground md:px-16 md:py-24"
          style={{ background: "var(--gradient-warm)" }}
        >
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary-foreground/80">För stugägare</p>
              <h2 className="font-serif text-3xl md:text-5xl">Hyr ut din stuga utan krångel.</h2>
              <p className="mt-4 max-w-md text-primary-foreground/90">
                Lägg upp din stuga gratis. Du sätter pris och regler, vi sköter bokning, betalning och kalender. När du har tid över — låt fjället jobba för dig.
              </p>
            </div>
            <div className="md:justify-self-end">
              <Link
                to="/hyr-ut"
                className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 font-medium text-foreground shadow-[var(--shadow-elevated)] transition-transform hover:scale-[1.03]"
              >
                Lägg upp din stuga
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
