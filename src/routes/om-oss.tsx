import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om oss — Fjällportalen" },
      { name: "description", content: "Fjällportalen är byggt av och för svenska fjällens stugägare och besökare — en samlad, lokal plattform för uthyrning i hela fjällkedjan." },
      { property: "og:title", content: "Om oss — Fjällportalen" },
      { property: "og:description", content: "Vi samlar Sveriges fjällstuguthyrning på ett ställe — lokalt, tryggt och enkelt." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Om oss</p>
      <h1 className="font-serif text-4xl text-foreground md:text-6xl">Svenska fjällen samlat. Lokalt. Äkta.</h1>
      <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          Fjällportalen är en samlad plats för stuguthyrning i svenska fjällen. Vi byggde plattformen för att vi själva tröttnat på att leta i Facebook-grupper, sms-tråda med ägare och försöka hålla reda på lediga datum i tio olika kalendrar.
        </p>
        <p>
          Här samlas hela svenska fjällkedjan — Dalafjällen med Sälen och Idre, Härjedalens vidsträckta vidder kring Vemdalen och Funäsdalen, och Jämtlands alpina toppar från Åre till Storlien. Stugor, lägenheter, ski-in/ski-out och allt däremellan.
        </p>
        <p>
          Vi tror på att hålla det enkelt: bra bilder, ärliga beskrivningar och recensioner från riktiga gäster. Betalningen sker tryggt via Fjällportalen — pengarna släpps till värden först efter incheckning, så både gäst och värd vet att allt stämmer innan nyckeln byter hand.
        </p>
        <p className="font-serif text-foreground">Välkommen till fjället.</p>
      </div>
    </div>
  );
}