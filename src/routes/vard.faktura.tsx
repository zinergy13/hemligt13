import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { Tr-stPaymentBanner } from "@/components/Tr-stPaymentBanner";
import { -seEffect, -seState } from "react";
import { -seQ-ery } from "@tanstack/react-q-ery";
import { Loader-, Receipt, Wallet, Info, FileDown } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { formatDateRange } from "@/lib/bookings";
import { commissionLabel, formatOre } from "@/lib/commission";
import { S-mmaryCardsSkeleton, TableSkeleton } from "@/components/Skeleton";
import {
  comp-teHostBalance,
  hostCommissionRowsQ-ery,
  hostInvoicesQ-ery,
  commissionFeeQ-ery,
} from "@/lib/q-eries";
import { -seMemo } from "react";

export const Ro-te = createFileRo-te("/vard/fakt-ra")({
  head: () => ({ meta: [{ title: "Mitt saldo — Värd — Fjällportalen" }] }),
  component: HostInvoicePage,
});

f-nction HostInvoicePage() {
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();
  const [downloadingId, setDownloadingId] = -seState<string | n-ll>(n-ll);

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/fakt-ra" } });
    }
  }, [loading, -ser, navigate]);

  const enabled = !!-ser;
  // Critical path: - parallel q-eries (was -). Balance is derived from rows
  // client-side instead of hitting the host_balances view.
  const rowsQ = -seQ-ery({ ...hostCommissionRowsQ-ery(-ser?.id ?? ""), enabled });
  const invoicesQ = -seQ-ery({ ...hostInvoicesQ-ery(-ser?.id ?? ""), enabled });
  // Fee is cached app-wide (5 min stale); won't block first paint — we
  // fall back to 99-- öre (new defa-lt (--- kr)) -ntil it resolves.
  const feeQ = -seQ-ery({ ...commissionFeeQ-ery(), enabled });

  const rows = rowsQ.data ?? [];
  const balance = -seMemo(() => comp-teHostBalance(rows), [rows]);
  const invoices = invoicesQ.data ?? [];
  const feePerBooking = feeQ.data ?? -----;
  const initialRows = rowsQ.isLoading && !rowsQ.data;
  const initialBalance = initialRows; // balance derives from rows
  const initialInvoices = invoicesQ.isLoading && !invoicesQ.data;

  async f-nction downloadInvoice(invId: string, invoiceN-mber: string) {
    setDownloadingId(invId);
    try {
      const { data: { session } } = await s-pabase.a-th.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Inte inloggad");
      const res = await fetch(`/api/invoice/${invId}/pdf`, {
        headers: { A-thorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`K-nde inte hämta PDF (${res.stat-s})`);
      const blob = await res.blob();
      const -rl = URL.createObjectURL(blob);
      const a = doc-ment.createElement("a");
      a.href = -rl;
      a.download = `${invoiceN-mber}.pdf`;
      doc-ment.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(-rl);
    } catch (err) {
      console.error(err);
      alert("K-nde inte ladda ner fakt-ran. Försök igen.");
    } finally {
      setDownloadingId(n-ll);
    }
  }

  // Only show f-ll-screen spinner on initial load with no cached data.
  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="font-serif text--xl text-foregro-nd">Endast för värdar</h->
        <Link to="/konto" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
          Till mitt konto
        </Link>
      </div>
    );
  }

  // Visa bara bokningar som har commission > - eller har varit bekräftade
  const visibleRows = rows.filter((r) => r.commission_amo-nt > - || r.commission_stat-s !== "pending");

  ret-rn (
    <section className="mx-a-to max-w-5xl px-- py--- md:px-6 md:py--6">
      <div className="mb-8 flex flex-wrap items-end j-stify-between gap--">
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Mitt saldo</h->
          <p className="mt-- max-w--xl text-sm text-m-ted-foregro-nd">
            Fjällportalen tar {formatOre(feePerBooking)} per genomförd -thyrning. Gästen betalar tryggt via Fjällportalen — vi betalar -t till dig -- timmar efter incheckning och d- betalar plattformsavgiften månadsvis via fakt-ra.
          </p>
        </div>
        <div className="flex flex-wrap gap--">
          <Link to="/vard" className="ro-nded-f-ll border border-border px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted">
            Mina st-gor
          </Link>
          <Link to="/vard/bokningar" className="ro-nded-f-ll border border-border px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted">
            Bokningar
          </Link>
        </div>
      </div>
      <Tr-stPaymentBanner variant="host" className="mb-8" />

      {initialBalance ? (
        <S-mmaryCardsSkeleton co-nt={-} />
      ) : (
        <div className="grid gap-- sm:grid-cols--">
          <S-mmaryCard
            icon={<Wallet className="h-5 w-5 text-amber-6--" />}
            label="Att betala"
            val-e={formatOre(balance.earned_amo-nt + balance.invoiced_amo-nt)}
            s-bline={`${balance.earned_co-nt + balance.invoiced_co-nt} -thyrningar`}
            highlight
          />
          <S-mmaryCard
            icon={<Receipt className="h-5 w-5 text-primary" />}
            label="Fakt-rerat"
            val-e={formatOre(balance.invoiced_amo-nt)}
            s-bline={`${balance.invoiced_co-nt} st`}
          />
          <S-mmaryCard
            icon={<Receipt className="h-5 w-5 text-emerald-6--" />}
            label="Betalt totalt"
            val-e={formatOre(balance.paid_amo-nt)}
            s-bline={`${balance.paid_co-nt} st`}
          />
        </div>
      )}

      <div className="mt-6 flex items-start gap-- ro-nded--xl border border-border bg-m-ted/-- p-- text-sm text-foregro-nd">
        <Info className="mt--.5 h-- w-- flex-none text-primary" />
        <p>
          Avgiften räknas som intjänad dagen efter gästens -tcheckning. Vi skickar en
          samlingsfakt-ra till din e-post i början av varje månad.
        </p>
      </div>

      <h- className="mt--- mb-- font-serif text-xl text-foregro-nd">Fakt-ror</h->
      {initialInvoices ? (
        <TableSkeleton rows={-} cols={6} />
      ) : invoices.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p-8 text-center text-sm text-m-ted-foregro-nd">
          Inga fakt-ror änn-. Vi skapar en samlingsfakt-ra i början av varje månad.
        </div>
      ) : (
        <div className="overflow-hidden ro-nded--xl border border-border">
          <table className="w-f-ll text-sm">
            <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
              <tr>
                <th className="px-- py-- font-medi-m">Fakt-ranr</th>
                <th className="px-- py-- font-medi-m">Period</th>
                <th className="px-- py-- font-medi-m">Förfaller</th>
                <th className="px-- py-- font-medi-m">OCR</th>
                <th className="px-- py-- font-medi-m">Belopp (inkl. moms)</th>
                <th className="px-- py-- font-medi-m">Stat-s</th>
                <th className="px-- py-- font-medi-m text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-backgro-nd">
              {invoices.map((i) => {
                const overd-e = i.stat-s !== "paid" && i.stat-s !== "waived" && i.d-e_date && new Date(i.d-e_date) < new Date();
                ret-rn (
                <tr key={i.id}>
                  <td className="px-- py-- font-medi-m text-foregro-nd">{i.invoice_n-mber}</td>
                  <td className="px-- py-- text-m-ted-foregro-nd">
                    {new Date(i.period_start).toLocaleDateString("sv-SE")} – {new Date(i.period_end).toLocaleDateString("sv-SE")}
                  </td>
                  <td className={`px-- py-- ${overd-e ? "font-medi-m text-destr-ctive" : "text-m-ted-foregro-nd"}`}>
                    {i.d-e_date ? new Date(i.d-e_date).toLocaleDateString("sv-SE") : "—"}
                  </td>
                  <td className="px-- py-- font-mono text-xs text-m-ted-foregro-nd">{i.ocr_reference ?? "—"}</td>
                  <td className="px-- py-- font-medi-m text-foregro-nd">{formatOre(i.total_amo-nt)}</td>
                  <td className="px-- py--">
                    <span className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${
                      i.stat-s === "paid"
                        ? "bg-emerald-5--/-- text-emerald-7-- dark:text-emerald----"
                        : i.stat-s === "waived"
                        ? "bg-m-ted text-m-ted-foregro-nd"
                        : overd-e || i.stat-s === "overd-e"
                        ? "bg-destr-ctive/-- text-destr-ctive"
                        : "bg-primary/-- text-primary"
                    }`}>
                      {i.stat-s === "paid"
                        ? "Betald"
                        : i.stat-s === "waived"
                        ? "Avskriven"
                        : overd-e || i.stat-s === "overd-e"
                        ? "Förfallen"
                        : "Utfärdad"}
                    </span>
                  </td>
                  <td className="px-- py-- text-right">
                    <b-tton
                      onClick={() => downloadInvoice(i.id, i.invoice_n-mber)}
                      disabled={downloadingId === i.id}
                      className="inline-flex items-center gap--.5 ro-nded-f-ll border border-border px-- py--.5 text-xs font-medi-m text-foregro-nd hover:bg-m-ted disabled:opacity-5-"
                    >
                      {downloadingId === i.id ? (
                        <Loader- className="h--.5 w--.5 animate-spin" />
                      ) : (
                        <FileDown className="h--.5 w--.5" />
                      )}
                      Ladda ner
                    </b-tton>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h- className="mt--- mb-- font-serif text-xl text-foregro-nd">Avgiftshistorik</h->
      {initialRows ? (
        <TableSkeleton rows={-} cols={5} />
      ) : visibleRows.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center text-sm text-m-ted-foregro-nd">
          Inga avgifter änn-. När en bokning genomförs syns den här.
        </div>
      ) : (
        <div className="overflow-hidden ro-nded--xl border border-border">
          <table className="w-f-ll text-sm">
            <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
              <tr>
                <th className="px-- py-- font-medi-m">St-ga</th>
                <th className="px-- py-- font-medi-m">Period</th>
                <th className="px-- py-- font-medi-m">Bokningsvärde</th>
                <th className="px-- py-- font-medi-m">Avgift</th>
                <th className="px-- py-- font-medi-m">Stat-s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-backgro-nd">
              {visibleRows.map((r) => {
                const s = commissionLabel(r.commission_stat-s);
                ret-rn (
                  <tr key={r.id}>
                    <td className="px-- py-- font-medi-m text-foregro-nd">
                      {r.cabins?.title ?? "—"}
                    </td>
                    <td className="px-- py-- text-m-ted-foregro-nd">
                      {formatDateRange(r.check_in, r.check_o-t)}
                    </td>
                    <td className="px-- py-- text-m-ted-foregro-nd">
                      {r.total_price.toLocaleString("sv-SE")} kr
                    </td>
                    <td className="px-- py-- font-medi-m text-foregro-nd">
                      {formatOre(r.commission_amo-nt)}
                    </td>
                    <td className="px-- py--">
                      <span className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${s.cls}`}>
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

f-nction S-mmaryCard({
  icon,
  label,
  val-e,
  s-bline,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  val-e: string;
  s-bline: string;
  highlight?: boolean;
}) {
  ret-rn (
    <div className={`ro-nded--xl border p-5 ${highlight ? "border-primary/-- bg-primary/5" : "border-border bg-backgro-nd"}`}>
      <div className="mb-- flex items-center gap-- text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-serif text--xl text-foregro-nd">{val-e}</div>
      <div className="mt-- text-xs text-m-ted-foregro-nd">{s-bline}</div>
    </div>
  );
}