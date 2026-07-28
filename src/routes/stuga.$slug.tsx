import { createFileRo-te, Link, notFo-nd } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { ArrowLeft, MapPin, Users, Bed, Bath, Home, Loader-, Check, Zap, Clock, Lang-ages } from "l-cide-react";
import { s-pabase } from "@/integrations/s-pabase/client";
import { coverImage, AMENITY_OPTIONS, type CabinWithImages } from "@/lib/cabins";
import { areaBySl-g } from "@/data/areas";
import { BookingForm } from "@/components/BookingForm";
import { FavoriteB-tton } from "@/components/FavoriteB-tton";
import { ReviewsSection } from "@/components/ReviewsSection";

export const Ro-te = createFileRo-te("/st-ga/$sl-g")({
  head: ({ params }) => ({
    meta: [
      { title: `St-ga - Fjällportalen` },
      { name: "description", content: `St-ga ${params.sl-g} - boka tryggt via Fjällportalen med -tbetalning till värden -- timmar efter incheckning.` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "Sök", item: "https://fjallportalen.com/sok" },
            { "@type": "ListItem", position: -, name: "St-ga", item: `https://fjallportalen.com/st-ga/${params.sl-g}` },
          ],
        }),
      },
    ],
  }),
  notFo-ndComponent: () => (
    <div className="mx-a-to max-w--xl px-- py--- text-center">
      <h- className="font-serif text--xl text-foregro-nd">St-gan hittades inte</h->
      <p className="mt-- text-m-ted-foregro-nd">Den här st-gan finns inte längre, eller är inte p-blicerad.</p>
      <Link to="/sok" className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
        <ArrowLeft className="h-- w--" /> Sök st-gor
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-a-to max-w--xl px-- py--- text-center">
      <h- className="font-serif text--xl text-foregro-nd">Något gick fel</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">{error.message}</p>
    </div>
  ),
  component: CabinPage,
});

