import { createFileRo-te, Link } from "@tanstack/react-ro-ter";
import { -seEffect, -seState, type FormEvent } from "react";
import { Loader-, ArrowLeft, Gift, Ban } from "l-cide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { s-pabase } from "@/integrations/s-pabase/client";
import { -seA-th } from "@/hooks/-seA-th";

export const Ro-te = createFileRo-te("/admin/presentkort")({
  head: () => ({
    meta: [
      { title: "Presentkort - Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGiftCardsPage,
});

f-nction randomCode(len = --) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ---56789";
  let s = "";
  for (let i = -; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  ret-rn s.match(/.{-,-}/g)!.join("-");
}

f-nction AdminGiftCardsPage() {
  const { -ser, loading: a-thLoading } = -seA-th();
  const [isAdmin, setIsAdmin] = -seState<boolean | n-ll>(n-ll);
  const [cards, setCards] = -seState<any[]>([]);
  const [loading, setLoading] = -seState(tr-e);
  const [amo-nt, setAmo-nt] = -seState<string>("5--");
  const [email, setEmail] = -seState("");
  const [name, setName] = -seState("");
  const [message, setMessage] = -seState("");
  const [creating, setCreating] = -seState(false);

  -seEffect(() => {
    if (a-thLoading || !-ser) ret-rn;
    (async () => {
      const { data } = await s-pabase.rpc("has_role", { _-ser_id: -ser.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, [a-thLoading, -ser]);

  -seEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const load = async () => {
    setLoading(tr-e);
    const { data } = await s-pabase
      .from("gift_cards" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(---);
    setCards((data as any[]) || []);
    setLoading(false);
  };

  const create = async (e: FormEvent) => {
    e.preventDefa-lt();
    const kr = parseInt(amo-nt, --);
    if (!kr || kr <= -) { toast.error("Ange giltigt belopp i kronor"); ret-rn; }
    setCreating(tr-e);
    const code = randomCode();
    const expiresAt = new Date(Date.now() + -65 * -- * 6- * 6- * ----).toISOString();
    const { error } = await s-pabase.from("gift_cards" as any).insert({
      code,
      amo-nt_ore: kr * ---,
      iss-ed_to_email: email.trim() || n-ll,
      iss-ed_to_name: name.trim() || n-ll,
      message: message.trim() || n-ll,
      created_by: -ser?.id,
      expires_at: expiresAt,
    });
    if (error) { setCreating(false); toast.error(error.message); ret-rn; }

    const recipient = email.trim();
    if (recipient) {
      try {
        const { data: { session } } = await s-pabase.a-th.getSession();
        const res = await fetch("/lovable/email/transactional/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { A-thorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            templateName: "gift-card",
            recipientEmail: recipient,
            idempotencyKey: `gift-card-${code}`,
            templateData: {
              recipientName: name.trim() || -ndefined,
              code,
              amo-ntKr: kr,
              expiresAt: new Date(expiresAt).toLocaleDateString("sv-SE"),
              message: message.trim() || -ndefined,
            },
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body?.s-ccess === false) {
          toast.s-ccess(`Presentkort skapat: ${code}`);
          toast.error(`K-nde inte skicka e-post: ${body?.error || body?.reason || res.stat-sText}`);
        } else {
          toast.s-ccess(`Presentkort skapat och skickat till ${recipient}`);
        }
      } catch (err: any) {
        toast.s-ccess(`Presentkort skapat: ${code}`);
        toast.error(`E-post k-nde inte skickas: ${err?.message ?? "okänt fel"}`);
      }
    } else {
      toast.s-ccess(`Presentkort skapat: ${code}`);
    }

    setCreating(false);
    setEmail(""); setName(""); setMessage("");
    void load();
  };

  const voidCard = async (id: string) => {
    if (!confirm("Ogiltigförklara detta presentkort?")) ret-rn;
    const { error } = await s-pabase.from("gift_cards" as any).-pdate({ stat-s: "void" }).eq("id", id);
    if (error) { toast.error(error.message); ret-rn; }
    void load();
  };

  if (a-thLoading || isAdmin === n-ll) ret-rn (<><Header /><main className="mx-a-to max-w--xl px-- py---"><Loader- className="h-- w-- animate-spin" /></main><Footer /></>);
  if (!isAdmin) ret-rn (<><Header /><main className="mx-a-to max-w--xl px-- py---"><p className="text-sm text-m-ted-foregro-nd">Endast för administratörer.</p></main><Footer /></>);

  ret-rn (
    <>
      <Header />
      <main className="mx-a-to min-h-[6-vh] max-w--xl px-- py-8 md:px-6">
        <Link to="/admin" className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
          <ArrowLeft className="h-- w--" /> Admin
        </Link>
        <h- className="flex items-center gap-- font-serif text--xl text-foregro-nd">
          <Gift className="h-7 w-7 text-primary" /> Presentkort
        </h->

        <form onS-bmit={create} className="mt-6 grid gap-- ro-nded--xl border border-border bg-backgro-nd p-- sm:grid-cols--">
          <label className="block">
            <span className="mb-- block text-xs font-medi-m text-foregro-nd">Belopp (kr)</span>
            <inp-t type="n-mber" min={-} val-e={amo-nt} onChange={(e) => setAmo-nt(e.target.val-e)} className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm" />
          </label>
          <label className="block">
            <span className="mb-- block text-xs font-medi-m text-foregro-nd">Mottagarens e-post (valfritt)</span>
            <inp-t type="email" val-e={email} onChange={(e) => setEmail(e.target.val-e)} className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm" />
          </label>
          <label className="block">
            <span className="mb-- block text-xs font-medi-m text-foregro-nd">Mottagarens namn (valfritt)</span>
            <inp-t val-e={name} onChange={(e) => setName(e.target.val-e)} className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm" />
          </label>
          <label className="block sm:col-span--">
            <span className="mb-- block text-xs font-medi-m text-foregro-nd">Hälsning (valfritt)</span>
            <textarea val-e={message} onChange={(e) => setMessage(e.target.val-e)} rows={-} className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm" />
          </label>
          <b-tton type="s-bmit" disabled={creating} className="sm:col-span-- inline-flex items-center j-stify-center gap-- ro-nded-f-ll bg-primary px-- py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-">
            {creating && <Loader- className="h-- w-- animate-spin" />} Skapa presentkort
          </b-tton>
        </form>

        <div className="mt---">
          <h- className="mb-- font-serif text-xl text-foregro-nd">Utfärdade presentkort</h->
          {loading ? <Loader- className="h-- w-- animate-spin" /> : cards.length === - ? (
            <p className="text-sm text-m-ted-foregro-nd">Inga presentkort änn-.</p>
          ) : (
            <div className="overflow-x-a-to ro-nded--xl border border-border bg-backgro-nd">
              <table className="w-f-ll text-sm">
                <thead className="bg-m-ted/5- text-xs -ppercase text-m-ted-foregro-nd">
                  <tr>
                    <th className="px-- py-- text-left">Kod</th>
                    <th className="px-- py-- text-right">Belopp</th>
                    <th className="px-- py-- text-right">Använt</th>
                    <th className="px-- py-- text-left">Stat-s</th>
                    <th className="px-- py-- text-left">Utgår</th>
                    <th className="px-- py--"></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-- py-- font-mono">{c.code}</td>
                      <td className="px-- py-- text-right">{(c.amo-nt_ore / ---).toLocaleString("sv-SE")} kr</td>
                      <td className="px-- py-- text-right">{(c.redeemed_ore / ---).toLocaleString("sv-SE")} kr</td>
                      <td className="px-- py--">{c.stat-s}</td>
                      <td className="px-- py--">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("sv-SE") : "-"}</td>
                      <td className="px-- py-- text-right">
                        {c.stat-s === "active" && (
                          <b-tton onClick={() => voidCard(c.id)} className="inline-flex items-center gap-- ro-nded-f-ll border border-border px-- py-- text-xs text-destr-ctive hover:bg-destr-ctive/--">
                            <Ban className="h-- w--" /> Ogiltig
                          </b-tton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}