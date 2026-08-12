import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Vem tar emot min betalning - värden eller Fjällportalen?",
    a: "Du betalar via Fjällportalen och betalningen hanteras av vår betalpartner Stripe, aldrig direkt till värden. Fjällportalen styr när utbetalningen till värden görs.",
  },
  {
    q: "När får värden pengarna?",
    a: "Utbetalningen till värden schemaläggs efter din incheckning, förutsatt att inget problem rapporterats. Exakta tider och villkor bekräftas när betalflödet är i drift under vår privata beta.",
  },
  {
    q: "Vad händer om jag behöver avboka?",
    a: "Avbokar du mer än 48 timmar före incheckning återbetalas hela beloppet automatiskt till samma kort. Vid avbokning senare än så gäller värdens avbokningsvillkor, och Fjällportalen hanterar återbetalningen åt dig.",
  },
  {
    q: "Vad händer om stugan inte stämmer med annonsen?",
    a: "Kontakta oss direkt vid incheckning. Eftersom utbetalningen till värden ännu inte är gjord kan vi hjälpa till att lösa situationen - antingen genom överenskommelse med värden eller återbetalning.",
  },
  {
    q: "Vilken avgift tar Fjällportalen?",
    a: "Gästen betalar det pris värden satt plus en transparent serviceavgift på 400 kr per bokning som redovisas separat. Inga procentavgifter, inga dolda kostnader.",
  },
  {
    q: "Är mina kortuppgifter säkra?",
    a: "Ja. All betalning hanteras av Stripe (PCI-DSS Level 1) och Fjällportalen ser aldrig ditt fulla kortnummer.",
  },
];

export function PaymentFAQ({ compact = false }: { compact?: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className={compact ? "mt-8" : "bg-background py-20 md:py-24"}>
      <div className={compact ? "" : "mx-auto max-w-3xl px-4 md:px-6"}>
        {!compact && (
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trygg betalning
            </div>
            <h2 className="font-serif text-3xl text-foreground md:text-4xl">Så fungerar betalningen</h2>
            <p className="mt-3 text-muted-foreground">
              Ett tryggt betalningsflöde. Betalningen hanteras av Stripe och utbetalningen till värden schemaläggs efter din incheckning.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {FAQS.map((item, i) => {
            const open = openIdx === i;
            return (
              <li key={item.q} className="overflow-hidden rounded-xl border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
                )}
              </li>
            );
          })}
        </ul>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
}