import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt, Wallet, Info, FileDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateRange } from "@/lib/bookings";
import { commissionLabel, formatOre } from "@/lib/commission";
import {
  hostBalanceQuery,
  hostCommissionRowsQuery,
  hostInvoicesQuery,
  commissionFeeQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/vard/faktura")({
  head: () => ({ meta: [{ title: "Mitt saldo — Värd — Fjällmys" }] }),
  component: HostInvoicePage,
});

function HostInvoicePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/faktura" } });
    }
  }, [loading, user, navigate]);

  const enabled = !!user;
  const rowsQ = useQuery({ ...hostCommissionRowsQuery(user?.id ?? ""), enabled });
  const balanceQ = useQuery({ ...hostBalanceQuery(user?.id ?? ""), enabled });
  const invoicesQ = useQuery({ ...hostInvoicesQuery(user?.id ?? ""), enabled });
  const feeQ = useQuery({ ...commissionFeeQuery(), enabled });

  const rows = rowsQ.data ?? [];
  const balance = balanceQ.data ?? {
    earned_count: 0,
    earned_amount: 0,
    invoiced_count: 0,
    invoiced_amount: 0,
    paid_count: 0,
    paid_amount: 0,
    total_owed: 0,
  };
  const invoices = invoicesQ.data ?? [];
  const feePerBooking = feeQ.data ?? 9900;
  const initialLoading = rowsQ.isLoading || balanceQ.isLoading;

  async function downloadInvoice(invId: string, invoiceNumber: string) {
    setDownloadingId(invId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Inte inloggad");
      const res = await fetch(`/api/invoice/${invId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Kunde inte hämta PDF (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Kunde inte ladda ner fakturan. Försök igen.");
    } finally {
      setDownloadingId(null);
    }
  }

  // Only show full-screen spinner on initial load with no cached data.
  if (loading || !user || (initialLoading && !rowsQ.data && !balanceQ.data)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Endast för värdar</h1>
        <Link to="/konto" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Till mitt konto
        </Link>
      </div>
    );
  }

  // Visa bara bokningar som har commission > 0 eller har varit bekräftade
  const visibleRows = rows.filter((r) => r.commission_amount > 0 || r.commission_status !== "pending");

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mitt saldo</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Fjällmys tar {formatOre(feePerBooking)} per genomförd uthyrning. Gästen
            betalar dig direkt — du betalar din avgift till Fjällmys månadsvis via faktura.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/vard" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Mina stugor
          </Link>
          <Link to="/vard/bokningar" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Bokningar
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Wallet className="h-5 w-5 text-amber-600" />}
          label="Att betala"
          value={formatOre(balance.earned_amount + balance.invoiced_amount)}
          subline={`${balance.earned_count + balance.invoiced_count} uthyrningar`}
          highlight
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5 text-primary" />}
          label="Fakturerat"
          value={formatOre(balance.invoiced_amount)}
          subline={`${balance.invoiced_count} st`}
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5 text-emerald-600" />}
          label="Betalt totalt"
          value={formatOre(balance.paid_amount)}
          subline={`${balance.paid_count} st`}
        />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-foreground">
        <Info className="mt-0.5 h-4 w-4 flex-none text-primary" />
        <p>
          Avgiften räknas som intjänad dagen efter gästens utcheckning. Vi skickar en
          samlingsfaktura till din e-post i början av varje månad.
        </p>
      </div>

      <h2 className="mt-12 mb-4 font-serif text-xl text-foreground">Fakturor</h2>
      {invoices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Inga fakturor ännu. Vi skapar en samlingsfaktura i början av varje månad.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Fakturanr</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Antal</th>
                <th className="px-4 py-3 font-medium">Belopp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{i.invoice_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(i.period_start).toLocaleDateString("sv-SE")} – {new Date(i.period_end).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{i.booking_count}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatOre(i.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                      i.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : i.status === "waived"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {i.status === "paid" ? "Betald" : i.status === "waived" ? "Avskriven" : "Utfärdad"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => downloadInvoice(i.id, i.invoice_number)}
                      disabled={downloadingId === i.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {downloadingId === i.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5" />
                      )}
                      Ladda ner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 mb-4 font-serif text-xl text-foreground">Avgiftshistorik</h2>
      {visibleRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Inga avgifter ännu. När en bokning genomförs syns den här.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Stuga</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Bokningsvärde</th>
                <th className="px-4 py-3 font-medium">Avgift</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {visibleRows.map((r) => {
                const s = commissionLabel(r.commission_status);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.cabins?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateRange(r.check_in, r.check_out)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.total_price.toLocaleString("sv-SE")} kr
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatOre(r.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${s.cls}`}>
                        {s.label}
                      </span>
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

function SummaryCard({
  icon,
  label,
  value,
  subline,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subline: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subline}</div>
    </div>
  );
}