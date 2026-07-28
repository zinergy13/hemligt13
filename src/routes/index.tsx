import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, Calendar, Users, ShieldCheck, Heart, KeyRound, ArrowRight, Snowflake } from "lucide-react";
import heroCabin from "../assets/hero-cabin.jpg";
import { regions } from "../data/areas";
import { SwedenMap } from "../components/SwedenMap";
import { LastMinuteSection } from "../components/LastMinuteSection";
import { EscrowFAQ } from "../components/EscrowFAQ";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fjällportalen — Hyr stuga i svenska fjällen" },
      { name: "description", content: "Sveriges samlade plats för stuguthyrning. Sök stugor och lägenheter i Sälen, Åre, Vemdalen, Idre, Funäsdalen och hela svenska fjällkedjan — direkt från värd." },
      { property: "og:title", content: "Fjällportalen — Hyr stuga i svenska fjällen" },
      { property: "og:description", content: "Från Sälen till Åre — Sveriges samlade plats där värd möter gäst, med trygg betalning och lokal förankring." },
    ],
    links: [
      { rel: "preload", as: "image", href: heroCabin, fetchpriority: "high" },
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
          alt="Mysig stuga i svenska fjällen vid solnedgång med snötäckta fjäll i bakgrunden"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
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
            Hitta din stuga<br />i svenska fjällen.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/90 md:text-lg">
            Från Sälen till Åre — Sveriges samlade plats där värd möter gäst. Trygg betalning, lokala värdar och 21 fjällområden på ett ställe.
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
                    placeholder="Åre, Sälen, Vemdalen ..."
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
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Trygg betalning via Fjällportalen</span>
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> Lokala värdar i hela fjällkedjan</span>
            <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Utbetalning efter incheckning</span>
          </div>
        </div>
      </section>

      {/* MAP + REGIONS */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Utforska Sverige</p>
            <h2 className="font-serif text-3xl text-foreground md:text-5xl">Välj region på fjällkartan</h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Från Dalafjällens familjebackar till Åres alpina branter — 21 fjällområden samlade på ett ställe.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <SwedenMap />
          <div className="grid gap-4">
            {regions.map((r) => (
              <Link
                key={r.slug}
                to="/region/$slug"
                params={{ slug: r.slug }}
                className="group relative overflow-hidden rounded-2xl shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]"
              >
                <div className="aspect-[16/7] overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.name}
                    loading="lazy"
                    width={1920}
                    height={1080}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-2xl text-white">{r.name}</h3>
                  <p className="mt-1 text-sm text-white/85">{r.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LAST-MINUTE */}
      <LastMinuteSection />

      {/* VALUE PROPS */}
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Varför Fjällportalen?</p>
            <h2 className="font-serif text-3xl text-foreground md:text-5xl">Svenska fjällen — samlat på ett ställe</h2>
            <p className="mt-4 text-muted-foreground">
              Slipp scrolla genom tio Facebook-grupper. Här hittar du alla stugor, lägenheter och fjällboenden — sökbara, kalenderkopplade och betalningsklara. Sälen, Åre, Idre, Vemdalen och allt däremellan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Hela fjällkedjan samlad", text: "Dalafjällen, Härjedalen och Jämtland — 21 fjällområden från Grövelsjön i söder till Storlien i norr." },
              { icon: ShieldCheck, title: "Tryggt betalningsflöde", text: "Betala med kort eller Swish. Fjällportalen håller pengarna och släpper dem till värden först efter incheckning." },
              { icon: Heart, title: "Lokalt och äkta", text: "Fjällets egna stugägare bakom varje annons — inga stora förmedlare, inga onödiga avgifter." },
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
      <EscrowFAQ />

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
