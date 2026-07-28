import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ArrowLeft, Gift, Ban } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/presentkort")({
  head: () => ({
    meta: [
      { title: "Presentkort - Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGiftCardsPage,
});

function randomCode(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s.match(/.{1,4}/g)!.join("-");
}

function AdminGiftCardsPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("500");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, [authLoading, user]);

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gift_cards" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setCards((data as any[]) || []);
    setLoading(false);
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const kr = parseInt(amount, 10);
    if (!kr || kr <= 0) { toast.error("Ange giltigt belopp i kronor"); return; }
    setCreating(true);
    const code = randomCode();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("gift_cards" as any).insert({
      code,
      amount_ore: kr * 100,
      issued_to_email: email.trim() || null,
      issued_to_name: name.trim() || null,
      message: message.trim() || null,
      created_by: user?.id,
      expires_at: expiresAt,
    });
    if (error) { setCreating(false); toast.error(error.message); return; }

    const recipient = email.trim();
    if (recipient) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/lovable/email/transactional/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            templateName: "gift-card",
            recipientEmail: recipient,
            idempotencyKey: `gift-card-${code}`,
            templateData: {
              recipientName: name.trim() || undefined,
              code,
              amountKr: kr,
              expiresAt: new Date(expiresAt).toLocaleDateString("sv-SE"),
              message: message.trim() || undefined,
            },
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body?.success === false) {
          toast.success(`Presentkort skapat: ${code}`);
          toast.error(`Kunde inte skicka e-post: ${body?.error || body?.reason || res.statusText}`);
        } else {
          toast.success(`Presentkort skapat och skickat till ${recipient}`);
        }
      } catch (err: any) {
        toast.success(`Presentkort skapat: ${code}`);
        toast.error(`E-post kunde inte skickas: ${err?.message ?? "okänt fel"}`);
      }
    } else {
      toast.success(`Presentkort skapat: ${code}`);
    }

    setCreating(false);
    setEmail(""); setName(""); setMessage("");
    void load();
  };

  const voidCard = async (id: string) => {
    if (!confirm("Ogiltigförklara detta presentkort?")) return;
    const { error } = await supabase.from("gift_cards" as any).update({ status: "void" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    void load();
  };

  if (authLoading || isAdmin === null) return (<><Header /><main className="mx-auto max-w-4xl px-4 py-10"><Loader2 className="h-4 w-4 animate-spin" /></main><Footer /></>);
  if (!isAdmin) return (<><Header /><main className="mx-auto max-w-4xl px-4 py-10"><p className="text-sm text-muted-foreground">Endast för administratörer.</p></main><Footer /></>);

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-8 md:px-6">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-foreground">
          <Gift className="h-7 w-7 text-primary" /> Presentkort
        </h1>

        <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground">Belopp (kr)</span>
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground">Mottagarens e-post (valfritt)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-foreground">Mottagarens namn (valfritt)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-foreground">Hälsning (valfritt)</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <button type="submit" disabled={creating} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />} Skapa presentkort
          </button>
        </form>

        <div className="mt-10">
          <h2 className="mb-3 font-serif text-xl text-foreground">Utfärdade presentkort</h2>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga presentkort ännu.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Kod</th>
                    <th className="px-3 py-2 text-right">Belopp</th>
                    <th className="px-3 py-2 text-right">Använt</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Utgår</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono">{c.code}</td>
                      <td className="px-3 py-2 text-right">{(c.amount_ore / 100).toLocaleString("sv-SE")} kr</td>
                      <td className="px-3 py-2 text-right">{(c.redeemed_ore / 100).toLocaleString("sv-SE")} kr</td>
                      <td className="px-3 py-2">{c.status}</td>
                      <td className="px-3 py-2">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("sv-SE") : "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {c.status === "active" && (
                          <button onClick={() => voidCard(c.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                            <Ban className="h-3 w-3" /> Ogiltig
                          </button>
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