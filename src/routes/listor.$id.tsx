import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ArrowLeft, UserPlus, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

type CabinCardData = CabinWithImages;

export const Route = createFileRoute("/listor/$id")({
  head: () => ({
    meta: [
      { title: "Lista — Fjällportalen" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistDetailPage,
});

function WishlistDetailPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<any>(null);
  const [cabins, setCabins] = useState<CabinCardData[]>([]);
  const [members, setMembers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<CabinCardData[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/logga-in", search: { redirect: `/listor/${id}` } }); return; }
    void load();
  }, [authLoading, user, id, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: w }, { data: wc }, { data: wm }] = await Promise.all([
      supabase.from("wishlists" as any).select("*").eq("id", id).maybeSingle(),
      supabase
        .from("wishlist_cabins" as any)
        .select("cabin_id, note, cabin:cabins(id, slug, title, area_slug, price_per_night, max_guests, bedrooms, images:cabin_images(url, sort_order))")
        .eq("wishlist_id", id),
      supabase.from("wishlist_members" as any).select("user_id").eq("wishlist_id", id),
    ]);
    setList(w);
    setCabins(((wc as any[]) || []).map((row) => row.cabin as CabinCardData).filter(Boolean));
    // Load member names
    const memberIds = ((wm as any[]) || []).map((m) => m.user_id);
    if (memberIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", memberIds);
      setMembers(((profs as any[]) || []).map((p) => ({ user_id: p.id, full_name: p.full_name })));
    } else {
      setMembers([]);
    }
    setLoading(false);
  };

  const doSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    const { data } = await supabase
      .from("cabins")
      .select("id, slug, title, area_slug, price_per_night, max_guests, bedrooms, images:cabin_images(url, sort_order)")
      .eq("status", "published")
      .or(`title.ilike.%${searchQ}%,area.ilike.%${searchQ}%`)
      .limit(8);
    setSearchResults(((data as any[]) || []) as CabinCardData[]);
  };

  const addCabin = async (cabinId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wishlist_cabins" as any).insert({
      wishlist_id: id,
      cabin_id: cabinId,
      added_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tillagd i listan");
    setSearchResults([]);
    setSearchQ("");
    void load();
  };

  const removeCabin = async (cabinId: string) => {
    const { error } = await supabase.from("wishlist_cabins" as any).delete().eq("wishlist_id", id).eq("cabin_id", cabinId);
    if (error) { toast.error(error.message); return; }
    setCabins((prev) => prev.filter((c) => c.id !== cabinId));
  };

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    const userId = inviteEmail.trim();
    if (!userId) return;
    const { error } = await supabase.from("wishlist_members" as any).insert({
      wishlist_id: id,
      user_id: userId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Medlem tillagd");
    setInviteEmail("");
    void load();
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase.from("wishlist_members" as any).delete().eq("wishlist_id", id).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  };

  const isOwner = user?.id === list?.owner_id;

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 md:px-6">
        <Link to="/listor" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Alla listor
        </Link>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
          </div>
        ) : !list ? (
          <p className="text-sm text-muted-foreground">Listan hittades inte.</p>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-foreground">{list.name}</h1>
            {list.description && <p className="mt-1 text-sm text-muted-foreground">{list.description}</p>}

            <section className="mt-8">
              <h2 className="mb-3 font-serif text-xl text-foreground">Medlemmar</h2>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Ägare</span>
                {members.map((m) => (
                  <span key={m.user_id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                    {m.full_name || "Medlem"}
                    {isOwner && (
                      <button onClick={() => removeMember(m.user_id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isOwner && (
                <form onSubmit={invite} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Klistra in medlemmens användar-ID"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4" /> Bjud in
                  </button>
                </form>
              )}
            </section>

            <section className="mt-8">
              <h2 className="mb-3 font-serif text-xl text-foreground">Lägg till stuga</h2>
              <form onSubmit={doSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Sök på titel eller område"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Sök
                </button>
              </form>
              {searchResults.length > 0 && (
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-background">
                  {searchResults.map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.area_slug}</div>
                      </div>
                      <button
                        onClick={() => addCabin(c.id)}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Lägg till
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-3 font-serif text-xl text-foreground">Sparade stugor ({cabins.length})</h2>
              {cabins.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  Inga stugor sparade ännu.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cabins.map((c) => (
                    <div key={c.id} className="relative">
                      <CabinCard cabin={c} />
                      <button
                        onClick={() => removeCabin(c.id)}
                        className="absolute right-3 top-3 z-10 rounded-full bg-background/90 p-2 text-destructive shadow hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Ta bort"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}