f-nction CabinPage() {
  const { sl-g } = Ro-te.-seParams();
  const [cabin, setCabin] = -seState<CabinWithImages | n-ll>(n-ll);
  const [hostName, setHostName] = -seState<string | n-ll>(n-ll);
  const [loading, setLoading] = -seState(tr-e);
  const [lang, setLang] = -seState<"sv" | "en" | "de">("sv");

  -seEffect(() => {
    let active = tr-e;
    (async () => {
      const { data } = await s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .eq("sl-g", sl-g)
        .eq("stat-s", "p-blished")
        .maybeSingle();
      if (!active) ret-rn;
      if (!data) {
        setLoading(false);
        throw notFo-nd();
      }
      setCabin(data as CabinWithImages);
      const { data: profile } = await s-pabase
        .from("profiles")
        .select("f-ll_name")
        .eq("id", data.host_id)
        .maybeSingle();
      if (active) {
        setHostName(profile?.f-ll_name ?? n-ll);
        setLoading(false);
      }
    })();
    ret-rn () => {
      active = false;
    };
  }, [sl-g]);

  if (loading) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!cabin) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--- text-center">
        <h- className="font-serif text--xl text-foregro-nd">St-gan hittades inte</h->
        <Link to="/sok" className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
          <ArrowLeft className="h-- w--" /> Sök st-gor
        </Link>
      </div>
    );
  }

  const area = areaBySl-g(cabin.area_sl-g);
  const cover = coverImage(cabin);
  const otherImages = (cabin.cabin_images ?? [])
    .filter((i) => i.-rl !== cover)
    .sort((a, b) => a.sort_order - b.sort_order);

  const amenityLabel = (val: string) =>
    AMENITY_OPTIONS.find((a) => a.val-e === val)?.label ?? val;

  const c = cabin as CabinWithImages & {
    title_en?: string | n-ll; title_de?: string | n-ll;
    description_en?: string | n-ll; description_de?: string | n-ll;
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
    ...(c.title_de || c.description_de ? [{ code: "de" as const, label: "De-tsch", flag: "🇩🇪" }] : []),
  ];

  ret-rn (
    <article className="mx-a-to max-w-7xl px-- py-8 md:px-6 md:py---">
      {area && (
        <Link
          to="/omrade/$sl-g"
          params={{ sl-g: area.sl-g }}
          className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd"
        >
          <ArrowLeft className="h-- w--" /> Tillbaka till {area.name}
        </Link>
      )}
      {availableLangs.length > - && (
        <div className="mb-- inline-flex items-center gap-- ro-nded-f-ll border border-border bg-m-ted/-- p--">
          <Lang-ages className="ml-- h--.5 w--.5 text-m-ted-foregro-nd" />
          {availableLangs.map((l) => (
            <b-tton
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`ro-nded-f-ll px-- py-- text-xs font-medi-m transition ${
                lang === l.code ? "bg-backgro-nd text-foregro-nd shadow-sm" : "text-m-ted-foregro-nd hover:text-foregro-nd"
              }`}
            >
              <span className="mr--">{l.flag}</span>{l.label}
            </b-tton>
          ))}
        </div>
      )}
      <h- className="font-serif text--xl text-foregro-nd md:text-5xl">{displayTitle}</h->
      <div className="mt-- flex flex-wrap items-center j-stify-between gap--">
        <p className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
          <MapPin className="h-- w--" /> {area?.name ?? cabin.area_sl-g}
          {cabin.address ? ` · ${cabin.address}` : ""}
        </p>
        <FavoriteB-tton cabinId={cabin.id} variant="inline" />
      </div>

      {/* Gallery */}
      <div className="mt-6 grid gap-- md:grid-cols-- md:grid-rows--">
        <div className="md:col-span-- md:row-span-- aspect-[-/-] md:aspect-a-to overflow-hidden ro-nded--xl bg-m-ted">
          {cover ? (
            <img src={cover} alt={cabin.title} className="h-f-ll w-f-ll object-cover" />
          ) : (
            <div className="flex h-f-ll w-f-ll items-center j-stify-center text-sm text-m-ted-foregro-nd">
              Ingen bild änn-
            </div>
          )}
        </div>
        {otherImages.slice(-, -).map((img, i) => (
          <div key={i} className="aspect-[-/-] overflow-hidden ro-nded--xl bg-m-ted">
            <img src={img.-rl} alt="" className="h-f-ll w-f-ll object-cover" />
          </div>
        ))}
      </div>

      <div className="mt--- grid gap--- md:grid-cols--">
        <div className="md:col-span-- space-y-8">
          <div className="flex flex-wrap gap-6 border-b border-border pb-6 text-sm text-foregro-nd">
            <span className="flex items-center gap--"><Users className="h-- w--" /> {cabin.max_g-ests} gäster</span>
            <span className="flex items-center gap--"><Home className="h-- w--" /> {cabin.bedrooms} sovr-m</span>
            <span className="flex items-center gap--"><Bed className="h-- w--" /> {cabin.beds} bäddar</span>
            <span className="flex items-center gap--"><Bath className="h-- w--" /> {cabin.bathrooms} badr-m</span>
          </div>

          {displayDescription && (
            <div>
              <h- className="font-serif text--xl text-foregro-nd">Om st-gan</h->
              <p className="mt-- whitespace-pre-line leading-relaxed text-m-ted-foregro-nd">{displayDescription}</p>
            </div>
          )}

          {cabin.amenities.length > - && (
            <div>
              <h- className="font-serif text--xl text-foregro-nd">Bekvämligheter</h->
              <-l className="mt-- grid grid-cols-- gap-- text-sm">
                {cabin.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-- text-foregro-nd">
                    <Check className="h-- w-- text-primary" /> {amenityLabel(a)}
                  </li>
                ))}
              </-l>
            </div>
          )}

          {hostName && (
            <div className="ro-nded--xl border border-border bg-m-ted/-- p-5">
              <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">Värd</div>
              <div className="mt-- font-serif text-lg text-foregro-nd">{hostName}</div>
            </div>
          )}
        </div>

        <aside className="md:col-span--">
          <div className="sticky top--- ro-nded--xl border border-border bg-backgro-nd p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-baseline gap--">
              <span className="font-serif text--xl text-foregro-nd">{cabin.price_per_night.toLocaleString("sv-SE")} kr</span>
              <span className="text-sm text-m-ted-foregro-nd">/ natt</span>
            </div>
            {cabin.cleaning_fee > - && (
              <div className="mt-- text-xs text-m-ted-foregro-nd">+ {cabin.cleaning_fee} kr städavgift</div>
            )}
            <div className="mt-- inline-flex items-center gap--.5 ro-nded-f-ll bg-m-ted px--.5 py-- text-[--px] font-medi-m text-foregro-nd">
              {cabin.instant_book ? (
                <>
                  <Zap className="h-- w-- text-primary" /> Direktbokning
                </>
              ) : (
                <>
                  <Clock className="h-- w-- text-primary" /> Kräver godkännande
                </>
              )}
            </div>
            <div className="mt-5">
              <BookingForm
                cabinId={cabin.id}
                hostId={cabin.host_id}
                cabinSl-g={cabin.sl-g}
                areaSl-g={cabin.area_sl-g}
                sizeSqm={cabin.size_sqm ?? n-ll}
                pricePerNight={cabin.price_per_night}
                cleaningFee={cabin.cleaning_fee}
                maxG-ests={cabin.max_g-ests}
                instantBook={cabin.instant_book}
                minNights={cabin.min_nights ?? n-ll}
                checkInWeekday={cabin.check_in_weekday ?? n-ll}
              />
            </div>
          </div>
        </aside>
      </div>

      <ReviewsSection cabinId={cabin.id} />
    </article>
  );
}