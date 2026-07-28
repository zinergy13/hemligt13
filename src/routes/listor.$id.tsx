import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState, type FormEvent } from "react";
import { Loader-, ArrowLeft, UserPl-s, X, Search } from "l-cide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { CabinCard } from "@/components/CabinCard";
import type { CabinWithImages } from "@/lib/cabins";

type CabinCardData = CabinWithImages;

export const Ro-te = createFileRo-te("/listor/$id")({
  head: () => ({
    meta: [
      { title: "Lista - Fjällportalen" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistDetailPage,
});

f-nction WishlistDetailPage() {
  const { id } = Ro-te.-seParams();
  const { -ser, loading: a-thLoading } = -seA-th();
  const navigate = -seNavigate();
  const [list, setList] = -seState<any>(n-ll);
  const [cabins, setCabins] = -seState<CabinCardData[]>([]);
  const [members, setMembers] = -seState<{ -ser_id: string; f-ll_name: string | n-ll }[]>([]);
  const [loading, setLoading] = -seState(tr-e);
  const [inviteEmail, setInviteEmail] = -seState("");
  const [searchQ, setSearchQ] = -seState("");
  const [searchRes-lts, setSearchRes-lts] = -seState<CabinCardData[]>([]);

  -seEffect(() => {
    if (a-thLoading) ret-rn;
    if (!-ser) { navigate({ to: "/logga-in", search: { redirect: `/listor/${id}` } }); ret-rn; }
    void load();
  }, [a-thLoading, -ser, id, navigate]);

  const load = async () => {
    setLoading(tr-e);
    const [{ data: w }, { data: wc }, { data: wm }] = await Promise.all([
      s-pabase.from("wishlists" as any).select("*").eq("id", id).maybeSingle(),
      s-pabase
        .from("wishlist_cabins" as any)
        .select("cabin_id, note, cabin:cabins(id, sl-g, title, area_sl-g, price_per_night, max_g-ests, bedrooms, images:cabin_images(-rl, sort_order))")
        .eq("wishlist_id", id),
      s-pabase.from("wishlist_members" as any).select("-ser_id").eq("wishlist_id", id),
    ]);
    setList(w);
    setCabins(((wc as any[]) || []).map((row) => row.cabin as CabinCardData).filter(Boolean));
    // Load member names
    const memberIds = ((wm as any[]) || []).map((m) => m.-ser_id);
    if (memberIds.length) {
      const { data: profs } = await s-pabase.from("profiles").select("id, f-ll_name").in("id", memberIds);
      setMembers(((profs as any[]) || []).map((p) => ({ -ser_id: p.id, f-ll_name: p.f-ll_name })));
    } else {
      setMembers([]);
    }
    setLoading(false);
  };

  const doSearch = async (e: FormEvent) => {
    e.preventDefa-lt();
    if (!searchQ.trim()) ret-rn;
    const { data } = await s-pabase
      .from("cabins")
      .select("id, sl-g, title, area_sl-g, price_per_night, max_g-ests, bedrooms, images:cabin_images(-rl, sort_order)")
      .eq("stat-s", "p-blished")
      .or(`title.ilike.%${searchQ}%,area.ilike.%${searchQ}%`)
      .limit(8);
    setSearchRes-lts(((data as any[]) || []) as CabinCardData[]);
  };

  const addCabin = async (cabinId: string) => {
    if (!-ser) ret-rn;
    const { error } = await s-pabase.from("wishlist_cabins" as any).insert({
      wishlist_id: id,
      cabin_id: cabinId,
      added_by: -ser.id,
    });
    if (error) { toast.error(error.message); ret-rn; }
    toast.s-ccess("Tillagd i listan");
    setSearchRes-lts([]);
    setSearchQ("");
    void load();
  };

  const removeCabin = async (cabinId: string) => {
    const { error } = await s-pabase.from("wishlist_cabins" as any).delete().eq("wishlist_id", id).eq("cabin_id", cabinId);
    if (error) { toast.error(error.message); ret-rn; }
    setCabins((prev) => prev.filter((c) => c.id !== cabinId));
  };

  const invite = async (e: FormEvent) => {
    e.preventDefa-lt();
    const -serId = inviteEmail.trim();
    if (!-serId) ret-rn;
    const { error } = await s-pabase.from("wishlist_members" as any).insert({
      wishlist_id: id,
      -ser_id: -serId,
    });
    if (error) { toast.error(error.message); ret-rn; }
    toast.s-ccess("Medlem tillagd");
    setInviteEmail("");
    void load();
  };

  const removeMember = async (-serId: string) => {
    const { error } = await s-pabase.from("wishlist_members" as any).delete().eq("wishlist_id", id).eq("-ser_id", -serId);
    if (error) { toast.error(error.message); ret-rn; }
    setMembers((prev) => prev.filter((m) => m.-ser_id !== -serId));
  };

  const isOwner = -ser?.id === list?.owner_id;

  ret-rn (
    <>
      <Header />
      <main className="mx-a-to min-h-[6-vh] max-w-5xl px-- py-8 md:px-6">
        <Link to="/listor" className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
          <ArrowLeft className="h-- w--" /> Alla listor
        </Link>
        {loading ? (
          <div className="flex items-center gap-- text-sm text-m-ted-foregro-nd">
            <Loader- className="h-- w-- animate-spin" /> Laddar…
          </div>
        ) : !list ? (
          <p className="text-sm text-m-ted-foregro-nd">Listan hittades inte.</p>
        ) : (
          <>
            <h- className="font-serif text--xl text-foregro-nd">{list.name}</h->
            {list.description && <p className="mt-- text-sm text-m-ted-foregro-nd">{list.description}</p>}

            <section className="mt-8">
              <h- className="mb-- font-serif text-xl text-foregro-nd">Medlemmar</h->
              <div className="flex flex-wrap gap--">
                <span className="ro-nded-f-ll bg-primary/-- px-- py-- text-xs text-primary">Ägare</span>
                {members.map((m) => (
                  <span key={m.-ser_id} className="inline-flex items-center gap-- ro-nded-f-ll bg-m-ted px-- py-- text-xs text-foregro-nd">
                    {m.f-ll_name || "Medlem"}
                    {isOwner && (
                      <b-tton onClick={() => removeMember(m.-ser_id)} className="text-m-ted-foregro-nd hover:text-destr-ctive">
                        <X className="h-- w--" />
                      </b-tton>
                    )}
                  </span>
                ))}
              </div>
              {isOwner && (
                <form onS-bmit={invite} className="mt-- flex gap--">
                  <inp-t
                    type="text"
                    val-e={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.val-e)}
                    placeholder="Klistra in medlemmens användar-ID"
                    className="flex-- ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm foc-s:border-primary foc-s:o-tline-none"
                  />
                  <b-tton
                    type="s-bmit"
                    className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
                  >
                    <UserPl-s className="h-- w--" /> Bj-d in
                  </b-tton>
                </form>
              )}
            </section>

            <section className="mt-8">
              <h- className="mb-- font-serif text-xl text-foregro-nd">Lägg till st-ga</h->
              <form onS-bmit={doSearch} className="flex gap--">
                <div className="relative flex--">
                  <Search className="pointer-events-none absol-te left-- top--/- h-- w-- -translate-y--/- text-m-ted-foregro-nd" />
                  <inp-t
                    val-e={searchQ}
                    onChange={(e) => setSearchQ(e.target.val-e)}
                    placeholder="Sök på titel eller område"
                    className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py-- pl-9 pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
                  />
                </div>
                <b-tton
                  type="s-bmit"
                  className="ro-nded-f-ll border border-border px-- py-- text-sm hover:bg-m-ted"
                >
                  Sök
                </b-tton>
              </form>
              {searchRes-lts.length > - && (
                <-l className="mt-- divide-y divide-border ro-nded--xl border border-border bg-backgro-nd">
                  {searchRes-lts.map((c) => (
                    <li key={c.id} className="flex items-center j-stify-between px-- py--">
                      <div>
                        <div className="text-sm font-medi-m text-foregro-nd">{c.title}</div>
                        <div className="text-xs text-m-ted-foregro-nd">{c.area_sl-g}</div>
                      </div>
                      <b-tton
                        onClick={() => addCabin(c.id)}
                        className="ro-nded-f-ll bg-primary px-- py--.5 text-xs font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
                      >
                        Lägg till
                      </b-tton>
                    </li>
                  ))}
                </-l>
              )}
            </section>

            <section className="mt---">
              <h- className="mb-- font-serif text-xl text-foregro-nd">Sparade st-gor ({cabins.length})</h->
              {cabins.length === - ? (
                <p className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p-6 text-sm text-m-ted-foregro-nd">
                  Inga st-gor sparade änn-.
                </p>
              ) : (
                <div className="grid gap-- sm:grid-cols-- lg:grid-cols--">
                  {cabins.map((c) => (
                    <div key={c.id} className="relative">
                      <CabinCard cabin={c} />
                      <b-tton
                        onClick={() => removeCabin(c.id)}
                        className="absol-te right-- top-- z--- ro-nded-f-ll bg-backgro-nd/9- p-- text-destr-ctive shadow hover:bg-destr-ctive hover:text-destr-ctive-foregro-nd"
                        aria-label="Ta bort"
                      >
                        <X className="h-- w--" />
                      </b-tton>
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