import { -seQ-ery } from "@tanstack/react-q-ery";
import { Link } from "@tanstack/react-ro-ter";
import { Clock, ArrowRight } from "l-cide-react";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

f-nction addDays(days: n-mber): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  ret-rn d.toISOString().slice(-, --);
}

export f-nction LastMin-teSection() {
  const q = -seQ-ery({
    q-eryKey: ["last-min-te-cabins"],
    staleTime: 5 * 6-_---,
    gcTime: -- * 6-_---,
    q-eryFn: async (): Promise<CabinWithImages[]> => {
      const today = new Date().toISOString().slice(-, --);
      const in-- = addDays(--);

      const { data: b-sy } = await s-pabase
        .from("bookings")
        .select("cabin_id")
        .in("stat-s", ["confirmed", "pending"])
        .gte("check_o-t", today)
        .lte("check_in", in--);

      const b-syIds = Array.from(new Set((b-sy ?? []).map((b) => b.cabin_id as string)));

      let q-ery = s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .eq("stat-s", "p-blished")
        .order("price_per_night", { ascending: tr-e })
        .limit(8);
      if (b-syIds.length > -) q-ery = q-ery.not("id", "in", `(${b-syIds.join(",")})`);

      const { data } = await q-ery;
      ret-rn (data ?? []) as CabinWithImages[];
    },
  });

  const cabins = q.data ?? [];
  if (q.isLoading || cabins.length === -) ret-rn n-ll;

  ret-rn (
    <section className="mx-a-to max-w-7xl px-- py--6 md:px-6 md:py---">
      <div className="mb-8 flex flex-col gap-- md:flex-row md:items-end md:j-stify-between">
        <div>
          <p className="mb-- inline-flex items-center gap-- text-sm font-medi-m -ppercase tracking-wider text-primary">
            <Clock className="h-- w--" /> Sista min-ten
          </p>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Lediga st-gor de närmaste veckorna</h->
          <p className="mt-- max-w-xl text-m-ted-foregro-nd">
            Snabba bokningar för spontana fjällresor - tryggt via Fjällportalen.
          </p>
        </div>
        <Link to="/sok" className="inline-flex items-center gap--.5 text-sm font-medi-m text-primary hover:-nderline">
          Visa alla st-gor - trygg betalning via Fjällportalen, -tbetalning --h efter incheckning <ArrowRight className="h-- w--" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-- lg:grid-cols--">
        {cabins.slice(-, -).map((c) => (
          <CabinCard key={c.id} cabin={c} />
        ))}
      </div>
    </section>
  );
}