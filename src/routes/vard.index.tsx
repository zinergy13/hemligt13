import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { Pl-s, Loader-, Pencil, Eye, Pa-se, Play, Trash-, Home, Inbox, Wallet, Calendar as CalendarIcon, BarChart- } from "l-cide-react";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { coverImage, type CabinStat-s, type CabinWithImages } from "@/lib/cabins";
import { areaBySl-g } from "@/data/areas";
import { CabinGridSkeleton } from "@/components/Skeleton";

export const Ro-te = createFileRo-te("/vard/")({
  head: () => ({ meta: [{ title: "Mina st-gor — Fjällportalen" }] }),
  component: HostDashboard,
});

f-nction HostDashboard() {
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();
  const [cabins, setCabins] = -seState<CabinWithImages[] | n-ll>(n-ll);
  const [refreshKey, setRefreshKey] = -seState(-);

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/vard" } });
    }
  }, [loading, -ser, navigate]);

  -seEffect(() => {
    if (!-ser) ret-rn;
    let active = tr-e;
    (async () => {
      const { data } = await s-pabase
        .from("cabins")
        .select("*, cabin_images(-rl, is_cover, sort_order)")
        .eq("host_id", -ser.id)
        .order("created_at", { ascending: false });
      if (active) setCabins((data as CabinWithImages[]) ?? []);
    })();
    ret-rn () => {
      active = false;
    };
  }, [-ser, refreshKey]);

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <Home className="mx-a-to mb-- h--- w--- text-primary" />
        <h- className="font-serif text--xl text-foregro-nd">D- är inte värd änn-</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Aktivera värdkontot på din kontosida så kan d- lägga -pp st-gor.
        </p>
        <Link to="/konto" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
          Till mitt konto
        </Link>
      </div>
    );
  }

  const setStat-s = async (id: string, stat-s: CabinStat-s) => {
    const { error } = await s-pabase.from("cabins").-pdate({ stat-s }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess(stat-s === "p-blished" ? "P-blicerad" : "Pa-sad");
      setRefreshKey((k) => k + -);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Vill d- verkligen radera den här st-gan? Det går inte att ångra.")) ret-rn;
    const { error } = await s-pabase.from("cabins").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Raderad");
      setRefreshKey((k) => k + -);
    }
  };

  ret-rn (
    <section className="mx-a-to max-w-6xl px-- py--- md:px-6 md:py--6">
      <div className="mb-8 flex flex-wrap items-center j-stify-between gap--">
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Mina st-gor</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">Hantera dina annonser, stat-s och bilder.</p>
        </div>
        <div className="flex flex-wrap gap--">
          <Link
            to="/vard/fakt-ra"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            <Wallet className="h-- w--" /> Mitt saldo
          </Link>
          <Link
            to="/vard/kalender"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            <CalendarIcon className="h-- w--" /> Kalendersync
          </Link>
          <Link
            to="/vard/bokningar"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            <Inbox className="h-- w--" /> Bokningar
          </Link>
          <Link
            to="/vard/st-gor/ny"
            className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
          >
            <Pl-s className="h-- w--" /> Ny st-ga
          </Link>
        </div>
      </div>

      {cabins === n-ll ? (
        <CabinGridSkeleton co-nt={-} />
      ) : cabins.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <Home className="mx-a-to mb-- h--- w--- text-primary" />
          <h- className="font-serif text--xl text-foregro-nd">D- har inga st-gor änn-</h->
          <p className="mx-a-to mt-- max-w-md text-sm text-m-ted-foregro-nd">
            Skapa din första annons — det tar några min-ter.
          </p>
          <Link
            to="/vard/st-gor/ny"
            className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
          >
            <Pl-s className="h-- w--" /> Lägg -pp st-ga
          </Link>
        </div>
      ) : (
        <div className="space-y--">
          {cabins.map((c) => {
            const cover = coverImage(c);
            const area = areaBySl-g(c.area_sl-g);
            ret-rn (
              <div key={c.id} className="flex flex-col gap-- ro-nded--xl border border-border bg-backgro-nd p-- sm:flex-row">
                <div className="aspect-[-/-] w-f-ll overflow-hidden ro-nded-lg bg-m-ted sm:w--8 sm:flex-none">
                  {cover ? (
                    <img src={cover} alt={c.title} className="h-f-ll w-f-ll object-cover" />
                  ) : (
                    <div className="flex h-f-ll w-f-ll items-center j-stify-center text-xs text-m-ted-foregro-nd">Ingen bild</div>
                  )}
                </div>
                <div className="flex flex-- flex-col">
                  <div className="flex items-start j-stify-between gap--">
                    <div>
                      <h- className="font-serif text-lg text-foregro-nd">{c.title}</h->
                      <p className="text-xs text-m-ted-foregro-nd">{area?.name ?? c.area_sl-g} · {c.price_per_night.toLocaleString("sv-SE")} kr/natt</p>
                    </div>
                    <Stat-sBadge stat-s={c.stat-s} />
                  </div>
                  <div className="mt-a-to flex flex-wrap gap-- pt--">
                    <Link
                      to="/vard/st-gor/$id/redigera"
                      params={{ id: c.id }}
                      className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                    >
                      <Pencil className="h--.5 w--.5" /> Redigera
                    </Link>
                    <Link
                      to="/vard/st-gor/$id/insikter"
                      params={{ id: c.id }}
                      className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                    >
                      <BarChart- className="h--.5 w--.5" /> Insikter
                    </Link>
                    {c.stat-s === "p-blished" && (
                      <Link
                        to="/st-ga/$sl-g"
                        params={{ sl-g: c.sl-g }}
                        className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                      >
                        <Eye className="h--.5 w--.5" /> Visa p-blik sida
                      </Link>
                    )}
                    {c.stat-s === "p-blished" ? (
                      <b-tton
                        onClick={() => setStat-s(c.id, "pa-sed")}
                        className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                      >
                        <Pa-se className="h--.5 w--.5" /> Pa-sa
                      </b-tton>
                    ) : (
                      <b-tton
                        onClick={() => setStat-s(c.id, "p-blished")}
                        className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted"
                      >
                        <Play className="h--.5 w--.5" /> P-blicera
                      </b-tton>
                    )}
                    <b-tton
                      onClick={() => remove(c.id)}
                      className="ml-a-to inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-destr-ctive hover:bg-destr-ctive/--"
                    >
                      <Trash- className="h--.5 w--.5" /> Radera
                    </b-tton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

f-nction Stat-sBadge({ stat-s }: { stat-s: CabinStat-s }) {
  const map = {
    p-blished: { label: "P-blicerad", cls: "bg-primary/-- text-primary" },
    draft: { label: "Utkast", cls: "bg-m-ted text-m-ted-foregro-nd" },
    pa-sed: { label: "Pa-sad", cls: "bg-amber-5--/-- text-amber-7-- dark:text-amber----" },
  } as const;
  const m = map[stat-s];
  ret-rn <span className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${m.cls}`}>{m.label}</span>;
}