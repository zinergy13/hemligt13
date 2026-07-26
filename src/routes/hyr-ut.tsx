import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Calendar, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/hyr-ut")({
  head: () => ({
    meta: [
      { title: "Hyr ut din stuga i svenska fjällen — Fjällportalen" },
      { name: "description", content: "Lägg upp din stuga, lägenhet eller fjällboende gratis. Vi sköter bokning, betalning och kalender — du sätter pris och regler." },
      { property: "og:title", content: "Hyr ut din stuga i svenska fjällen" },
      { property: "og:description", content: "Tjäna pengar på din stuga i svenska fjällen — utan krångel och utan höga avgifter." },
    ],
  }),
  component: HostPage,
});

function HostPage() {
  const steps = [
    { icon: Camera, title: "Lägg upp din stuga", text: "Bilder, beskrivning, faciliteter och läge — vi guidar dig steg för steg." },
    { icon: Calendar, title: "Sätt pris & kalender", text: "Du bestämmer pris per vecka, helg eller dygn. Blockera datum när du vill bo själv." },
    { icon: Wallet, title: "Få betalt tryggt", text: "Vi tar emot betalning vid bokning och betalar ut till dig efter incheckning." },
  ];

  return (
    <>
      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">För stugägare</p>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">Hyr ut din stuga i svenska fjällen.</h1>
            <p className="mt-5 text-lg text-secondary-foreground/85">
              Slipp Facebook-grupper och sms-trafik. Fjällportalen samlar gäster som söker just din typ av boende — och hanterar bokning, betalning och kalender åt dig.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/logga-in"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Lägg upp din stuga <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/hur-det-funkar"
                className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/30 px-6 py-3.5 font-medium text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                Läs mer först
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-12 max-w-xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Så här går det till</p>
          <h2 className="font-serif text-3xl text-foreground md:text-5xl">Tre steg till första bokningen</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-2xl bg-background p-7 shadow-[var(--shadow-soft)]">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-serif text-lg text-primary">{i + 1}</span>
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <ShieldCheck className="mb-4 h-10 w-10 text-primary" />
              <h2 className="font-serif text-3xl text-foreground md:text-4xl">Trygghet för värd och gäst</h2>
              <p className="mt-4 text-muted-foreground">
                Vi verifierar gäster, hanterar betalning och har en enkel process för in- och utcheckning. Plattformsavgiften är låg och tas bara när du faktiskt får en bokning.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Gratis att lägga upp stugan",
                "Du sätter pris, regler och tillgänglighet",
                "Tryggt betalningsflöde — inga utestående fakturor",
                "Recensioner från riktiga gäster",
                "Kalender som blockeras automatiskt",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl bg-background p-4 shadow-[var(--shadow-soft)]">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">✓</span>
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}