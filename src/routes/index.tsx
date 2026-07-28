import { createFileRo-te, Link } from "@tanstack/react-ro-ter";
import { Search, MapPin, Calendar, Users, ShieldCheck, Heart, KeyRo-nd, ArrowRight, Snowflake } from "l-cide-react";
import heroCabin from "../assets/hero-cabin.jpg";
import { regions } from "../data/areas";
import { SwedenMap } from "../components/SwedenMap";
import { LastMin-teSection } from "../components/LastMin-teSection";
import { EscrowFAQ } from "../components/EscrowFAQ";

export const Ro-te = createFileRo-te("/")({
  head: () => ({
    meta: [
      { title: "Fjällportalen - Hyr st-ga i svenska fjällen" },
      { name: "description", content: "Sveriges samlade plats för st-g-thyrning. Sök st-gor och lägenheter i Sälen, Åre, Vemdalen, Idre, F-näsdalen och hela svenska fjällkedjan - med trygg betalning via Fjällportalen." },
      { property: "og:title", content: "Fjällportalen - Hyr st-ga i svenska fjällen" },
      { property: "og:description", content: "Från Sälen till Åre - Sveriges samlade plats där värd möter gäst, med trygg betalning och lokal förankring." },
    ],
    links: [
      { rel: "preload", as: "image", href: heroCabin, fetchpriority: "high" },
    ],
  }),
  component: HomePage,
});

