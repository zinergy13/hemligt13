import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  getAccountingReport,
  buildCsv,
  buildSie4,
  syncInvoiceToFortnox,
  fortnoxStatus,
  type AccountingInvoice,
} from '@/lib/accounting.functions'

export const Route = createFileRoute('/admin/bokforing')({
  head: () => ({ meta: [{ title: 'Bokföring — Fjällportalen' }] }),
  component: BookkeepingPage,
})

function formatKr(ore: number) {
  return (ore / 100).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr'
}

function download(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function BookkeepingPage() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const fetchReport = useServerFn(getAccountingReport)
  const runSync = useServerFn(syncInvoiceToFortnox)
  const checkFortnox = useServerFn(fortnoxStatus)

  const currentYear = new Date().getFullYear()
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3)
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState<number>(currentQ)
  const [report, setReport] = useState<Awaited<ReturnType<typeof getAccountingReport>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [fortnoxConnected, setFortnoxConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/logga-in', search: { redirect: '/admin/bokforing' } })
  }, [loading, user, navigate])

  const load = async () => {
    setBusy(true)
    try {
      const [r, f] = await Promise.all([
        fetchReport({ data: { year, quarter } }),
        checkFortnox().catch(() => ({ connected: false })),
      ])
      setReport(r)
      setFortnoxConnected(f.connected)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kunde inte hämta rapport')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (isAdmin) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, year, quarter])

  const periodLabel = useMemo(() => `Q${quarter} ${year}`, [year, quarter])

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-serif text-3xl text-foreground">Endast för admin</h1>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Till startsidan
        </Link>
      </div>
    )
  }

  const doCsv = () => {
    if (!report) return
    const csv = buildCsv(report.invoices)
    download(`fjallportalen-bokforing-${year}-Q${quarter}.csv`, 'text/csv', csv)
  }

  const doSie = () => {
    if (!report) return
    const sie = buildSie4({
      invoices: report.invoices,
      period: report.period,
      companyName: 'Fjällportalen',
    })
    download(`fjallportalen-${year}-Q${quarter}.se`, 'application/octet-stream', sie)
  }

  const doSync = async (inv: AccountingInvoice) => {
    if (!fortnoxConnected) {
      toast.error('Fortnox är inte anslutet. Konfigurera tokens först.')
      return
    }
    setSyncingId(inv.id)
    try {
      const res = await runSync({ data: { invoiceId: inv.id } })
      toast.success(`Skickat till Fortnox (dok #${res.documentNumber ?? '—'})`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fortnox-synk misslyckades')
    } finally {
      setSyncingId(null)
    }
  }

  const t = report?.totals

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Tillbaka till admin
      </Link>
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bokföring</h1>
      <p className="mt-1 text-sm text-muted-foreground">Momsrapport, CSV/SIE4-export och Fortnox-synk.</p>

      {/* Period picker */}
      <div className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">År</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = currentYear - i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Kvartal</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  quarter === q ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-muted'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={doCsv}
            disabled={!report || report.invoices.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={doSie}
            disabled={!report || report.invoices.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> SIE4
          </button>
        </div>
      </div>

      {/* VAT summary */}
      {report && (
        <div className="mt-6 rounded-3xl border border-border bg-background p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl text-foreground">Momsrapport {periodLabel}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {report.period.start} – {report.period.end} · {report.invoices.length} fakturor
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Kommission netto" value={formatKr(t!.commission_net)} />
            <Stat label="Tilläggstjänster netto" value={formatKr(t!.extras_net)} />
            <Stat label="Utgående moms 25%" value={formatKr(t!.vat_amount)} highlight />
            <Stat label="Total omsättning (inkl. moms)" value={formatKr(t!.total_amount)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Stat label="Betalt under perioden" value={formatKr(t!.paid_amount)} sub="konto 1930" />
            <Stat label="Öppna fordringar" value={formatKr(t!.open_amount)} sub="konto 1510" />
          </div>
          <details className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Skatteverket ruta-guide</summary>
            <ul className="mt-2 space-y-1">
              <li><strong>05</strong> Momspliktig försäljning: <strong>{formatKr(t!.commission_net + t!.extras_net)}</strong></li>
              <li><strong>10</strong> Utgående moms 25%: <strong>{formatKr(t!.vat_amount)}</strong></li>
            </ul>
          </details>
        </div>
      )}

      {/* Fortnox */}
      <div className="mt-6 rounded-3xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl text-foreground">Fortnox</h2>
              {fortnoxConnected === null ? null : fortnoxConnected ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">Ansluten</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">Ej ansluten</span>
              )}
            </div>
            {!fortnoxConnected && (
              <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
                Lägg till hemligheterna <code>FORTNOX_ACCESS_TOKEN</code> och <code>FORTNOX_CLIENT_SECRET</code> i projektinställningarna. Skapa dem i Fortnox → Inställningar → Integrationer.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice table */}
      {report && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Faktura</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Värd</th>
                <th className="px-4 py-3 font-medium">Netto</th>
                <th className="px-4 py-3 font-medium">Moms</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fortnox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {report.invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Inga fakturor under perioden.
                  </td>
                </tr>
              ) : (
                report.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.issued_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">{inv.host_name ?? '—'}</td>
                    <td className="px-4 py-3">{formatKr(inv.commission_net + inv.extras_net)}</td>
                    <td className="px-4 py-3">{formatKr(inv.vat_amount)}</td>
                    <td className="px-4 py-3 font-medium">{formatKr(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'overdue' ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => doSync(inv)}
                        disabled={syncingId === inv.id || !fortnoxConnected}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-40"
                      >
                        {syncingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Skicka
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-xl text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}