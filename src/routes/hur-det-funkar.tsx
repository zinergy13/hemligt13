import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MessageCircle, CreditCard, Key, Star } from "lucide-react";

export const Route = createFileRoute("/hur-det-funkar")({
  head: () => ({
    meta: [
      { title: "Hur det funkar - Fjällportalen" },
      { name: "description", content: "Så fungerar Fjällportalen - för dig som ska hyra och för dig som ska hyra ut. Sök, boka, betala, checka in." },
      { property: "og:title", content: "Hur det funkar - Fjällportalen" },
      { property: "og:description", content: "Sök, boka, betala, checka in. Så enkelt funkar Fjällportalen." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: "https://fjallportalen.com/hur-det-funkar",
          isPartOf: { "@id": "https://fjallportalen.com/#website" },
          about: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: 2, name: "Hur det funkar", item: "https://fjallportalen.com/hur-det-funkar" },
          ],
        }),
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const guestSteps = [
    { icon: Search, title: "Sök & hitta", text: "Filtrera på område, datum, antal bäddar, ski-in/ski-out och pris. Karta och lista sida vid sida." },
    { icon: MessageCircle, title: "Boka eller fråga värden", text: "Direktboka när stugan är klar, eller skicka en förfrågan till värden om du har frågor först." },
    { icon: CreditCard, title: "Betala tryggt", text: "Betala med kort via Fjällportalen. Utbetalningen till värden schemaläggs efter incheckning." },
    { icon: Key, title: "Checka in & njut", text: "Värden delar nyckelinfo, husregler och eventuella tillval - sedan är det bara att åka." },
    { icon: Star, title: "Lämna recension", text: "Efter resan recenserar du både stugan och värden - så hjälper du nästa gäst." },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Hur det funkar</p>
      <h1 className="font-serif text-4xl text-foreground md:text-6xl">Från sök till hemresa.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Fjällportalen är byggt för att vara så enkelt som möjligt - både när du ska hyra och när du ska hyra ut.
      </p>

      <div className="mt-14 space-y-4">
        {guestSteps.map((step, i) => (
          <div key={step.title} className="flex gap-5 rounded-2xl bg-background p-6 shadow-[var(--shadow-soft)]">
            <div className="flex-none">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </span>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steg {i + 1}</div>
              <h2 className="font-serif text-xl text-foreground">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-secondary p-10 text-secondary-foreground md:p-14">
        <h2 className="font-serif text-2xl md:text-3xl">Vill du istället hyra ut din stuga?</h2>
        <p className="mt-3 max-w-xl text-secondary-foreground/85">
          Som värd lägger du upp din stuga gratis, sätter pris och regler - och vi sköter bokning, betalning och kommunikation.
        </p>
        <Link
          to="/hyr-ut"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Läs mer för värdar
        </Link>
      </div>
    </div>
  );
}