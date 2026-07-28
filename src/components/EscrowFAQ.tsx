import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Vem tar emot min betalning — värden eller Fjällportalen?",
    a: "Du betalar alltid till Fjällportalen, aldrig direkt till värden. Vi håller pengarna säkert på ett separat konto under hela bokningen. Det finns inga andra mellanhänder inblandade.",
  },
  {
    q: "När får värden pengarna?",
    a: "Värden får sin utbetalning 24 timmar efter incheckning, förutsatt att inget problem rapporterats. På så vis kan både du och värden känna er trygga — värden vet att pengarna är säkrade, och du vet att du kommit fram till en stuga som stämmer.",
  },
  {
    q: "Vad händer om jag behöver avboka?",
    a: "Avbokar du mer än 48 timmar före incheckning återbetalas hela beloppet automatiskt till samma kort. Vid avbokning senare än så gäller värdens avbokningsvillkor, och Fjällportalen hanterar återbetalningen åt dig.",
  },
  {
    q: "Vad händer om stugan inte stämmer med annonsen?",
    a: "Kontakta oss direkt vid incheckning. Eftersom pengarna ännu inte släppts till värden kan vi hjälpa till att lösa situationen — antingen genom överenskommelse med värden eller full återbetalning innan utbetalningen sker.",
  },
  {
    q: "Vilken avgift tar Fjällportalen?",
    a: "Gästen betalar det pris värden satt — inga påslag. Fjällportalen tar en fast serviceavgift på 400 kr (inkl. moms) per bokning som faktureras värden månadsvis. Inga procentavgifter, inga dolda kostnader.",
  },
  {
    q: "Är mina kortuppgifter säkra?",
    a: "Ja. All betalning hanteras av Stripe (PCI-DSS Level 1) och Fjällportalen ser aldrig ditt fulla kortnummer. Vi lagrar bara det som behövs för att kunna återbetala om det skulle behövas.",
  },
];

export function EscrowFAQ({ compact = false }: { compact?: boolean }) {
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
              Inga mellanhänder mellan dig och värden — bara ett tryggt betalningsflöde. Pengarna hålls hos oss tills du checkat in.
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