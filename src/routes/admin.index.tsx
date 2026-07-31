import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Settings, Receipt, CheckCircle2, XCircle, ShieldAlert, BookOpenCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateRange, type BookingStatus } from "@/lib/bookings";
import { commissionLabel, formatOre, type CommissionStatus } from "@/lib/commission";
import { toast } from "sonner";

type Row = {
  id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_price: number;
  commission_amount: number;
  commission_status: CommissionStatus;
  host_id: string;
  cabins: { title: string } | null;
};

type HostInfo = { id: string; full_name: string | null };

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin - Fjällportalen" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [hosts, setHosts] = useState<Record<string, HostInfo>>({});
  const [fee, setFee] = useState<number>(99);
  const [feeInput, setFeeInput] = useState<string>("99");
  const [savingFee, setSavingFee] = useState(false);
  const [filter, setFilter] = useState<"all" | "earned" | "invoiced" | "paid" | "waived">("earned");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/admin" } });
    }
  }, [loading, user, navigate]);

  const reload = async () => {
    const [{ data: bookings }, { data: settings }] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, check_in, check_out, status, total_price, commission_amount, commission_status, host_id, cabins(title)",
        )
        .gt("commission_amount", 0)
        .order("check_out", { ascending: false }),
      supabase.from("app_settings").select("commission_per_booking").eq("id", 1).maybeSingle(),
    ]);
    const list = ((bookings as unknown) as Row[]) ?? [];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.host_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("public_profiles" as any)
        .select("id, full_name")
        .in("id", ids) as { data: HostInfo[] | null };
      const map: Record<string, HostInfo> = {};
      (profs ?? []).forEach((p) => (map[p.id] = p as HostInfo));
      setHosts(map);
    }

    if (settings?.commission_per_booking) {
      const kr = Math.round(settings.commission_per_booking / 100);
      setFee(kr);
      setFeeInput(String(kr));
    }
  };

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-serif text-3xl text-foreground">Endast för admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du har inte behörighet att se den här sidan.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Till startsidan
        </Link>
      </div>
    );
  }

  const saveFee = async () => {
    const kr = parseInt(feeInput, 10);
    if (Number.isNaN(kr) || kr < 0 || kr > 100000) {
      toast.error("Ange ett giltigt belopp i kronor (0-100000)");
      return;
    }
    setSavingFee(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ commission_per_booking: kr * 100, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingFee(false);
    if (error) {
      toast.error("Kunde inte spara: " + error.message);
      return;
    }
    setFee(kr);
    toast.success("Avgift uppdaterad");
  };

  const updateStatus = async (
    id: string,
    status: CommissionStatus,
  ) => {
    const patch: {
      commission_status: CommissionStatus;
      commission_paid_at?: string;
      commission_invoiced_at?: string;
    } = { commission_status: status };
    if (status === "paid") patch.commission_paid_at = new Date().toISOString();
    if (status === "invoiced") patch.commission_invoiced_at = new Date().toISOString();
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) {
      toast.error("Kunde inte uppdatera: " + error.message);
      return;
    }
    toast.success("Status uppdaterad");
    reload();
  };

  const visible = (rows ?? []).filter((r) =>
    filter === "all" ? true : r.commission_status === filter,
  );

  const totals = (rows ?? []).reduce(
    (acc, r) => {
      if (r.commission_status === "earned") acc.earned += r.commission_amount;
      if (r.commission_status === "invoiced") acc.invoiced += r.commission_amount;
      if (r.commission_status === "paid") acc.paid += r.commission_amount;
      return acc;
    },
    { earned: 0, invoiced: 0, paid: 0 },
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hantera avgifter och fakturastatus för alla värdar.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <BookOpenCheck className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/admin/bokforing"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <BookOpenCheck className="h-4 w-4" /> Bokföring & moms
          </Link>
          <Link
            to="/admin/stadfirmor"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Städfirmor
          </Link>
          <Link
            to="/admin/recensioner"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Moderera recensioner
          </Link>
          <Link
            to="/admin/presentkort"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Presentkort
          </Link>
          <Link
            to="/admin/epost-test"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Testa e-postmallar
          </Link>
          <Link
            to="/admin/epost-status"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            E-poststatus
          </Link>
          <Link
            to="/admin/atkomst"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Åtkomstloggar
          </Link>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-lg text-foreground">Provisionsavgift</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Belopp som tas ut per genomförd uthyrning. Nuvarande: <strong>{fee} kr</strong>
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nytt belopp (kr)
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveFee}
            disabled={savingFee || feeInput === String(fee)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {savingFee ? "Sparar…" : "Spara"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Att betala" value={formatOre(totals.earned)} cls="text-amber-700" />
        <Stat label="Fakturerat" value={formatOre(totals.invoiced)} cls="text-primary" />
        <Stat label="Betalt totalt" value={formatOre(totals.paid)} cls="text-emerald-700" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-foreground" />
        <h2 className="font-serif text-xl text-foreground">Avgifter per bokning</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["earned", "Att betala"],
            ["invoiced", "Fakturerade"],
            ["paid", "Betalda"],
            ["waived", "Avskrivna"],
            ["all", "Alla"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Inga avgifter med den filtreringen.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Värd</th>
                <th className="px-4 py-3 font-medium">Stuga</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Avgift</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Åtgärd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {visible.map((r) => {
                const s = commissionLabel(r.commission_status);
                const host = hosts[r.host_id];
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-foreground">
                      {host?.full_name || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.cabins?.title ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateRange(r.check_in, r.check_out)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatOre(r.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {r.commission_status !== "invoiced" && r.commission_status !== "paid" && (
                          <button
                            onClick={() => updateStatus(r.id, "invoiced")}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            Fakturerad
                          </button>
                        )}
                        {r.commission_status !== "paid" && (
                          <button
                            onClick={() => updateStatus(r.id, "paid")}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Betald
                          </button>
                        )}
                        {r.commission_status !== "waived" && (
                          <button
                            onClick={() => updateStatus(r.id, "waived")}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                          >
                            <XCircle className="h-3 w-3" />
                            Skriv av
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-serif text-2xl ${cls}`}>{value}</div>
    </div>
  );
}
