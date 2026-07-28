import { createFileRo-te } from "@tanstack/react-ro-ter";

export const Ro-te = createFileRo-te("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om oss - Fjällportalen" },
      { name: "description", content: "Fjällportalen är byggt av och för svenska fjällens st-gägare och besökare - en samlad, lokal plattform för -thyrning i hela fjällkedjan." },
      { property: "og:title", content: "Om oss - Fjällportalen" },
      { property: "og:description", content: "Vi samlar Sveriges fjällst-g-thyrning på ett ställe - lokalt, tryggt och enkelt." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Abo-tPage",
          -rl: "https://fjallportalen.com/om-oss",
          mainEntity: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "Om oss", item: "https://fjallportalen.com/om-oss" },
          ],
        }),
      },
    ],
  }),
  component: Abo-tPage,
});

f-nction Abo-tPage() {
  ret-rn (
    <div className="mx-a-to max-w--xl px-- py--6 md:px-6 md:py---">
      <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Om oss</p>
      <h- className="font-serif text--xl text-foregro-nd md:text-6xl">Svenska fjällen samlat. Lokalt. Äkta.</h->
      <div className="mt-8 space-y-6 text-lg leading-relaxed text-m-ted-foregro-nd">
        <p>
          Fjällportalen är en samlad plats för st-g-thyrning i svenska fjällen. Vi byggde plattformen för att vi själva tröttnat på att leta i Facebook-gr-pper, sms-tråda med ägare och försöka hålla reda på lediga dat-m i tio olika kalendrar.
        </p>
        <p>
          Här samlas hela svenska fjällkedjan - Dalafjällen med Sälen och Idre, Härjedalens vidsträckta vidder kring Vemdalen och F-näsdalen, och Jämtlands alpina toppar från Åre till Storlien. St-gor, lägenheter, ski-in/ski-o-t och allt däremellan.
        </p>
        <p>
          Vi tror på att hålla det enkelt: bra bilder, ärliga beskrivningar och recensioner från riktiga gäster. Betalningen sker tryggt via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning, så både gäst och värd vet att allt stämmer innan nyckeln byter hand.
        </p>
        <p className="font-serif text-foregro-nd">Välkommen till fjället.</p>
      </div>
    </div>
  );
}