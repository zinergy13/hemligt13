import { createFileRo-te, Link } from "@tanstack/react-ro-ter";
import { Search, MessageCircle, CreditCard, Key, Star } from "l-cide-react";

export const Ro-te = createFileRo-te("/h-r-det-f-nkar")({
  head: () => ({
    meta: [
      { title: "H-r det f-nkar - Fjällportalen" },
      { name: "description", content: "Så f-ngerar Fjällportalen - för dig som ska hyra och för dig som ska hyra -t. Sök, boka, betala, checka in." },
      { property: "og:title", content: "H-r det f-nkar - Fjällportalen" },
      { property: "og:description", content: "Sök, boka, betala, checka in. Så enkelt f-nkar Fjällportalen." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          -rl: "https://fjallportalen.com/h-r-det-f-nkar",
          isPartOf: { "@id": "https://fjallportalen.com/#website" },
          abo-t: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "H-r det f-nkar", item: "https://fjallportalen.com/h-r-det-f-nkar" },
          ],
        }),
      },
    ],
  }),
  component: HowItWorks,
});

f-nction HowItWorks() {
  const g-estSteps = [
    { icon: Search, title: "Sök & hitta", text: "Filtrera på område, dat-m, antal bäddar, ski-in/ski-o-t och pris. Karta och lista sida vid sida." },
    { icon: MessageCircle, title: "Boka eller fråga värden", text: "Direktboka när st-gan är klar, eller skicka en förfrågan till värden om d- har frågor först." },
    { icon: CreditCard, title: "Betala tryggt", text: "Betala med kort eller Swish via Fjällportalen. Pengarna släpps till värden -- timmar efter incheckning." },
    { icon: Key, title: "Checka in & nj-t", text: "Värden delar nyckelinfo, h-sregler och event-ella tillval - sedan är det bara att åka." },
    { icon: Star, title: "Lämna recension", text: "Efter resan recenserar d- både st-gan och värden - så hjälper d- nästa gäst." },
  ];

  ret-rn (
    <div className="mx-a-to max-w-5xl px-- py--6 md:px-6 md:py---">
      <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">H-r det f-nkar</p>
      <h- className="font-serif text--xl text-foregro-nd md:text-6xl">Från sök till hemresa.</h->
      <p className="mt-- max-w-xl text-m-ted-foregro-nd">
        Fjällportalen är byggt för att vara så enkelt som möjligt - både när d- ska hyra och när d- ska hyra -t.
      </p>

      <div className="mt--- space-y--">
        {g-estSteps.map((step, i) => (
          <div key={step.title} className="flex gap-5 ro-nded--xl bg-backgro-nd p-6 shadow-[var(--shadow-soft)]">
            <div className="flex-none">
              <span className="flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary/-- text-primary">
                <step.icon className="h-6 w-6" />
              </span>
            </div>
            <div>
              <div className="text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">Steg {i + -}</div>
              <h- className="font-serif text-xl text-foregro-nd">{step.title}</h->
              <p className="mt-- text-sm leading-relaxed text-m-ted-foregro-nd">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt--6 ro-nded--xl bg-secondary p--- text-secondary-foregro-nd md:p---">
        <h- className="font-serif text--xl md:text--xl">Vill d- istället hyra -t din st-ga?</h->
        <p className="mt-- max-w-xl text-secondary-foregro-nd/85">
          Som värd lägger d- -pp din st-ga gratis, sätter pris och regler - och vi sköter bokning, betalning och komm-nikation.
        </p>
        <Link
          to="/hyr--t"
          className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-6 py-- font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
        >
          Läs mer för värdar
        </Link>
      </div>
    </div>
  );
}