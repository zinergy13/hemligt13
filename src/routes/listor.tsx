import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Users, Lock, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/listor")({
  head: () => ({
    meta: [
      { title: "Mina listor - Fjällportalen" },
      { name: "description", content: "Skapa hemliga listor med stugor att dela med kompisar eller familjen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistsPage,
});

type Wishlist = {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  owner_id: string;
  share_slug: string | null;
  created_at: string;
};

function WishlistsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/logga-in", search: { redirect: "/listor" } });
      return;
    }
    load();
  }, [authLoading, user, navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("wishlists" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setLists((data as unknown as Wishlist[]) || []);
    setLoading(false);
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("wishlists" as any).insert({
      owner_id: user.id,
      name: name.trim(),
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setName("");
    toast.success("Listan skapad");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort listan?")) return;
    const { error } = await supabase.from("wishlists" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-serif text-3xl text-foreground">Mina listor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Samla stugor i hemliga listor och bjud in gruppen att rösta och kommentera.
        </p>

        <form onSubmit={create} className="mt-6 flex gap-2 rounded-2xl border border-border bg-background p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. Åre-helgen 2026"
            maxLength={100}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ny lista
          </button>
        </form>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
            </div>
          ) : lists.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Du har inga listor ännu. Skapa en ovan.
            </p>
          ) : (
            <ul className="grid gap-3">
              {lists.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
                  <Link to="/listor/$id" params={{ id: l.id }} className="flex-1">
                    <div className="font-serif text-lg text-foreground">{l.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {l.is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {l.is_private ? "Privat" : "Delad"}
                      <Users className="ml-2 h-3 w-3" />
                      {l.owner_id === user?.id ? "Din lista" : "Medlem"}
                    </div>
                  </Link>
                  {l.owner_id === user?.id && (
                    <button
                      onClick={() => remove(l.id)}
                      className="ml-3 rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Ta bort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}