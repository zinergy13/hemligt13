import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Copy, RefreshCw, Trash2, Plus, ArrowLeft, Calendar as CalendarIcon, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { syncIcalFeed } from "@/lib/ical.functions";

export const Route = createFileRoute("/vard/kalender")({
  head: () => ({ meta: [{ title: "Kalendersync — Fjällportalen" }] }),
  component: HostCalendarPage,
});

type Cabin = { id: string; title: string; ical_token: string; area_slug: string };
type Feed = {
  id: string;
  cabin_id: string;
  url: string;
  label: string | null;
  active: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  last_event_count: number | null;
};

function HostCalendarPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const runSync = useServerFn(syncIcalFeed);
  const [cabins, setCabins] = useState<Cabin[] | null>(null);
  const [feeds, setFeeds] = useState<Feed[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/logga-in", search: { redirect: "/vard/kalender" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: c } = await supabase
        .from("cabins")
        .select("id, title, ical_token, area_slug")
        .eq("host_id", user.id)
        .order("title");
      const { data: f } = await supabase
        .from("cabin_ical_feeds")
        .select("id, cabin_id, url, label, active, last_synced_at, last_error, last_event_count")
        .order("created_at", { ascending: false });
      if (!active) return;
      setCabins((c as Cabin[]) ?? []);
      setFeeds((f as Feed[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [user, refresh]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const feedsByCabin = useMemo(() => {
    const map = new Map<string, Feed[]>();
    (feeds ?? []).forEach((f) => {
      const arr = map.get(f.cabin_id) ?? [];
      arr.push(f);
      map.set(f.cabin_id, arr);
    });
    return map;
  }, [feeds]);

  if (loading || !user || cabins === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted-foreground">
        Aktivera värdkontot på <Link to="/konto" className="text-primary underline">/konto</Link> för att hantera kalendrar.
      </div>
    );
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Kopierad");
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  const addFeed = async (cabinId: string, form: HTMLFormElement) => {
    const fd = new FormData(form);
    const url = String(fd.get("url") ?? "").trim();
    const label = String(fd.get("label") ?? "").trim() || undefined;
    if (!url.startsWith("http")) {
      toast.error("Ange en giltig URL som börjar med http/https");
      return;
    }
    const { error } = await supabase
      .from("cabin_ical_feeds")
      .insert([{ cabin_id: cabinId, url, label, active: true }]);
    if (error) {
      toast.error(error.message);
      return;
    }
    form.reset();
    toast.success("Feed tillagd — kör synk för att importera");
    setRefresh((k) => k + 1);
  };

  const toggleActive = async (feed: Feed) => {
    const { error } = await supabase
      .from("cabin_ical_feeds")
      .update({ active: !feed.active })
      .eq("id", feed.id);
    if (error) toast.error(error.message);
    else setRefresh((k) => k + 1);
  };

  const removeFeed = async (feed: Feed) => {
    if (!confirm("Ta bort denna kalenderfeed och alla importerade blockeringar?")) return;
    // Delete imported blocks first, then the feed row
    await supabase.from("cabin_blocked_dates").delete().eq("cabin_id", feed.cabin_id).eq("source", `feed:${feed.id}`);
    const { error } = await supabase.from("cabin_ical_feeds").delete().eq("id", feed.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Feed borttagen");
      setRefresh((k) => k + 1);
    }
  };

  const sync = async (feedId: string) => {
    setBusyId(feedId);
    try {
      const result = await runSync({ data: { feedId } });
      toast.success(`Synkad — ${result.imported} blockering(ar) importerade`);
      setRefresh((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synk misslyckades");
      setRefresh((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <Link to="/vard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Till mina stugor
      </Link>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Kalendersync (iCal)</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Dela din tillgänglighet med Airbnb, Booking.com och andra tjänster — och importera deras kalendrar hit så att inga dubbelbokningar sker.
          </p>
        </div>
        <CalendarIcon className="h-8 w-8 text-primary" />
      </div>

      {cabins.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Skapa en stuga först så visas dess kalendrar här.
        </div>
      ) : (
        <div className="space-y-8">
          {cabins.map((c) => {
            const exportUrl = origin ? `${origin}/api/public/ical/${c.ical_token}` : "";
            const cabinFeeds = feedsByCabin.get(c.id) ?? [];
            return (
              <article key={c.id} className="rounded-2xl border border-border bg-background p-5">
                <header className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl text-foreground">{c.title}</h2>
                    <p className="text-xs text-muted-foreground">{c.area_slug}</p>
                  </div>
                </header>

                {/* Export */}
                <section className="mb-5 rounded-xl bg-muted/40 p-4">
                  <h3 className="text-sm font-medium text-foreground">Din exporterade kalender</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Klistra in denna URL i Airbnb / Booking.com / Google Calendar. Innehåller alla bekräftade och pågående bokningar samt manuella blockeringar.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      readOnly
                      value={exportUrl}
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
                    />
                    <button
                      onClick={() => copy(exportUrl)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" /> Kopiera
                    </button>
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Öppna
                    </a>
                  </div>
                </section>

                {/* Imports */}
                <section>
                  <h3 className="text-sm font-medium text-foreground">Importerade kalendrar</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lägg till iCal-URL:er från externa tjänster. Vi synkar automatiskt när du klickar "Synka" — dubbelbokningar blockeras.
                  </p>

                  {cabinFeeds.length > 0 && (
                    <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
                      {cabinFeeds.map((f) => (
                        <li key={f.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{f.label || "Extern kalender"}</span>
                              {f.active ? (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                  Aktiv
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Pausad
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{f.url}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {f.last_synced_at ? (
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  Senast synkad {new Date(f.last_synced_at).toLocaleString("sv-SE")}
                                  {typeof f.last_event_count === "number" && <> · {f.last_event_count} händelser</>}
                                </span>
                              ) : (
                                <span>Aldrig synkad</span>
                              )}
                              {f.last_error && (
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                  <AlertTriangle className="h-3 w-3" /> {f.last_error}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => sync(f.id)}
                              disabled={busyId === f.id || !f.active}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                            >
                              {busyId === f.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Synka
                            </button>
                            <button
                              onClick={() => toggleActive(f)}
                              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                            >
                              {f.active ? "Pausa" : "Aktivera"}
                            </button>
                            <button
                              onClick={() => removeFeed(f)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Ta bort
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addFeed(c.id, e.currentTarget);
                    }}
                    className="mt-3 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <input
                      name="label"
                      placeholder="Etikett (t.ex. Airbnb)"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      name="url"
                      required
                      placeholder="https://www.airbnb.se/calendar/ical/..."
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" /> Lägg till
                    </button>
                  </form>
                </section>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}