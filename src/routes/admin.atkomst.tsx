import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Denial = {
  id: string;
  occurred_at: string;
  user_id: string | null;
  is_authenticated: boolean;
  source: string;
  resource: string | null;
  operation: string | null;
  code: string | null;
  message: string | null;
  hint: string | null;
  route: string | null;
};

type SelfTest = {
  label: string;
  ok: boolean;
  detail: string;
};

export const Route = createFileRoute("/admin/atkomst")({
  head: () => ({
    meta: [
      { title: "Åtkomstloggar - Fjällportalen admin" },
      { name: "description", content: "Logg över nekad åtkomst (RLS) och självtest av att publicerade stugor syns för utloggade besökare." },
      { property: "og:title", content: "Åtkomstloggar - Fjällportalen admin" },
      { property: "og:description", content: "Se varför stugor inte syns: nekade databasanrop och synlighetstest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccessLogPage,
});

function AccessLogPage() {
  const [rows, setRows] = useState<Denial[] | null>(null);
  const [tests, setTests] = useState<SelfTest[] | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("access_denials" as never)
      .select("id, occurred_at, user_id, is_authenticated, source, resource, operation, code, message, hint, route")
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Kunde inte läsa åtkomstloggen", { description: error.message });
      setRows([]);
      return;
    }
    setRows((data as unknown as Denial[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runSelfTest = async () => {
    setTesting(true);
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    // Färsk klient utan sparad session = samma villkor som en utloggad besökare.
    const anon = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });

    const results: SelfTest[] = [];

    const cabins = await anon.from("cabins").select("id").eq("status", "published").limit(50);
    results.push({
      label: "Utloggad: publicerade stugor",
      ok: !cabins.error,
      detail: cabins.error ? `${cabins.error.code ?? ""} ${cabins.error.message}` : `${cabins.data?.length ?? 0} stugor läsbara`,
    });

    const ids = (cabins.data ?? []).map((c) => c.id);
    if (ids.length) {
      const imgs = await anon.from("cabin_images").select("id").in("cabin_id", ids).limit(50);
      results.push({
        label: "Utloggad: stugbilder",
        ok: !imgs.error,
        detail: imgs.error ? `${imgs.error.code ?? ""} ${imgs.error.message}` : `${imgs.data?.length ?? 0} bilder läsbara`,
      });
    }

    const authed = await supabase.from("cabins").select("id").eq("status", "published").limit(50);
    results.push({
      label: "Inloggad (du): publicerade stugor",
      ok: !authed.error,
      detail: authed.error ? `${authed.error.code ?? ""} ${authed.error.message}` : `${authed.data?.length ?? 0} stugor läsbara`,
    });

    setTests(results);
    setTesting(false);
    if (results.every((r) => r.ok)) toast.success("Allt syns som det ska");
    else toast.error("Synlighetsproblem hittat - se detaljerna");
  };

  const clearLog = async () => {
    const { error } = await supabase.from("access_denials" as never).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error("Kunde inte rensa loggen", { description: error.message });
    else {
      toast.success("Loggen rensad");
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Tillbaka till admin
      </Link>
      <h1 className="mt-3 flex items-center gap-2 font-serif text-3xl text-foreground">
        <ShieldAlert className="h-7 w-7 text-primary" aria-hidden="true" />
        Åtkomstloggar
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Här samlas databasanrop som nekats (RLS eller saknade rättigheter) - både för utloggade och inloggade besökare.
        Kör synlighetstestet om någon rapporterar att stugor inte syns.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runSelfTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Kör synlighetstest
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Uppdatera
        </button>
        <button
          type="button"
          onClick={() => void clearLog()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Trash2 className="h-4 w-4" /> Rensa logg
        </button>
      </div>

      {tests && (
        <ul className="mt-6 space-y-2">
          {tests.map((t) => (
            <li
              key={t.label}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              {t.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <span>
                <span className="font-medium">{t.label}:</span> {t.detail}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-serif text-xl text-foreground">Senaste nekade anrop</h2>
      {rows === null ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Inga nekade anrop loggade. Det är goda nyheter.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Tid</th>
                <th className="px-3 py-2">Roll</th>
                <th className="px-3 py-2">Resurs</th>
                <th className="px-3 py-2">Kod</th>
                <th className="px-3 py-2">Meddelande</th>
                <th className="px-3 py-2">Sida</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(r.occurred_at).toLocaleString("sv-SE")}
                  </td>
                  <td className="px-3 py-2">{r.is_authenticated ? "Inloggad" : "Utloggad"}</td>
                  <td className="px-3 py-2">
                    {r.operation ? `${r.operation} ` : ""}
                    {r.resource ?? r.source}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.code ?? "-"}</td>
                  <td className="px-3 py-2">{r.message ?? "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.route ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
