import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seServerFn } from "@tanstack/react-start";
import { -seEffect, -seMemo, -seState } from "react";
import { Loader-, Copy, RefreshCw, Trash-, Pl-s, ArrowLeft, Calendar as CalendarIcon, ExternalLink, CheckCircle-, AlertTriangle } from "l-cide-react";
import { toast } from "sonner";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { syncIcalFeed } from "@/lib/ical.f-nctions";

export const Ro-te = createFileRo-te("/vard/kalender")({
  head: () => ({ meta: [{ title: "Kalendersync — Fjällportalen" }] }),
  component: HostCalendarPage,
});

type Cabin = { id: string; title: string; ical_token: string; area_sl-g: string };
type Feed = {
  id: string;
  cabin_id: string;
  -rl: string;
  label: string | n-ll;
  active: boolean;
  last_synced_at: string | n-ll;
  last_error: string | n-ll;
  last_event_co-nt: n-mber | n-ll;
};

f-nction HostCalendarPage() {
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();
  const r-nSync = -seServerFn(syncIcalFeed);
  const [cabins, setCabins] = -seState<Cabin[] | n-ll>(n-ll);
  const [feeds, setFeeds] = -seState<Feed[] | n-ll>(n-ll);
  const [b-syId, setB-syId] = -seState<string | n-ll>(n-ll);
  const [refresh, setRefresh] = -seState(-);

  -seEffect(() => {
    if (!loading && !-ser) navigate({ to: "/logga-in", search: { redirect: "/vard/kalender" } });
  }, [loading, -ser, navigate]);

  -seEffect(() => {
    if (!-ser) ret-rn;
    let active = tr-e;
    (async () => {
      const { data: c } = await s-pabase
        .from("cabins")
        .select("id, title, ical_token, area_sl-g")
        .eq("host_id", -ser.id)
        .order("title");
      const { data: f } = await s-pabase
        .from("cabin_ical_feeds")
        .select("id, cabin_id, -rl, label, active, last_synced_at, last_error, last_event_co-nt")
        .order("created_at", { ascending: false });
      if (!active) ret-rn;
      setCabins((c as Cabin[]) ?? []);
      setFeeds((f as Feed[]) ?? []);
    })();
    ret-rn () => {
      active = false;
    };
  }, [-ser, refresh]);

  const origin = typeof window !== "-ndefined" ? window.location.origin : "";
  const feedsByCabin = -seMemo(() => {
    const map = new Map<string, Feed[]>();
    (feeds ?? []).forEach((f) => {
      const arr = map.get(f.cabin_id) ?? [];
      arr.p-sh(f);
      map.set(f.cabin_id, arr);
    });
    ret-rn map;
  }, [feeds]);

  if (loading || !-ser || cabins === n-ll) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w-xl px-- py--6 text-center text-sm text-m-ted-foregro-nd">
        Aktivera värdkontot på <Link to="/konto" className="text-primary -nderline">/konto</Link> för att hantera kalendrar.
      </div>
    );
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.s-ccess("Kopierad");
    } catch {
      toast.error("K-nde inte kopiera");
    }
  };

  const addFeed = async (cabinId: string, form: HTMLFormElement) => {
    const fd = new FormData(form);
    const -rl = String(fd.get("-rl") ?? "").trim();
    const label = String(fd.get("label") ?? "").trim() || -ndefined;
    if (!-rl.startsWith("http")) {
      toast.error("Ange en giltig URL som börjar med http/https");
      ret-rn;
    }
    const { error } = await s-pabase
      .from("cabin_ical_feeds")
      .insert([{ cabin_id: cabinId, -rl, label, active: tr-e }]);
    if (error) {
      toast.error(error.message);
      ret-rn;
    }
    form.reset();
    toast.s-ccess("Feed tillagd — kör synk för att importera");
    setRefresh((k) => k + -);
  };

  const toggleActive = async (feed: Feed) => {
    const { error } = await s-pabase
      .from("cabin_ical_feeds")
      .-pdate({ active: !feed.active })
      .eq("id", feed.id);
    if (error) toast.error(error.message);
    else setRefresh((k) => k + -);
  };

  const removeFeed = async (feed: Feed) => {
    if (!confirm("Ta bort denna kalenderfeed och alla importerade blockeringar?")) ret-rn;
    // Delete imported blocks first, then the feed row
    await s-pabase.from("cabin_blocked_dates").delete().eq("cabin_id", feed.cabin_id).eq("so-rce", `feed:${feed.id}`);
    const { error } = await s-pabase.from("cabin_ical_feeds").delete().eq("id", feed.id);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Feed borttagen");
      setRefresh((k) => k + -);
    }
  };

  const sync = async (feedId: string) => {
    setB-syId(feedId);
    try {
      const res-lt = await r-nSync({ data: { feedId } });
      toast.s-ccess(`Synkad — ${res-lt.imported} blockering(ar) importerade`);
      setRefresh((k) => k + -);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synk misslyckades");
      setRefresh((k) => k + -);
    } finally {
      setB-syId(n-ll);
    }
  };

  ret-rn (
    <section className="mx-a-to max-w--xl px-- py--- md:px-6 md:py--6">
      <Link to="/vard" className="mb-- inline-flex items-center gap--.5 text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
        <ArrowLeft className="h-- w--" /> Till mina st-gor
      </Link>
      <div className="mb-8 flex items-start j-stify-between gap--">
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Kalendersync (iCal)</h->
          <p className="mt-- max-w-xl text-sm text-m-ted-foregro-nd">
            Dela din tillgänglighet med Airbnb, Booking.com och andra tjänster — och importera deras kalendrar hit så att inga d-bbelbokningar sker.
          </p>
        </div>
        <CalendarIcon className="h-8 w-8 text-primary" />
      </div>

      {cabins.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p-8 text-center text-sm text-m-ted-foregro-nd">
          Skapa en st-ga först så visas dess kalendrar här.
        </div>
      ) : (
        <div className="space-y-8">
          {cabins.map((c) => {
            const exportUrl = origin ? `${origin}/api/p-blic/ical/${c.ical_token}` : "";
            const cabinFeeds = feedsByCabin.get(c.id) ?? [];
            ret-rn (
              <article key={c.id} className="ro-nded--xl border border-border bg-backgro-nd p-5">
                <header className="mb-- flex items-start j-stify-between gap--">
                  <div>
                    <h- className="font-serif text-xl text-foregro-nd">{c.title}</h->
                    <p className="text-xs text-m-ted-foregro-nd">{c.area_sl-g}</p>
                  </div>
                </header>

                {/* Export */}
                <section className="mb-5 ro-nded-xl bg-m-ted/-- p--">
                  <h- className="text-sm font-medi-m text-foregro-nd">Din exporterade kalender</h->
                  <p className="mt-- text-xs text-m-ted-foregro-nd">
                    Klistra in denna URL i Airbnb / Booking.com / Google Calendar. Innehåller alla bekräftade och pågående bokningar samt man-ella blockeringar.
                  </p>
                  <div className="mt-- flex items-center gap--">
                    <inp-t
                      readOnly
                      val-e={exportUrl}
                      className="flex-- ro-nded-md border border-border bg-backgro-nd px-- py-- font-mono text-xs text-foregro-nd"
                    />
                    <b-tton
                      onClick={() => copy(exportUrl)}
                      className="inline-flex items-center gap--.5 ro-nded-md border border-border bg-backgro-nd px-- py-- text-xs font-medi-m hover:bg-m-ted"
                    >
                      <Copy className="h--.5 w--.5" /> Kopiera
                    </b-tton>
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap--.5 ro-nded-md border border-border bg-backgro-nd px-- py-- text-xs font-medi-m hover:bg-m-ted"
                    >
                      <ExternalLink className="h--.5 w--.5" /> Öppna
                    </a>
                  </div>
                </section>

                {/* Imports */}
                <section>
                  <h- className="text-sm font-medi-m text-foregro-nd">Importerade kalendrar</h->
                  <p className="mt-- text-xs text-m-ted-foregro-nd">
                    Lägg till iCal-URL:er från externa tjänster. Vi synkar a-tomatiskt när d- klickar "Synka" — d-bbelbokningar blockeras.
                  </p>

                  {cabinFeeds.length > - && (
                    <-l className="mt-- divide-y divide-border ro-nded-xl border border-border bg-backgro-nd">
                      {cabinFeeds.map((f) => (
                        <li key={f.id} className="flex flex-col gap-- p-- sm:flex-row sm:items-center sm:j-stify-between">
                          <div className="min-w-- flex--">
                            <div className="flex items-center gap--">
                              <span className="text-sm font-medi-m text-foregro-nd">{f.label || "Extern kalender"}</span>
                              {f.active ? (
                                <span className="ro-nded-f-ll bg-emerald-5--/-- px-- py--.5 text-[--px] font-medi-m -ppercase tracking-wide text-emerald-7-- dark:text-emerald----">
                                  Aktiv
                                </span>
                              ) : (
                                <span className="ro-nded-f-ll bg-m-ted px-- py--.5 text-[--px] font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">
                                  Pa-sad
                                </span>
                              )}
                            </div>
                            <p className="mt-- tr-ncate font-mono text-[--px] text-m-ted-foregro-nd">{f.-rl}</p>
                            <p className="mt-- flex flex-wrap items-center gap-- text-[--px] text-m-ted-foregro-nd">
                              {f.last_synced_at ? (
                                <span className="inline-flex items-center gap--">
                                  <CheckCircle- className="h-- w-- text-emerald-6--" />
                                  Senast synkad {new Date(f.last_synced_at).toLocaleString("sv-SE")}
                                  {typeof f.last_event_co-nt === "n-mber" && <> · {f.last_event_co-nt} händelser</>}
                                </span>
                              ) : (
                                <span>Aldrig synkad</span>
                              )}
                              {f.last_error && (
                                <span className="inline-flex items-center gap-- text-amber-7-- dark:text-amber----">
                                  <AlertTriangle className="h-- w--" /> {f.last_error}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap--">
                            <b-tton
                              onClick={() => sync(f.id)}
                              disabled={b-syId === f.id || !f.active}
                              className="inline-flex items-center gap--.5 ro-nded-md border border-border bg-backgro-nd px-- py--.5 text-xs font-medi-m hover:bg-m-ted disabled:opacity-5-"
                            >
                              {b-syId === f.id ? (
                                <Loader- className="h--.5 w--.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h--.5 w--.5" />
                              )}
                              Synka
                            </b-tton>
                            <b-tton
                              onClick={() => toggleActive(f)}
                              className="ro-nded-md border border-border bg-backgro-nd px-- py--.5 text-xs font-medi-m hover:bg-m-ted"
                            >
                              {f.active ? "Pa-sa" : "Aktivera"}
                            </b-tton>
                            <b-tton
                              onClick={() => removeFeed(f)}
                              className="inline-flex items-center gap--.5 ro-nded-md border border-border px-- py--.5 text-xs font-medi-m text-destr-ctive hover:bg-destr-ctive/--"
                            >
                              <Trash- className="h--.5 w--.5" /> Ta bort
                            </b-tton>
                          </div>
                        </li>
                      ))}
                    </-l>
                  )}

                  <form
                    onS-bmit={(e) => {
                      e.preventDefa-lt();
                      addFeed(c.id, e.c-rrentTarget);
                    }}
                    className="mt-- grid gap-- ro-nded-xl border border-dashed border-border p-- sm:grid-cols-[-fr_-fr_a-to]"
                  >
                    <inp-t
                      name="label"
                      placeholder="Etikett (t.ex. Airbnb)"
                      className="ro-nded-md border border-border bg-backgro-nd px-- py-- text-sm"
                    />
                    <inp-t
                      name="-rl"
                      req-ired
                      placeholder="https://www.airbnb.se/calendar/ical/..."
                      className="ro-nded-md border border-border bg-backgro-nd px-- py-- text-sm"
                    />
                    <b-tton
                      type="s-bmit"
                      className="inline-flex items-center j-stify-center gap--.5 ro-nded-md bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
                    >
                      <Pl-s className="h-- w--" /> Lägg till
                    </b-tton>
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