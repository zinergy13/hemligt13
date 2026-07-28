import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, EyeOff, Eye, Flag, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/recensioner")({
  head: () => ({
    meta: [
      { title: "Moderera recensioner - Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModerationPage,
});

function ModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, [authLoading, user]);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: r }] = await Promise.all([
      supabase
        .from("review_flags" as any)
        .select("*, review:reviews(*, profiles:profiles!reviews_guest_id_fkey(full_name))")
        .eq("resolved", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("*, profiles:profiles!reviews_guest_id_fkey(full_name), cabin:cabins(title, slug)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setFlags((f as any[]) || []);
    setRecent((r as any[]) || []);
    setLoading(false);
  };

  const setHidden = async (id: string, hidden: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ hidden, moderated_at: new Date().toISOString(), moderated_by: user?.id, hidden_reason: hidden ? "moderator" : null } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(hidden ? "Recension dold" : "Recension återställd");
    void load();
  };

  const del = async (id: string) => {
    if (!confirm("Radera recensionen permanent?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Raderad");
    void load();
  };

  const resolveFlag = async (id: string) => {
    const { error } = await supabase
      .from("review_flags" as any)
      .update({ resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    void load();
  };

  if (authLoading || isAdmin === null) {
    return (<><Header /><main className="mx-auto max-w-4xl px-4 py-10"><Loader2 className="h-4 w-4 animate-spin" /></main><Footer /></>);
  }
  if (!isAdmin) {
    return (<><Header /><main className="mx-auto max-w-4xl px-4 py-10"><p className="text-sm text-muted-foreground">Endast för administratörer.</p></main><Footer /></>);
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-8 md:px-6">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <h1 className="font-serif text-3xl text-foreground">Moderera recensioner</h1>

        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-foreground">
            <Flag className="h-5 w-5 text-destructive" /> Anmälda ({flags.length})
          </h2>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga öppna anmälningar.</p>
          ) : (
            <ul className="space-y-3">
              {flags.map((f) => (
                <li key={f.id} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <div className="text-xs font-semibold uppercase text-destructive">Anledning: {f.reason}</div>
                  {f.review && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">{f.review.profiles?.full_name || "Gäst"} - {f.review.rating}★</div>
                      <p className="mt-1 text-sm">{f.review.comment}</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.review && !f.review.hidden && (
                      <button onClick={() => setHidden(f.review.id, true)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        <EyeOff className="h-3 w-3" /> Dölj recension
                      </button>
                    )}
                    <button onClick={() => resolveFlag(f.id)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                      Markera hanterad
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-serif text-xl text-foreground">Senaste recensioner</h2>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className={`rounded-xl border p-3 ${r.hidden ? "border-destructive/30 bg-destructive/5" : "border-border bg-background"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">
                      {r.cabin?.title} - {r.profiles?.full_name || "Gäst"} - {r.rating}★ - {new Date(r.created_at).toLocaleDateString("sv-SE")}
                      {r.hidden && <span className="ml-2 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-semibold text-destructive">DOLD</span>}
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-foreground">{r.comment}</p>}
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    {r.hidden ? (
                      <button onClick={() => setHidden(r.id, false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Visa">
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => setHidden(r.id, true)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Dölj">
                        <EyeOff className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => del(r.id)} className="rounded-full p-2 text-destructive hover:bg-destructive/10" aria-label="Radera">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}