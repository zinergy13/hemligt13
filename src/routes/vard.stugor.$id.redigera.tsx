import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CabinForm, type CabinFormImage, type CabinFormValues } from "@/components/CabinForm";
import { CABIN_COLUMNS, type CabinStatus, type CabinWithImages } from "@/lib/cabins";

export const Route = createFileRoute("/vard/stugor/$id/redigera")({
  head: () => ({ meta: [{ title: "Redigera stuga - Fjällportalen" }] }),
  component: EditCabinPage,
});

function EditCabinPage() {
  const { id } = Route.useParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [cabin, setCabin] = useState<CabinWithImages | null | "missing">(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: `/vard/stugor/${id}/redigera` } });
    }
  }, [loading, user, id, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("cabins")
        .select(`${CABIN_COLUMNS}, cabin_images(id, url, is_cover, sort_order)`)
        .eq("id", id)
        .eq("host_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        toast.error(error.message);
        setCabin("missing");
      } else {
        setCabin((data as CabinWithImages | null) ?? "missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [user, id]);

  if (loading || !user || cabin === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Endast värdar</h1>
        <p className="mt-3 text-sm text-muted-foreground">Aktivera värdkontot på din kontosida.</p>
        <Link to="/konto" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Till mitt konto
        </Link>
      </div>
    );
  }

  if (cabin === "missing") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Stugan hittades inte</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Den här stugan finns inte eller tillhör inte ditt konto.
        </p>
        <Link to="/vard" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Tillbaka till mina stugor
        </Link>
      </div>
    );
  }

  const initialValues: Partial<CabinFormValues> = {
    id: cabin.id,
    title: cabin.title,
    description: cabin.description ?? "",
    area_slug: cabin.area_slug,
    address: cabin.address ?? "",
    bedrooms: cabin.bedrooms,
    beds: cabin.beds,
    bathrooms: cabin.bathrooms,
    max_guests: cabin.max_guests,
    price_per_night: cabin.price_per_night,
    cleaning_fee: cabin.cleaning_fee,
    amenities: cabin.amenities ?? [],
    status: cabin.status as CabinStatus,
    slug: cabin.slug,
  };

  const initialImages: CabinFormImage[] = (cabin.cabin_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img, i) => ({
      existing_id: (img as typeof img & { id: string }).id,
      url: img.url,
      is_cover: img.is_cover,
      sort_order: i,
    }));

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <Link to="/vard" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Mina stugor
      </Link>
      <h1 className="mb-8 font-serif text-3xl text-foreground md:text-4xl">Redigera stuga</h1>
      <CabinForm
        userId={user.id}
        initialValues={initialValues}
        initialImages={initialImages}
        onSaved={() => {
          toast.success("Ändringar sparade");
          navigate({ to: "/vard" });
        }}
      />
    </section>
  );
}