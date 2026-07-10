import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2, Pencil, Eye, Pause, Play, Trash2, Home, Inbox, Wallet, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { coverImage, type CabinStatus, type CabinWithImages } from "@/lib/cabins";
import { areaBySlug } from "@/data/areas";
import { CabinGridSkeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/vard")({
  head: () => ({ meta: [{ title: "Mina stugor — Fjällhuset" }] }),
  component: HostDashboard,
});

function HostDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [cabins, setCabins] = useState<CabinWithImages[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/vard" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("cabins")
        .select("*, cabin_images(url, is_cover, sort_order)")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      if (active) setCabins((data as CabinWithImages[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [user, refreshKey]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Home className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="font-serif text-3xl text-foreground">Du är inte värd ännu</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Aktivera värdkontot på din kontosida så kan du lägga upp stugor.
        </p>
        <Link to="/konto" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Till mitt konto
        </Link>
      </div>
    );
  }

  const setStatus = async (id: string, status: CabinStatus) => {
    const { error } = await supabase.from("cabins").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "published" ? "Publicerad" : "Pausad");
      setRefreshKey((k) => k + 1);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Vill du verkligen radera den här stugan? Det går inte att ångra.")) return;
    const { error } = await supabase.from("cabins").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Raderad");
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mina stugor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hantera dina annonser, status och bilder.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/vard/faktura"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Wallet className="h-4 w-4" /> Mitt saldo
          </Link>
          <Link
            to="/vard/kalender"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <CalendarIcon className="h-4 w-4" /> Kalendersync
          </Link>
          <Link
            to="/vard/bokningar"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Inbox className="h-4 w-4" /> Bokningar
          </Link>
          <Link
            to="/vard/stugor/ny"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Ny stuga
          </Link>
        </div>
      </div>

      {cabins === null ? (
        <CabinGridSkeleton count={3} />
      ) : cabins.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Home className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Du har inga stugor ännu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Skapa din första annons — det tar några minuter.
          </p>
          <Link
            to="/vard/stugor/ny"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Lägg upp stuga
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cabins.map((c) => {
            const cover = coverImage(c);
            const area = areaBySlug(c.area_slug);
            return (
              <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted sm:w-48 sm:flex-none">
                  {cover ? (
                    <img src={cover} alt={c.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Ingen bild</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg text-foreground">{c.title}</h3>
                      <p className="text-xs text-muted-foreground">{area?.name ?? c.area_slug} · {c.price_per_night.toLocaleString("sv-SE")} kr/natt</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Link
                      to="/vard/stugor/$id/redigera"
                      params={{ id: c.id }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Redigera
                    </Link>
                    {c.status === "published" && (
                      <Link
                        to="/stuga/$slug"
                        params={{ slug: c.slug }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" /> Visa publik sida
                      </Link>
                    )}
                    {c.status === "published" ? (
                      <button
                        onClick={() => setStatus(c.id, "paused")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Pause className="h-3.5 w-3.5" /> Pausa
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatus(c.id, "published")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Play className="h-3.5 w-3.5" /> Publicera
                      </button>
                    )}
                    <button
                      onClick={() => remove(c.id)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Radera
                    </button>
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

function StatusBadge({ status }: { status: CabinStatus }) {
  const map = {
    published: { label: "Publicerad", cls: "bg-primary/10 text-primary" },
    draft: { label: "Utkast", cls: "bg-muted text-muted-foreground" },
    paused: { label: "Pausad", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  } as const;
  const m = map[status];
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${m.cls}`}>{m.label}</span>;
}