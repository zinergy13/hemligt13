import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { AlertTriangle, ArrowLeft, Download, FileSpreadsheet, Inbox, Loader2, RefreshCw, Search, Send, ShieldAlert, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { zodValidator, fallback } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import {
  getAccountingReport,
  buildCsv,
  buildSie4,
  syncInvoiceToFortnox,
  fortnoxStatus,
  type AccountingInvoice,
} from '@/lib/accounting.functions'

const searchSchema = z.object({
  q: fallback(z.string(), '').default(''),
  from: fallback(z.string(), '').default(''),
  to: fallback(z.string(), '').default(''),
  status: fallback(z.string(), 'all').default('all'),
  kind: fallback(z.string(), 'all').default('all'),
})

export const Route = createFileRoute('/admin/bokforing')({
  head: () => ({ meta: [{ title: 'Bokföring — Fjällportalen' }] }),
  validateSearch: zodValidator(searchSchema),
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
  const search = Route.useSearch()
  const fetchReport = useServerFn(getAccountingReport)
  const runSync = useServerFn(syncInvoiceToFortnox)
  const checkFortnox = useServerFn(fortnoxStatus)

  const currentYear = new Date().getFullYear()
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3)
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState<number>(currentQ)
  const [report, setReport] = useState<Awaited<ReturnType<typeof getAccountingReport>> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [fortnoxConnected, setFortnoxConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/logga-in', search: { redirect: '/admin/bokforing' } })
  }, [loading, user, navigate])

  const load = async () => {
    setBusy(true)
    setError(null)
    try {
      const [r, f] = await Promise.all([
        fetchReport({ data: { year, quarter } }),
        checkFortnox().catch(() => ({ connected: false })),
      ])
      setReport(r)
      setFortnoxConnected(f.connected)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Kunde inte hämta rapport'
      setError(msg)
      setReport(null)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (isAdmin) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, year, quarter])

  const periodLabel = useMemo(() => `Q${quarter} ${year}`, [year, quarter])

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      to: '/admin/bokforing',
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  const filtered = useMemo(() => {
    if (!report) return [] as AccountingInvoice[]
    const q = search.q.trim().toLowerCase()
    const statusFilter = search.status
    const kindFilter = search.kind
    const from = search.from
    const to = search.to
    return report.invoices.filter((inv) => {
      const day = inv.issued_at.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (kindFilter === 'with_extras' && inv.extras_net <= 0) return false
      if (kindFilter === 'commission_only' && inv.extras_net > 0) return false
      if (q) {
        const hay = [
          inv.invoice_number,
          inv.host_name ?? '',
          inv.ocr_reference ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [report, search])

  const availableStatuses = useMemo(() => {
    const s = new Set<string>()
    for (const inv of report?.invoices ?? []) s.add(inv.status)
    return Array.from(s).sort()
  }, [report])

  const activeFilterCount =
    (search.q ? 1 : 0) +
    (search.from ? 1 : 0) +
    (search.to ? 1 : 0) +
    (search.status !== 'all' ? 1 : 0) +
    (search.kind !== 'all' ? 1 : 0)

  const clearFilters = () =>
    setSearch({ q: '', from: '', to: '', status: 'all', kind: 'all' })

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
    const rows = activeFilterCount > 0 ? filtered : report.invoices
    if (rows.length === 0) return
    const suffix = activeFilterCount > 0 ? '-filtrerad' : ''
    const csv = buildCsv(rows)
    download(`fjallportalen-bokforing-${year}-Q${quarter}${suffix}.csv`, 'text/csv', csv)
  }

  const doSie = () => {
    if (!report) return
    const rows = activeFilterCount > 0 ? filtered : report.invoices
    if (rows.length === 0) return
    const suffix = activeFilterCount > 0 ? '-filtrerad' : ''
    const sie = buildSie4({
      invoices: rows,
      period: report.period,
      companyName: 'Fjällportalen',
    })
    download(`fjallportalen-${year}-Q${quarter}${suffix}.se`, 'application/octet-stream', sie)
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
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Uppdatera
          </button>
          <button
            onClick={doCsv}
            disabled={!report || report.invoices.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV{activeFilterCount > 0 ? ` (${filtered.length})` : ''}
          </button>
          <button
            onClick={doSie}
            disabled={!report || report.invoices.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> SIE4{activeFilterCount > 0 ? ` (${filtered.length})` : ''}
          </button>
        </div>
      </div>

      {/* Search + filters */}
      {report && !error && (
        <div className="mt-4 rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sök</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search.q}
                  onChange={(e) => setSearch({ q: e.target.value })}
                  placeholder="Fakturanr, värd eller OCR…"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Från</label>
              <input
                type="date"
                value={search.from}
                min={report.period.start}
                max={report.period.end}
                onChange={(e) => setSearch({ from: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Till</label>
              <input
                type="date"
                value={search.to}
                min={report.period.start}
                max={report.period.end}
                onChange={(e) => setSearch({ to: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={search.status}
                onChange={(e) => setSearch({ status: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Alla</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Avdelning</label>
              <select
                value={search.kind}
                onChange={(e) => setSearch({ kind: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">Alla</option>
                <option value="commission_only">Endast kommission</option>
                <option value="with_extras">Med tilläggstjänster</option>
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" /> Rensa ({activeFilterCount})
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Visar <strong className="text-foreground">{filtered.length}</strong> av {report.invoices.length} fakturor
            {activeFilterCount > 0 ? ' — export använder filtrerat urval.' : '.'}
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Kunde inte hämta rapporten</div>
              <p className="mt-1 break-words text-xs text-red-800/80">{error}</p>
              <button
                onClick={() => void load()}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Försök igen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {busy && !report && !error && (
        <div className="mt-6 space-y-4">
          <div className="h-40 animate-pulse rounded-3xl border border-border bg-muted/40" />
          <div className="h-24 animate-pulse rounded-3xl border border-border bg-muted/30" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/20" />
          <p className="text-center text-xs text-muted-foreground">Hämtar rapport för {periodLabel}…</p>
        </div>
      )}

      {/* Empty state — no report loaded yet and not busy/erroring */}
      {!report && !busy && !error && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-muted/10 p-10 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Ingen rapport laddad. Välj period och klicka på Uppdatera.</p>
        </div>
      )}

      {/* VAT summary */}
      {report && !error && (
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
      {report && !error && (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-6 w-6 text-muted-foreground/70" />
                    {report.invoices.length === 0
                      ? `Inga fakturor under ${periodLabel}. Prova ett annat kvartal.`
                      : 'Inga fakturor matchar sök/filter. Rensa för att se alla.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
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