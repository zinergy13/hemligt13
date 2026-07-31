import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Globe, ImageOff } from "lucide-react";
import { CabinCard } from "@/components/CabinCard";
import { coverImage } from "@/lib/cabins";
import type { CabinWithImages } from "@/lib/cabins";
import { listPublicCabins, type PublicCabinsResult } from "@/lib/public-cabins.functions";

export const Route = createFileRoute("/stugor")({
  loader: () => listPublicCabins(),
  head: () => ({
    meta: [
      { title: "Alla annonserade stugor i fjällen | Fjällportalen" },
      {
        name: "description",
        content:
          "Upptäck alla publicerade fjällstugor på Fjällportalen. Öppet för alla - ingen inloggning krävs, trygg betalning via oss.",
      },
      { property: "og:title", content: "Alla annonserade stugor i fjällen" },
      {
        property: "og:description",
        content: "Bläddra bland publicerade fjällstugor utan inloggning. Trygg betalning via Fjällportalen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <ErrorPanel
      title="Kunde inte hämta stugorna"
      message={error.message}
      hint="Ladda om sidan. Kvarstår felet är det ett serverfel hos oss."
    />
  ),
  notFoundComponent: () => (
    <ErrorPanel
      title="Inga stugor hittades"
      message="Sidan kunde inte hitta några annonser."
      hint="Prova sökningen i stället."
    />
  ),
  component: PublicCabinsPage,
});

function ErrorPanel({ title, message, hint }: { title: string; message: string; hint: string }) {
  return (
    <div
      role="alert"
      className="mx-auto my-10 max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h2 className="font-serif text-xl text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-foreground/80">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function PublicCabinsPage() {
  const { cabins, error, checkedAt } = Route.useLoaderData() as PublicCabinsResult;
  const missingImages = cabins.filter((c: CabinWithImages) => !coverImage(c));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
        <Globe className="h-4 w-4" /> Öppet för alla
      </p>
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Alla annonserade stugor</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Den här sidan hämtas som en utloggad besökare, utan inloggning eller session. Ser du stugorna här
        ser alla dem - och om något saknas visas orsaken tydligt nedan.
      </p>

      {error && (
        <div className="mt-6">
          <ErrorPanel
            title="Stugorna kunde inte läsas publikt"
            message={`${error.message} (kod ${error.code})`}
            hint={error.hint}
          />
        </div>
      )}

      {!error && cabins.length === 0 && (
        <div className="mt-6">
          <ErrorPanel
            title="Inga publicerade stugor just nu"
            message="Databasen svarade utan fel, men inga annonser har status publicerad."
            hint="Är du värd? Publicera din annons i värdpanelen så syns den här direkt."
          />
        </div>
      )}

      {!error && missingImages.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            {missingImages.length} av {cabins.length} annonser saknar publik bild. De visas ändå, men med en
            tom bildruta.
          </p>
        </div>
      )}

      {cabins.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cabins.map((c: CabinWithImages) => (
            <CabinCard key={c.id} cabin={c} />
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Kontrollerad {new Date(checkedAt).toLocaleString("sv-SE")}.{" "}
        <Link to="/sok" className="text-primary hover:underline">
          Sök med karta och filter
        </Link>
      </p>
    </div>
  );
}