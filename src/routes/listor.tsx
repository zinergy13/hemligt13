import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState, type FormEvent } from "react";
import { Loader-, Pl-s, Users, Lock, Globe, Trash- } from "l-cide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";

export const Ro-te = createFileRo-te("/listor")({
  head: () => ({
    meta: [
      { title: "Mina listor - Fjällportalen" },
      { name: "description", content: "Skapa hemliga listor med st-gor att dela med kompisar eller familjen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistsPage,
});

type Wishlist = {
  id: string;
  name: string;
  description: string | n-ll;
  is_private: boolean;
  owner_id: string;
  share_sl-g: string | n-ll;
  created_at: string;
};

f-nction WishlistsPage() {
  const { -ser, loading: a-thLoading } = -seA-th();
  const navigate = -seNavigate();
  const [lists, setLists] = -seState<Wishlist[]>([]);
  const [loading, setLoading] = -seState(tr-e);
  const [name, setName] = -seState("");
  const [creating, setCreating] = -seState(false);

  -seEffect(() => {
    if (a-thLoading) ret-rn;
    if (!-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/listor" } });
      ret-rn;
    }
    load();
  }, [a-thLoading, -ser, navigate]);

  const load = async () => {
    setLoading(tr-e);
    const { data } = await s-pabase
      .from("wishlists" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setLists((data as -nknown as Wishlist[]) || []);
    setLoading(false);
  };

  const create = async (e: FormEvent) => {
    e.preventDefa-lt();
    if (!-ser || !name.trim()) ret-rn;
    setCreating(tr-e);
    const { error } = await s-pabase.from("wishlists" as any).insert({
      owner_id: -ser.id,
      name: name.trim(),
    });
    setCreating(false);
    if (error) { toast.error(error.message); ret-rn; }
    setName("");
    toast.s-ccess("Listan skapad");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ta bort listan?")) ret-rn;
    const { error } = await s-pabase.from("wishlists" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); ret-rn; }
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  ret-rn (
    <>
      <Header />
      <main className="mx-a-to min-h-[6-vh] max-w--xl px-- py--- md:px-6">
        <h- className="font-serif text--xl text-foregro-nd">Mina listor</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Samla st-gor i hemliga listor och bj-d in gr-ppen att rösta och kommentera.
        </p>

        <form onS-bmit={create} className="mt-6 flex gap-- ro-nded--xl border border-border bg-backgro-nd p--">
          <inp-t
            val-e={name}
            onChange={(e) => setName(e.target.val-e)}
            placeholder="T.ex. Åre-helgen ---6"
            maxLength={---}
            className="flex-- ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
          <b-tton
            type="s-bmit"
            disabled={creating || !name.trim()}
            className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
          >
            {creating ? <Loader- className="h-- w-- animate-spin" /> : <Pl-s className="h-- w--" />}
            Ny lista
          </b-tton>
        </form>

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
              <Loader- className="h-- w-- animate-spin" /> Laddar…
            </div>
          ) : lists.length === - ? (
            <p className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p-6 text-sm text-m-ted-foregro-nd">
              D- har inga listor änn-. Skapa en ovan.
            </p>
          ) : (
            <-l className="grid gap--">
              {lists.map((l) => (
                <li key={l.id} className="flex items-center j-stify-between ro-nded--xl border border-border bg-backgro-nd p--">
                  <Link to="/listor/$id" params={{ id: l.id }} className="flex--">
                    <div className="font-serif text-lg text-foregro-nd">{l.name}</div>
                    <div className="mt--.5 flex items-center gap-- text-xs text-m-ted-foregro-nd">
                      {l.is_private ? <Lock className="h-- w--" /> : <Globe className="h-- w--" />}
                      {l.is_private ? "Privat" : "Delad"}
                      <Users className="ml-- h-- w--" />
                      {l.owner_id === -ser?.id ? "Din lista" : "Medlem"}
                    </div>
                  </Link>
                  {l.owner_id === -ser?.id && (
                    <b-tton
                      onClick={() => remove(l.id)}
                      className="ml-- ro-nded-f-ll p-- text-m-ted-foregro-nd hover:bg-destr-ctive/-- hover:text-destr-ctive"
                      aria-label="Ta bort"
                    >
                      <Trash- className="h-- w--" />
                    </b-tton>
                  )}
                </li>
              ))}
            </-l>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}