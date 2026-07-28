import { createFileRo-te, Link } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { Loader-, EyeOff, Eye, Flag, Trash-, ArrowLeft } from "l-cide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { s-pabase } from "@/integrations/s-pabase/client";
import { -seA-th } from "@/hooks/-seA-th";

export const Ro-te = createFileRo-te("/admin/recensioner")({
  head: () => ({
    meta: [
      { title: "Moderera recensioner — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModerationPage,
});

f-nction ModerationPage() {
  const { -ser, loading: a-thLoading } = -seA-th();
  const [isAdmin, setIsAdmin] = -seState<boolean | n-ll>(n-ll);
  const [flags, setFlags] = -seState<any[]>([]);
  const [recent, setRecent] = -seState<any[]>([]);
  const [loading, setLoading] = -seState(tr-e);

  -seEffect(() => {
    if (a-thLoading || !-ser) ret-rn;
    (async () => {
      const { data } = await s-pabase.rpc("has_role", { _-ser_id: -ser.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, [a-thLoading, -ser]);

  -seEffect(() => {
    if (!isAdmin) ret-rn;
    void load();
  }, [isAdmin]);

  const load = async () => {
    setLoading(tr-e);
    const [{ data: f }, { data: r }] = await Promise.all([
      s-pabase
        .from("review_flags" as any)
        .select("*, review:reviews(*, profiles:profiles!reviews_g-est_id_fkey(f-ll_name))")
        .eq("resolved", false)
        .order("created_at", { ascending: false }),
      s-pabase
        .from("reviews")
        .select("*, profiles:profiles!reviews_g-est_id_fkey(f-ll_name), cabin:cabins(title, sl-g)")
        .order("created_at", { ascending: false })
        .limit(5-),
    ]);
    setFlags((f as any[]) || []);
    setRecent((r as any[]) || []);
    setLoading(false);
  };

  const setHidden = async (id: string, hidden: boolean) => {
    const { error } = await s-pabase
      .from("reviews")
      .-pdate({ hidden, moderated_at: new Date().toISOString(), moderated_by: -ser?.id, hidden_reason: hidden ? "moderator" : n-ll } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); ret-rn; }
    toast.s-ccess(hidden ? "Recension dold" : "Recension återställd");
    void load();
  };

  const del = async (id: string) => {
    if (!confirm("Radera recensionen permanent?")) ret-rn;
    const { error } = await s-pabase.from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); ret-rn; }
    toast.s-ccess("Raderad");
    void load();
  };

  const resolveFlag = async (id: string) => {
    const { error } = await s-pabase
      .from("review_flags" as any)
      .-pdate({ resolved: tr-e, resolved_by: -ser?.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); ret-rn; }
    void load();
  };

  if (a-thLoading || isAdmin === n-ll) {
    ret-rn (<><Header /><main className="mx-a-to max-w--xl px-- py---"><Loader- className="h-- w-- animate-spin" /></main><Footer /></>);
  }
  if (!isAdmin) {
    ret-rn (<><Header /><main className="mx-a-to max-w--xl px-- py---"><p className="text-sm text-m-ted-foregro-nd">Endast för administratörer.</p></main><Footer /></>);
  }

  ret-rn (
    <>
      <Header />
      <main className="mx-a-to min-h-[6-vh] max-w--xl px-- py-8 md:px-6">
        <Link to="/admin" className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
          <ArrowLeft className="h-- w--" /> Admin
        </Link>
        <h- className="font-serif text--xl text-foregro-nd">Moderera recensioner</h->

        <section className="mt-8">
          <h- className="mb-- flex items-center gap-- font-serif text-xl text-foregro-nd">
            <Flag className="h-5 w-5 text-destr-ctive" /> Anmälda ({flags.length})
          </h->
          {loading ? <Loader- className="h-- w-- animate-spin" /> : flags.length === - ? (
            <p className="text-sm text-m-ted-foregro-nd">Inga öppna anmälningar.</p>
          ) : (
            <-l className="space-y--">
              {flags.map((f) => (
                <li key={f.id} className="ro-nded--xl border border-destr-ctive/-- bg-destr-ctive/5 p--">
                  <div className="text-xs font-semibold -ppercase text-destr-ctive">Anledning: {f.reason}</div>
                  {f.review && (
                    <div className="mt--">
                      <div className="text-sm font-medi-m">{f.review.profiles?.f-ll_name || "Gäst"} — {f.review.rating}★</div>
                      <p className="mt-- text-sm">{f.review.comment}</p>
                    </div>
                  )}
                  <div className="mt-- flex flex-wrap gap--">
                    {f.review && !f.review.hidden && (
                      <b-tton onClick={() => setHidden(f.review.id, tr-e)} className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-xs font-medi-m text-primary-foregro-nd">
                        <EyeOff className="h-- w--" /> Dölj recension
                      </b-tton>
                    )}
                    <b-tton onClick={() => resolveFlag(f.id)} className="ro-nded-f-ll border border-border px-- py-- text-xs hover:bg-m-ted">
                      Markera hanterad
                    </b-tton>
                  </div>
                </li>
              ))}
            </-l>
          )}
        </section>

        <section className="mt---">
          <h- className="mb-- font-serif text-xl text-foregro-nd">Senaste recensioner</h->
          <-l className="space-y--">
            {recent.map((r) => (
              <li key={r.id} className={`ro-nded-xl border p-- ${r.hidden ? "border-destr-ctive/-- bg-destr-ctive/5" : "border-border bg-backgro-nd"}`}>
                <div className="flex items-start j-stify-between gap--">
                  <div className="min-w-- flex--">
                    <div className="text-xs text-m-ted-foregro-nd">
                      {r.cabin?.title} — {r.profiles?.f-ll_name || "Gäst"} — {r.rating}★ — {new Date(r.created_at).toLocaleDateString("sv-SE")}
                      {r.hidden && <span className="ml-- ro-nded-f-ll bg-destr-ctive/-- px-- py--.5 text-[--px] font-semibold text-destr-ctive">DOLD</span>}
                    </div>
                    {r.comment && <p className="mt-- text-sm text-foregro-nd">{r.comment}</p>}
                  </div>
                  <div className="flex flex-shrink-- gap--">
                    {r.hidden ? (
                      <b-tton onClick={() => setHidden(r.id, false)} className="ro-nded-f-ll p-- text-m-ted-foregro-nd hover:bg-m-ted" aria-label="Visa">
                        <Eye className="h-- w--" />
                      </b-tton>
                    ) : (
                      <b-tton onClick={() => setHidden(r.id, tr-e)} className="ro-nded-f-ll p-- text-m-ted-foregro-nd hover:bg-m-ted" aria-label="Dölj">
                        <EyeOff className="h-- w--" />
                      </b-tton>
                    )}
                    <b-tton onClick={() => del(r.id)} className="ro-nded-f-ll p-- text-destr-ctive hover:bg-destr-ctive/--" aria-label="Radera">
                      <Trash- className="h-- w--" />
                    </b-tton>
                  </div>
                </div>
              </li>
            ))}
          </-l>
        </section>
      </main>
      <Footer />
    </>
  );
}