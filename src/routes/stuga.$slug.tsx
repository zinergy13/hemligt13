import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Users, Bed, Bath, Home, Loader2, Check, Zap, Clock, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coverImage, AMENITY_OPTIONS, type CabinWithImages } from "@/lib/cabins";
import { areaBySlug } from "@/data/areas";
import { BookingForm } from "@/components/BookingForm";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReviewsSection } from "@/components/ReviewsSection";

export const Route = createFileRoute("/stuga/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Stuga — Fjällportalen` },
      { name: "description", content: `Stuga ${params.slug} — boka tryggt via Fjällportalen med utbetalning till värden 24 timmar efter incheckning.` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: 2, name: "Sök", item: "https://fjallportalen.com/sok" },
            { "@type": "ListItem", position: 3, name: "Stuga", item: `https://fjallportalen.com/stuga/${params.slug}` },
          ],
        }),
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl text-foreground">Stugan hittades inte</h1>
      <p className="mt-3 text-muted-foreground">Den här stugan finns inte längre, eller är inte publicerad.</p>
      <Link to="/sok" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        <ArrowLeft className="h-4 w-4" /> Sök stugor
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-foreground">Något gick fel</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: CabinPage,
});

function CabinPage() {
  const { slug } = Route.useParams();
  const [cabin, setCabin] = useState<CabinWithImages | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"sv" | "en" | "de">("sv");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!active) return;
      if (!data) {
        setLoading(false);
        throw notFound();
      }
      setCabin(data as CabinWithImages);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.host_id)
        .maybeSingle();
      if (active) {
        setHostName(profile?.full_name ?? null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cabin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground">Stugan hittades inte</h1>
        <Link to="/sok" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> Sök stugor
        </Link>
      </div>
    );
  }

  const area = areaBySlug(cabin.area_slug);
  const cover = coverImage(cabin);
  const otherImages = (cabin.cabin_images ?? [])
    .filter((i) => i.url !== cover)
    .sort((a, b) => a.sort_order - b.sort_order);

  const amenityLabel = (val: string) =>
    AMENITY_OPTIONS.find((a) => a.value === val)?.label ?? val;

  const c = cabin as CabinWithImages & {
    title_en?: string | null; title_de?: string | null;
    description_en?: string | null; description_de?: string | null;
  };
  const displayTitle =
    lang === "en" && c.title_en ? c.title_en :
    lang === "de" && c.title_de ? c.title_de :
    cabin.title;
  const displayDescription =
    lang === "en" && c.description_en ? c.description_en :
    lang === "de" && c.description_de ? c.description_de :
    cabin.description;
  const availableLangs: Array<{ code: "sv" | "en" | "de"; label: string; flag: string }> = [
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    ...(c.title_en || c.description_en ? [{ code: "en" as const, label: "English", flag: "🇬🇧" }] : []),
    ...(c.title_de || c.description_de ? [{ code: "de" as const, label: "Deutsch", flag: "🇩🇪" }] : []),
  ];

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      {area && (
        <Link
          to="/omrade/$slug"
          params={{ slug: area.slug }}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka till {area.name}
        </Link>
      )}
      {availableLangs.length > 1 && (
        <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
          <Languages className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          {availableLangs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                lang === l.code ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-1">{l.flag}</span>{l.label}
            </button>
          ))}
        </div>
      )}
      <h1 className="font-serif text-3xl text-foreground md:text-5xl">{displayTitle}</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {area?.name ?? cabin.area_slug}
          {cabin.address ? ` · ${cabin.address}` : ""}
        </p>
        <FavoriteButton cabinId={cabin.id} variant="inline" />
      </div>

      {/* Gallery */}
      <div className="mt-6 grid gap-2 md:grid-cols-4 md:grid-rows-2">
        <div className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto overflow-hidden rounded-2xl bg-muted">
          {cover ? (
            <img src={cover} alt={cabin.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Ingen bild ännu
            </div>
          )}
        </div>
        {otherImages.slice(0, 4).map((img, i) => (
          <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <div className="flex flex-wrap gap-6 border-b border-border pb-6 text-sm text-foreground">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {cabin.max_guests} gäster</span>
            <span className="flex items-center gap-2"><Home className="h-4 w-4" /> {cabin.bedrooms} sovrum</span>
            <span className="flex items-center gap-2"><Bed className="h-4 w-4" /> {cabin.beds} bäddar</span>
            <span className="flex items-center gap-2"><Bath className="h-4 w-4" /> {cabin.bathrooms} badrum</span>
          </div>

          {displayDescription && (
            <div>
              <h2 className="font-serif text-2xl text-foreground">Om stugan</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{displayDescription}</p>
            </div>
          )}

          {cabin.amenities.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-foreground">Bekvämligheter</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {cabin.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-foreground">
                    <Check className="h-4 w-4 text-primary" /> {amenityLabel(a)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hostName && (
            <div className="rounded-2xl border border-border bg-muted/30 p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Värd</div>
              <div className="mt-1 font-serif text-lg text-foreground">{hostName}</div>
            </div>
          )}
        </div>

        <aside className="md:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-background p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl text-foreground">{cabin.price_per_night.toLocaleString("sv-SE")} kr</span>
              <span className="text-sm text-muted-foreground">/ natt</span>
            </div>
            {cabin.cleaning_fee > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">+ {cabin.cleaning_fee} kr städavgift</div>
            )}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
              {cabin.instant_book ? (
                <>
                  <Zap className="h-3 w-3 text-primary" /> Direktbokning
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 text-primary" /> Kräver godkännande
                </>
              )}
            </div>
            <div className="mt-5">
              <BookingForm
                cabinId={cabin.id}
                hostId={cabin.host_id}
                cabinSlug={cabin.slug}
                areaSlug={cabin.area_slug}
                sizeSqm={cabin.size_sqm ?? null}
                pricePerNight={cabin.price_per_night}
                cleaningFee={cabin.cleaning_fee}
                maxGuests={cabin.max_guests}
                instantBook={cabin.instant_book}
                minNights={cabin.min_nights ?? null}
                checkInWeekday={cabin.check_in_weekday ?? null}
              />
            </div>
          </div>
        </aside>
      </div>

      <ReviewsSection cabinId={cabin.id} />
    </article>
  );
}