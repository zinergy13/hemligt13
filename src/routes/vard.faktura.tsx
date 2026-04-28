import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Receipt, Wallet, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateRange, type BookingStatus } from "@/lib/bookings";
import { commissionLabel, formatOre, type CommissionStatus } from "@/lib/commission";

type Row = {
  id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_price: number;
  commission_amount: number;
  commission_status: CommissionStatus;
  commission_earned_at: string | null;
  commission_invoiced_at: string | null;
  commission_paid_at: string | null;
  cabins: { title: string; slug: string } | null;
};

type Balance = {
  earned_count: number;
  earned_amount: number;
  invoiced_count: number;
  invoiced_amount: number;
  paid_count: number;
  paid_amount: number;
  total_owed: number;
};

export const Route = createFileRoute("/vard/faktura")({
  head: () => ({ meta: [{ title: "Mitt saldo — Värd — Fjällmys" }] }),
  component: HostInvoicePage,
});

function HostInvoicePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [feePerBooking, setFeePerBooking] = useState<number>(9900);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/faktura" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: bookings }, { data: bal }, { data: settings }] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, check_in, check_out, status, total_price, commission_amount, commission_status, commission_earned_at, commission_invoiced_at, commission_paid_at, cabins(title, slug)",
          )
          .eq("host_id", user.id)
          .order("check_out", { ascending: false }),
        supabase
          .from("host_balances")
          .select("*")
          .eq("host_id", user.id)
          .maybeSingle(),
        supabase.from("app_settings").select("commission_per_booking").eq("id", 1).maybeSingle(),
      ]);
      if (!active) return;
      setRows(((bookings as unknown) as Row[]) ?? []);
      setBalance(
        bal
          ? ({
              earned_count: bal.earned_count ?? 0,
              earned_amount: bal.earned_amount ?? 0,
              invoiced_count: bal.invoiced_count ?? 0,
              invoiced_amount: bal.invoiced_amount ?? 0,
              paid_count: bal.paid_count ?? 0,
              paid_amount: bal.paid_amount ?? 0,
              total_owed: bal.total_owed ?? 0,
            } as Balance)
          : {
              earned_count: 0,
              earned_amount: 0,
              invoiced_count: 0,
              invoiced_amount: 0,
              paid_count: 0,
              paid_amount: 0,
              total_owed: 0,
            },
      );
      if (settings?.commission_per_booking) setFeePerBooking(settings.commission_per_booking);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user || rows === null || balance === null) {
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