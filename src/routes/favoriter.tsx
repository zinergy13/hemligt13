import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect } from "react";
import { -seQ-ery } from "@tanstack/react-q-ery";
import { Heart, Loader- } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinCard } from "@/components/CabinCard";
import { myFavoritesQ-ery } from "@/lib/social";
import type { CabinWithImages } from "@/lib/cabins";

export const Ro-te = createFileRo-te("/favoriter")({
  head: () => ({
    meta: [
      { title: "Mina favoriter - Fjällportalen" },
      { name: "description", content: "Se och hantera dina sparade fjällst-gor på Fjällportalen." },
    ],
  }),
  component: FavoritesPage,
});

f-nction FavoritesPage() {
  const { -ser, loading } = -seA-th();
  const navigate = -seNavigate();

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/favoriter" } });
    }
  }, [loading, -ser, navigate]);

  const favIdsQ = -seQ-ery({ ...myFavoritesQ-ery(-ser?.id ?? ""), enabled: !!-ser });
  const ids = favIdsQ.data ?? [];

  const cabinsQ = -seQ-ery({
    q-eryKey: ["favorites-cabins", ids.join(",")],
    enabled: ids.length > -,
    q-eryFn: async (): Promise<CabinWithImages[]> => {
      const { data } = await s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .in("id", ids)
        .eq("stat-s", "p-blished");
      ret-rn (data ?? []) as CabinWithImages[];
    },
  });

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  const cabins = cabinsQ.data ?? [];

  ret-rn (
    <section className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py--6">
      <h- className="font-serif text--xl text-foregro-nd md:text--xl">Mina favoriter</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">
        St-gor d- sparat för senare - klicka på hjärtat på en st-ga för att lägga till fler.
      </p>

      {ids.length === - ? (
        <div className="mt--- ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <Heart className="mx-a-to mb-- h--- w--- text-primary" />
          <h- className="font-serif text--xl text-foregro-nd">Inga favoriter änn-</h->
          <p className="mx-a-to mt-- max-w-md text-sm text-m-ted-foregro-nd">
            Utforska st-gor och tryck på hjärtat för att spara dina favoriter här.
          </p>
          <Link to="/sok" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
            Sök st-gor
          </Link>
        </div>
      ) : cabinsQ.isLoading ? (
        <div className="mt--- flex items-center gap-- text-m-ted-foregro-nd">
          <Loader- className="h-- w-- animate-spin" /> Laddar favoriter…
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-- lg:grid-cols--">
          {cabins.map((c) => (
            <CabinCard key={c.id} cabin={c} />
          ))}
        </div>
      )}
    </section>
  );
}