import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import { myFavoritesQuery } from "@/lib/social";
import type { CabinWithImages } from "@/lib/cabins";

export const Route = createFileRoute("/favoriter")({
  head: () => ({
    meta: [
      { title: "Mina favoriter — Fjällportalen" },
      { name: "description", content: "Se och hantera dina sparade fjällstugor på Fjällportalen." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/favoriter" } });
    }
  }, [loading, user, navigate]);

  const favIdsQ = useQuery({ ...myFavoritesQuery(user?.id ?? ""), enabled: !!user });
  const ids = favIdsQ.data ?? [];

  const cabinsQ = useQuery({
    queryKey: ["favorites-cabins", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<CabinWithImages[]> => {
      const { data } = await supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .in("id", ids)
        .eq("status", "published");
      return (data ?? []) as CabinWithImages[];
    },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cabins = cabinsQ.data ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mina favoriter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Stugor du sparat för senare — klicka på hjärtat på en stuga för att lägga till fler.
      </p>

      {ids.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Heart className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Inga favoriter ännu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Utforska stugor och tryck på hjärtat för att spara dina favoriter här.
          </p>
          <Link to="/sok" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Sök stugor
          </Link>
        </div>
      ) : cabinsQ.isLoading ? (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar favoriter…
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cabins.map((c) => (
            <CabinCard key={c.id} cabin={c} />
          ))}
        </div>
      )}
    </section>
  );
}