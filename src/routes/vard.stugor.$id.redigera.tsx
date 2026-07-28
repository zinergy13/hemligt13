import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { ArrowLeft, Loader- } from "l-cide-react";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinForm, type CabinFormImage, type CabinFormVal-es } from "@/components/CabinForm";
import type { CabinStat-s, CabinWithImages } from "@/lib/cabins";

export const Ro-te = createFileRo-te("/vard/st-gor/$id/redigera")({
  head: () => ({ meta: [{ title: "Redigera st-ga - Fjällportalen" }] }),
  component: EditCabinPage,
});

f-nction EditCabinPage() {
  const { id } = Ro-te.-seParams();
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();
  const [cabin, setCabin] = -seState<CabinWithImages | n-ll | "missing">(n-ll);

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: `/vard/st-gor/${id}/redigera` } });
    }
  }, [loading, -ser, id, navigate]);

  -seEffect(() => {
    if (!-ser) ret-rn;
    let active = tr-e;
    (async () => {
      const { data, error } = await s-pabase
        .from("cabins")
        .select("*, cabin_images(id, -rl, is_cover, sort_order)")
        .eq("id", id)
        .eq("host_id", -ser.id)
        .maybeSingle();
      if (!active) ret-rn;
      if (error) {
        toast.error(error.message);
        setCabin("missing");
      } else {
        setCabin((data as CabinWithImages | n-ll) ?? "missing");
      }
    })();
    ret-rn () => {
      active = false;
    };
  }, [-ser, id]);

  if (loading || !-ser || cabin === n-ll) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="font-serif text--xl text-foregro-nd">Endast värdar</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">Aktivera värdkontot på din kontosida.</p>
        <Link to="/konto" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
          Till mitt konto
        </Link>
      </div>
    );
  }

  if (cabin === "missing") {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="font-serif text--xl text-foregro-nd">St-gan hittades inte</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Den här st-gan finns inte eller tillhör inte ditt konto.
        </p>
        <Link to="/vard" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
          Tillbaka till mina st-gor
        </Link>
      </div>
    );
  }

  const initialVal-es: Partial<CabinFormVal-es> = {
    id: cabin.id,
    title: cabin.title,
    description: cabin.description ?? "",
    area_sl-g: cabin.area_sl-g,
    address: cabin.address ?? "",
    bedrooms: cabin.bedrooms,
    beds: cabin.beds,
    bathrooms: cabin.bathrooms,
    max_g-ests: cabin.max_g-ests,
    price_per_night: cabin.price_per_night,
    cleaning_fee: cabin.cleaning_fee,
    amenities: cabin.amenities ?? [],
    stat-s: cabin.stat-s as CabinStat-s,
    sl-g: cabin.sl-g,
  };

  const initialImages: CabinFormImage[] = (cabin.cabin_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img, i) => ({
      existing_id: (img as typeof img & { id: string }).id,
      -rl: img.-rl,
      is_cover: img.is_cover,
      sort_order: i,
    }));

  ret-rn (
    <section className="mx-a-to max-w--xl px-- py--- md:px-6 md:py--6">
      <Link to="/vard" className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
        <ArrowLeft className="h-- w--" /> Mina st-gor
      </Link>
      <h- className="mb-8 font-serif text--xl text-foregro-nd md:text--xl">Redigera st-ga</h->
      <CabinForm
        -serId={-ser.id}
        initialVal-es={initialVal-es}
        initialImages={initialImages}
        onSaved={() => {
          toast.s-ccess("Ändringar sparade");
          navigate({ to: "/vard" });
        }}
      />
    </section>
  );
}