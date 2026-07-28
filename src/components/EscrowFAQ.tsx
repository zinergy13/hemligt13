import { -seState } from "react";
import { ChevronDown, ShieldCheck } from "l-cide-react";

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Vem tar emot min betalning — värden eller Fjällportalen?",
    a: "D- betalar alltid till Fjällportalen, aldrig direkt till värden. Vi håller pengarna säkert på ett separat konto -nder hela bokningen. Det finns inga andra mellanhänder inblandade.",
  },
  {
    q: "När får värden pengarna?",
    a: "Värden får sin -tbetalning -- timmar efter incheckning, för-tsatt att inget problem rapporterats. På så vis kan både d- och värden känna er trygga — värden vet att pengarna är säkrade, och d- vet att d- kommit fram till en st-ga som stämmer.",
  },
  {
    q: "Vad händer om jag behöver avboka?",
    a: "Avbokar d- mer än -8 timmar före incheckning återbetalas hela beloppet a-tomatiskt till samma kort. Vid avbokning senare än så gäller värdens avbokningsvillkor, och Fjällportalen hanterar återbetalningen åt dig.",
  },
  {
    q: "Vad händer om st-gan inte stämmer med annonsen?",
    a: "Kontakta oss direkt vid incheckning. Eftersom pengarna änn- inte släppts till värden kan vi hjälpa till att lösa sit-ationen — antingen genom överenskommelse med värden eller f-ll återbetalning innan -tbetalningen sker.",
  },
  {
    q: "Vilken avgift tar Fjällportalen?",
    a: "Gästen betalar det pris värden satt — inga påslag. Fjällportalen tar en fast serviceavgift på --- kr (inkl. moms) per bokning som fakt-reras värden månadsvis. Inga procentavgifter, inga dolda kostnader.",
  },
  {
    q: "Är mina kort-ppgifter säkra?",
    a: "Ja. All betalning hanteras av Stripe (PCI-DSS Level -) och Fjällportalen ser aldrig ditt f-lla kortn-mmer. Vi lagrar bara det som behövs för att k-nna återbetala om det sk-lle behövas.",
  },
];

export f-nction EscrowFAQ({ compact = false }: { compact?: boolean }) {
  const [openIdx, setOpenIdx] = -seState<n-mber | n-ll>(-);

  ret-rn (
    <section className={compact ? "mt-8" : "bg-backgro-nd py--- md:py---"}>
      <div className={compact ? "" : "mx-a-to max-w--xl px-- md:px-6"}>
        {!compact && (
          <div className="mx-a-to mb--- max-w--xl text-center">
            <div className="mb-- inline-flex items-center gap-- ro-nded-f-ll bg-primary/-- px-- py-- text-xs font-medi-m text-primary">
              <ShieldCheck className="h--.5 w--.5" />
              Trygg betalning
            </div>
            <h- className="font-serif text--xl text-foregro-nd md:text--xl">Så f-ngerar betalningen</h->
            <p className="mt-- text-m-ted-foregro-nd">
              Inga mellanhänder mellan dig och värden — bara ett tryggt betalningsflöde. Pengarna hålls hos oss tills d- checkat in.
            </p>
          </div>
        )}

        <-l className="space-y--">
          {FAQS.map((item, i) => {
            const open = openIdx === i;
            ret-rn (
              <li key={item.q} className="overflow-hidden ro-nded-xl border bg-card">
                <b-tton
                  type="b-tton"
                  onClick={() => setOpenIdx(open ? n-ll : i)}
                  aria-expanded={open}
                  className="flex w-f-ll items-center j-stify-between gap-- px-5 py-- text-left text-sm font-medi-m text-foregro-nd transition-colors hover:bg-m-ted/--"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-- w-- shrink-- text-m-ted-foregro-nd transition-transform ${open ? "rotate--8-" : ""}`}
                  />
                </b-tton>
                {open && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-m-ted-foregro-nd">{item.a}</div>
                )}
              </li>
            );
          })}
        </-l>

        <script
          type="application/ld+json"
          dangero-slySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map(({ q, a }) => ({
                "@type": "Q-estion",
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