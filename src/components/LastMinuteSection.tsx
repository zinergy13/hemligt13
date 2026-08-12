import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import { PUBLIC_CABIN_SELECT, type CabinWithImages } from "@/lib/cabins";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function LastMinuteSection() {
  const q = useQuery({
    queryKey: ["last-minute-cabins"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<CabinWithImages[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const in21 = addDays(21);

      const { data: busy } = await supabase
        .from("bookings")
        .select("cabin_id")
        .in("status", ["confirmed", "pending"])
        .gte("check_out", today)
        .lte("check_in", in21);

      const busyIds = Array.from(new Set((busy ?? []).map((b) => b.cabin_id as string)));

      let query = supabase
        .from("cabins")
        .select(PUBLIC_CABIN_SELECT)
        .eq("status", "published")
        .order("price_per_night", { ascending: true })
        .limit(8);
      if (busyIds.length > 0) query = query.not("id", "in", `(${busyIds.join(",")})`);

      const { data } = await query;
      return (data ?? []) as CabinWithImages[];
    },
  });

  const cabins = q.data ?? [];
  if (q.isLoading || cabins.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-primary">
            <Clock className="h-4 w-4" /> Sista minuten
          </p>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Lediga stugor de närmaste veckorna</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Snabba bokningar för spontana fjällresor - tryggt via Fjällportalen.
          </p>
        </div>
        <Link to="/sok" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          Visa alla stugor - trygg betalning via Fjällportalen, utbetalning schemaläggs efter incheckning <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cabins.slice(0, 4).map((c) => (
          <CabinCard key={c.id} cabin={c} />
        ))}
      </div>
    </section>
  );
}