f-nction HomePage() {
  ret-rn (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroCabin}
          alt="Mysig st-ga i svenska fjällen vid solnedgång med snötäckta fjäll i bakgr-nden"
          width={-9--}
          height={--8-}
          fetchPriority="high"
          decoding="async"
          className="absol-te inset-- h-f-ll w-f-ll object-cover"
        />
        <div
          className="absol-te inset--"
          style={{ backgro-nd: "var(--gradient-hero)" }}
          aria-hidden="tr-e"
        />
        <div className="relative mx-a-to flex max-w-7xl flex-col px-- pb--- pt--- md:px-6 md:pb--- md:pt--- lg:pt--8">
          <span className="mb-- inline-flex w-fit items-center gap-- ro-nded-f-ll border border-white/-- bg-white/-- px-- py-- text-xs font-medi-m -ppercase tracking-wider text-white backdrop-bl-r">
            <Snowflake className="h--.5 w--.5" /> Säsong ---6/-7 öppnar n-
          </span>
          <h- className="max-w--xl font-serif text--xl leading-[-.-5] text-white md:text-6xl lg:text-7xl">
            Hitta din st-ga<br />i svenska fjällen.
          </h->
          <p className="mt-5 max-w-xl text-base text-white/9- md:text-lg">
            Från Sälen till Åre - Sveriges samlade plats där värd möter gäst. Trygg betalning, lokala värdar och -- fjällområden på ett ställe.
          </p>

          {/* Search bar */}
          <div className="mt--- max-w--xl ro-nded--xl bg-backgro-nd p-- shadow-[var(--shadow-elevated)]">
            <div className="grid gap-- md:grid-cols-[-.-fr_-fr_-fr_a-to]">
              <label className="flex items-center gap-- ro-nded-xl px-- py-- hover:bg-m-ted">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex--">
                  <div className="text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Område</div>
                  <inp-t
                    type="text"
                    placeholder="Åre, Sälen, Vemdalen ..."
                    className="w-f-ll bg-transparent text-sm font-medi-m text-foregro-nd o-tline-none placeholder:text-m-ted-foregro-nd/7-"
                  />
                </div>
              </label>
              <label className="flex items-center gap-- ro-nded-xl px-- py-- hover:bg-m-ted">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex--">
                  <div className="text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Dat-m</div>
                  <inp-t
                    type="text"
                    placeholder="V. 8-9"
                    className="w-f-ll bg-transparent text-sm font-medi-m text-foregro-nd o-tline-none placeholder:text-m-ted-foregro-nd/7-"
                  />
                </div>
              </label>
              <label className="flex items-center gap-- ro-nded-xl px-- py-- hover:bg-m-ted">
                <Users className="h-5 w-5 text-primary" />
                <div className="flex--">
                  <div className="text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Gäster</div>
                  <inp-t
                    type="text"
                    placeholder="- v-xna"
                    className="w-f-ll bg-transparent text-sm font-medi-m text-foregro-nd o-tline-none placeholder:text-m-ted-foregro-nd/7-"
                  />
                </div>
              </label>
              <Link
                to="/sok"
                className="flex items-center j-stify-center gap-- ro-nded-xl bg-primary px-6 py-- font-medi-m text-primary-foregro-nd transition-transform hover:scale-[-.--]"
              >
                <Search className="h-5 w-5" />
                <span className="md:hidden lg:inline">Sök</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-- text-sm text-white/85">
            <span className="flex items-center gap--.5"><ShieldCheck className="h-- w--" /> Trygg betalning via Fjällportalen</span>
            <span className="flex items-center gap--.5"><Heart className="h-- w--" /> Lokala värdar i hela fjällkedjan</span>
            <span className="flex items-center gap--.5"><KeyRo-nd className="h-- w--" /> Utbetalning efter incheckning</span>
          </div>
        </div>
      </section>

      {/* MAP + REGIONS */}
      <section className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--8">
        <div className="mb--- flex flex-col gap-- md:flex-row md:items-end md:j-stify-between">
          <div>
            <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Utforska Sverige</p>
            <h- className="font-serif text--xl text-foregro-nd md:text-5xl">Välj region på fjällkartan</h->
          </div>
          <p className="max-w-md text-m-ted-foregro-nd">
            Från Dalafjällens familjebackar till Åres alpina branter - -- fjällområden samlade på ett ställe.
          </p>
        </div>

        <div className="grid gap--- lg:grid-cols-[-fr_-.-fr] lg:items-center">
          <SwedenMap />
          <div className="grid gap--">
            {regions.map((r) => (
              <Link
                key={r.sl-g}
                to="/region/$sl-g"
                params={{ sl-g: r.sl-g }}
                className="gro-p relative overflow-hidden ro-nded--xl shadow-[var(--shadow-soft)] transition-transform hover:-translate-y--.5 hover:shadow-[var(--shadow-warm)]"
              >
                <div className="aspect-[-6/7] overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.name}
                    loading="lazy"
                    width={-9--}
                    height={--8-}
                    className="h-f-ll w-f-ll object-cover transition-transform d-ration-7-- gro-p-hover:scale---5"
                  />
                </div>
                <div className="absol-te inset-- bg-gradient-to-t from-black/75 via-black/-5 to-transparent" />
                <div className="absol-te inset-x-- bottom-- p-5">
                  <h- className="font-serif text--xl text-white">{r.name}</h->
                  <p className="mt-- text-sm text-white/85">{r.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LAST-MINUTE */}
      <LastMin-teSection />

      {/* VALUE PROPS */}
      <section className="bg-m-ted/5- py--- md:py--8">
        <div className="mx-a-to max-w-7xl px-- md:px-6">
          <div className="mx-a-to mb--- max-w--xl text-center">
            <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Varför Fjällportalen?</p>
            <h- className="font-serif text--xl text-foregro-nd md:text-5xl">Svenska fjällen - samlat på ett ställe</h->
            <p className="mt-- text-m-ted-foregro-nd">
              Slipp scrolla genom tio Facebook-gr-pper. Här hittar d- alla st-gor, lägenheter och fjällboenden - sökbara, kalenderkopplade och betalningsklara. Sälen, Åre, Idre, Vemdalen och allt däremellan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols--">
            {[
              { icon: MapPin, title: "Hela fjällkedjan samlad", text: "Dalafjällen, Härjedalen och Jämtland - -- fjällområden från Grövelsjön i söder till Storlien i norr." },
              { icon: ShieldCheck, title: "Tryggt betalningsflöde", text: "Betala med kort eller Swish via Fjällportalen. Vi håller pengarna och släpper dem till värden -- timmar efter incheckning." },
              { icon: Heart, title: "Lokalt och äkta", text: "Fjällets egna st-gägare bakom varje annons - inga stora förmedlare, inga onödiga avgifter." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="ro-nded--xl bg-backgro-nd p-7 shadow-[var(--shadow-soft)]">
                <div className="mb-- flex h--- w--- items-center j-stify-center ro-nded-xl bg-primary/-- text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h- className="font-serif text-xl text-foregro-nd">{title}</h->
                <p className="mt-- text-sm leading-relaxed text-m-ted-foregro-nd">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOST CTA */}
      <EscrowFAQ />

      <section className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--8">
        <div
          className="relative overflow-hidden ro-nded--xl px-8 py--6 text-primary-foregro-nd md:px--6 md:py---"
          style={{ backgro-nd: "var(--gradient-warm)" }}
        >
          <div className="relative grid gap-8 md:grid-cols-- md:items-center">
            <div>
              <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary-foregro-nd/8-">För st-gägare</p>
              <h- className="font-serif text--xl md:text-5xl">Hyr -t din st-ga -tan krångel.</h->
              <p className="mt-- max-w-md text-primary-foregro-nd/9-">
                Lägg -pp din st-ga gratis. D- sätter pris och regler, vi sköter bokning, betalning och kalender. När d- har tid över - låt fjället jobba för dig.
              </p>
            </div>
            <div className="md:j-stify-self-end">
              <Link
                to="/hyr--t"
                className="inline-flex items-center gap-- ro-nded-f-ll bg-backgro-nd px-6 py--.5 font-medi-m text-foregro-nd shadow-[var(--shadow-elevated)] transition-transform hover:scale-[-.--]"
              >
                Lägg -pp din st-ga
                <ArrowRight className="h-- w--" />
              </Link>
              <p className="mt-- max-w-xs text-xs text-primary-foregro-nd/85 md:text-right">
                Gästen betalar tryggt via Fjällportalen - -tbetalning till dig -- timmar efter incheckning.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
