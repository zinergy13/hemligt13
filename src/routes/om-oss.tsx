import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om oss — Stuga i Sälen" },
      { name: "description", content: "Stuga i Sälen är byggt av och för Sälens stugägare och besökare — en samlad, lokal plattform för uthyrning i fjällen." },
      { property: "og:title", content: "Om oss — Stuga i Sälen" },
      { property: "og:description", content: "Vi samlar Sälens stuguthyrning på ett ställe — lokalt, tryggt och enkelt." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Om oss</p>
      <h1 className="font-serif text-4xl text-foreground md:text-6xl">Sälen samlat. Lokalt. Äkta.</h1>
      <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          Stuga i Sälen är en samlad plats för stuguthyrning i Sälenfjällen. Vi byggde plattformen för att vi själva tröttnat på att leta i Facebook-grupper, sms-tråda med ägare och försöka hålla reda på lediga datum i tio olika kalendrar.
        </p>
        <p>
          Här samlas hela Sälen — Lindvallen, Tandådalen, Hundfjället, Högfjället, Kläppen, Stöten, Gubbmyren och Sälfjällstorget. Stugor, lägenheter, ski-in/ski-out och allt däremellan.
        </p>
        <p>
          Vi tror på att hålla det enkelt: bra bilder, ärliga beskrivningar, tryggt betalningsflöde och recensioner från riktiga gäster. Inga onödiga avgifter, inga mellanhänder.
        </p>
        <p className="font-serif text-foreground">Välkommen till fjället.</p>
      </div>
    </div>
  );
}