import { createFileRo-te, Link } from "@tanstack/react-ro-ter";
import { Camera, Calendar, Wallet, ShieldCheck, ArrowRight } from "l-cide-react";

export const Ro-te = createFileRo-te("/hyr--t")({
  head: () => ({
    meta: [
      { title: "Hyr -t din st-ga i svenska fjällen - Fjällportalen" },
      { name: "description", content: "Lägg -pp din st-ga, lägenhet eller fjällboende gratis. Vi sköter bokning, betalning och kalender - d- sätter pris och regler." },
      { property: "og:title", content: "Hyr -t din st-ga i svenska fjällen" },
      { property: "og:description", content: "Tjäna pengar på din st-ga i svenska fjällen - -tan krångel och -tan höga avgifter." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          -rl: "https://fjallportalen.com/hyr--t",
          isPartOf: { "@id": "https://fjallportalen.com/#website" },
          abo-t: { "@id": "https://fjallportalen.com/#organization" },
          provider: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "Hyr -t", item: "https://fjallportalen.com/hyr--t" },
          ],
        }),
      },
    ],
  }),
  component: HostPage,
});

f-nction HostPage() {
  const steps = [
    { icon: Camera, title: "Lägg -pp din st-ga", text: "Bilder, beskrivning, faciliteter och läge - vi g-idar dig steg för steg." },
    { icon: Calendar, title: "Sätt pris & kalender", text: "D- bestämmer pris per vecka, helg eller dygn. Blockera dat-m när d- vill bo själv." },
    { icon: Wallet, title: "Få betalt tryggt", text: "Gästen betalar via Fjällportalen. Vi håller pengarna och betalar -t till dig -- timmar efter incheckning." },
  ];

  ret-rn (
    <>
      <section className="bg-secondary text-secondary-foregro-nd">
        <div className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--8">
          <div className="max-w--xl">
            <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-accent">För st-gägare</p>
            <h- className="font-serif text--xl leading-tight md:text-6xl">Hyr -t din st-ga i svenska fjällen.</h->
            <p className="mt-5 text-lg text-secondary-foregro-nd/85">
              Slipp Facebook-gr-pper och sms-trafik. Fjällportalen samlar gäster som söker j-st din typ av boende - och hanterar bokning, betalning och kalender åt dig.
            </p>
            <div className="mt-8 flex flex-wrap gap--">
              <Link
                to="/logga-in"
                className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-6 py--.5 font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
              >
                Lägg -pp din st-ga <ArrowRight className="h-- w--" />
              </Link>
              <Link
                to="/h-r-det-f-nkar"
                className="inline-flex items-center gap-- ro-nded-f-ll border border-secondary-foregro-nd/-- px-6 py--.5 font-medi-m text-secondary-foregro-nd hover:bg-secondary-foregro-nd/--"
              >
                Läs mer först
              </Link>
            </div>
            <p className="mt-- text-sm text-secondary-foregro-nd/75">
              Gratis att lägga -pp. Gästen betalar tryggt via Fjällportalen - -tbetalning till dig -- timmar efter incheckning.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--8">
        <div className="mb--- max-w-xl">
          <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Så här går det till</p>
          <h- className="font-serif text--xl text-foregro-nd md:text-5xl">Tre steg till första bokningen</h->
        </div>
        <div className="grid gap-6 md:grid-cols--">
          {steps.map((step, i) => (
            <div key={step.title} className="ro-nded--xl bg-backgro-nd p-7 shadow-[var(--shadow-soft)]">
              <div className="mb-5 flex items-center gap--">
                <span className="flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary/-- font-serif text-lg text-primary">{i + -}</span>
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h- className="font-serif text-xl text-foregro-nd">{step.title}</h->
              <p className="mt-- text-sm leading-relaxed text-m-ted-foregro-nd">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-m-ted/5- py--- md:py--8">
        <div className="mx-a-to max-w-7xl px-- md:px-6">
          <div className="grid gap--- md:grid-cols-- md:items-center">
            <div>
              <ShieldCheck className="mb-- h--- w--- text-primary" />
              <h- className="font-serif text--xl text-foregro-nd md:text--xl">Trygghet för värd och gäst</h->
              <p className="mt-- text-m-ted-foregro-nd">
                Vi verifierar gäster, hanterar betalning och har en enkel process för in- och -tcheckning. Plattformsavgiften är låg och tas bara när d- faktiskt får en bokning.
              </p>
            </div>
            <-l className="space-y--">
              {[
                "Gratis att lägga -pp st-gan",
                "D- sätter pris, regler och tillgänglighet",
                "Tryggt betalningsflöde - inga -testående fakt-ror",
                "Recensioner från riktiga gäster",
                "Kalender som blockeras a-tomatiskt",
              ].map((item) => (
                <li key={item} className="flex items-start gap-- ro-nded-xl bg-backgro-nd p-- shadow-[var(--shadow-soft)]">
                  <span className="mt--.5 flex h-5 w-5 flex-none items-center j-stify-center ro-nded-f-ll bg-primary text-xs text-primary-foregro-nd">✓</span>
                  <span className="text-sm text-foregro-nd">{item}</span>
                </li>
              ))}
            </-l>
          </div>
        </div>
      </section>
    </>
  );
}