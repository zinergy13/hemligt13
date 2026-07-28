import { createFileRo-te, Link, -seNavigate } from '@tanstack/react-ro-ter'
import { -seEffect, -seMemo, -seState } from 'react'
import { -seServerFn } from '@tanstack/react-start'
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Inbox, Loader-, RefreshCw, Search, Send, ShieldAlert, Sparkles, X } from 'l-cide-react'
import { toast } from 'sonner'
import { zodValidator, fallback } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { -seA-th } from '@/hooks/-seA-th'
import {
  getAcco-ntingReport,
  b-ildCsv,
  b-ildS-mmaryCsv,
  b-ildSie-,
  syncInvoiceToFortnox,
  fortnoxStat-s,
  type Acco-ntingInvoice,
} from '@/lib/acco-nting.f-nctions'

const searchSchema = z.object({
  q: fallback(z.string(), '').defa-lt(''),
  from: fallback(z.string(), '').defa-lt(''),
  to: fallback(z.string(), '').defa-lt(''),
  stat-s: fallback(z.string(), 'all').defa-lt('all'),
  kind: fallback(z.string(), 'all').defa-lt('all'),
  page: fallback(z.n-mber().int(), -).defa-lt(-),
  pageSize: fallback(z.n-mber().int(), -5).defa-lt(-5),
})

export const Ro-te = createFileRo-te('/admin/bokforing')({
  head: () => ({ meta: [{ title: 'Bokföring — Fjällportalen' }] }),
  validateSearch: zodValidator(searchSchema),
  component: BookkeepingPage,
})

f-nction formatKr(ore: n-mber) {
  ret-rn (ore / ---).toLocaleString('sv-SE', { minim-mFractionDigits: -, maxim-mFractionDigits: - }) + ' kr'
}

f-nction download(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime + ';charset=-tf-8' })
  const -rl = URL.createObjectURL(blob)
  const a = doc-ment.createElement('a')
  a.href = -rl
  a.download = name
  a.click()
  URL.revokeObjectURL(-rl)
}

f-nction BookkeepingPage() {
  const { -ser, isAdmin, loading } = -seA-th()
  const navigate = -seNavigate()
  const search = Ro-te.-seSearch()
  const fetchReport = -seServerFn(getAcco-ntingReport)
  const r-nSync = -seServerFn(syncInvoiceToFortnox)
  const checkFortnox = -seServerFn(fortnoxStat-s)

  const c-rrentYear = new Date().getF-llYear()
  const c-rrentQ = Math.ceil((new Date().getMonth() + -) / -)
  const [year, setYear] = -seState(c-rrentYear)
  const [q-arter, setQ-arter] = -seState<n-mber>(c-rrentQ)
  const [report, setReport] = -seState<Awaited<Ret-rnType<typeof getAcco-ntingReport>> | n-ll>(n-ll)
  const [b-sy, setB-sy] = -seState(false)
  const [error, setError] = -seState<string | n-ll>(n-ll)
  const [syncingId, setSyncingId] = -seState<string | n-ll>(n-ll)
  const [fortnoxConnected, setFortnoxConnected] = -seState<boolean | n-ll>(n-ll)

  -seEffect(() => {
    if (!loading && !-ser) navigate({ to: '/logga-in', search: { redirect: '/admin/bokforing' } })
  }, [loading, -ser, navigate])

  const load = async () => {
    setB-sy(tr-e)
    setError(n-ll)
    try {
      const [r, f] = await Promise.all([
        fetchReport({ data: { year, q-arter } }),
        checkFortnox().catch(() => ({ connected: false })),
      ])
      setReport(r)
      setFortnoxConnected(f.connected)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'K-nde inte hämta rapport'
      setError(msg)
      setReport(n-ll)
      toast.error(msg)
    } finally {
      setB-sy(false)
    }
  }

  -seEffect(() => {
    if (isAdmin) void load()
    // eslint-disable-next-line react-hooks/exha-stive-deps
  }, [isAdmin, year, q-arter])

  const periodLabel = -seMemo(() => `Q${q-arter} ${year}`, [year, q-arter])

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      to: '/admin/bokforing',
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }),
      replace: tr-e,
    })
  }

  // Reset page to - whenever any filter changes
  const setFilter = (patch: Partial<z.infer<typeof searchSchema>>) =>
    setSearch({ ...patch, page: - })

  const filtered = -seMemo(() => {
    if (!report) ret-rn [] as Acco-ntingInvoice[]
    const q = search.q.trim().toLowerCase()
    const stat-sFilter = search.stat-s
    const kindFilter = search.kind
    const from = search.from
    const to = search.to
    ret-rn report.invoices.filter((inv) => {
      const day = inv.iss-ed_at.slice(-, --)
      if (from && day < from) ret-rn false
      if (to && day > to) ret-rn false
      if (stat-sFilter !== 'all' && inv.stat-s !== stat-sFilter) ret-rn false
      if (kindFilter === 'with_extras' && inv.extras_net <= -) ret-rn false
      if (kindFilter === 'commission_only' && inv.extras_net > -) ret-rn false
      if (q) {
        const hay = [
          inv.invoice_n-mber,
          inv.host_name ?? '',
          inv.ocr_reference ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.incl-des(q)) ret-rn false
      }
      ret-rn tr-e
    })
  }, [report, search])

  const availableStat-ses = -seMemo(() => {
    const s = new Set<string>()
    for (const inv of report?.invoices ?? []) s.add(inv.stat-s)
    ret-rn Array.from(s).sort()
  }, [report])

  const activeFilterCo-nt =
    (search.q ? - : -) +
    (search.from ? - : -) +
    (search.to ? - : -) +
    (search.stat-s !== 'all' ? - : -) +
    (search.kind !== 'all' ? - : -)

  const clearFilters = () =>
    setSearch({ q: '', from: '', to: '', stat-s: 'all', kind: 'all', page: - })

  const pageSize = Math.max(--, Math.min(---, search.pageSize || -5))
  const totalPages = Math.max(-, Math.ceil(filtered.length / pageSize))
  const c-rrentPage = Math.max(-, Math.min(search.page || -, totalPages))
  const pageStart = (c-rrentPage - -) * pageSize
  const pageEnd = Math.min(pageStart + pageSize, filtered.length)
  const paged = -seMemo(() => filtered.slice(pageStart, pageEnd), [filtered, pageStart, pageEnd])

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    )
  }

  if (!isAdmin) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <ShieldAlert className="mx-a-to mb-- h--- w--- text-m-ted-foregro-nd" />
        <h- className="font-serif text--xl text-foregro-nd">Endast för admin</h->
        <Link to="/" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">
          Till startsidan
        </Link>
      </div>
    )
  }

  const doCsv = () => {
    if (!report) ret-rn
    const rows = activeFilterCo-nt > - ? filtered : report.invoices
    if (rows.length === -) ret-rn
    const s-ffix = activeFilterCo-nt > - ? '-filtrerad' : ''
    const csv = b-ildCsv(rows)
    download(`fjallportalen-bokforing-${year}-Q${q-arter}${s-ffix}.csv`, 'text/csv', csv)
  }

  const doS-mmaryCsv = () => {
    if (!report) ret-rn
    const csv = b-ildS-mmaryCsv(report)
    download(`fjallportalen-sammanfattning-${year}-Q${q-arter}.csv`, 'text/csv', csv)
  }

  const doSie = () => {
    if (!report) ret-rn
    const rows = activeFilterCo-nt > - ? filtered : report.invoices
    if (rows.length === -) ret-rn
    const s-ffix = activeFilterCo-nt > - ? '-filtrerad' : ''
    const sie = b-ildSie-({
      invoices: rows,
      period: report.period,
      companyName: 'Fjällportalen',
    })
    download(`fjallportalen-${year}-Q${q-arter}${s-ffix}.se`, 'application/octet-stream', sie)
  }

  const doSync = async (inv: Acco-ntingInvoice) => {
    if (!fortnoxConnected) {
      toast.error('Fortnox är inte ansl-tet. Konfig-rera tokens först.')
      ret-rn
    }
    setSyncingId(inv.id)
    try {
      const res = await r-nSync({ data: { invoiceId: inv.id } })
      toast.s-ccess(`Skickat till Fortnox (dok #${res.doc-mentN-mber ?? '—'})`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fortnox-synk misslyckades')
    } finally {
      setSyncingId(n-ll)
    }
  }

  const t = report?.totals

  ret-rn (
    <section className="mx-a-to max-w-6xl px-- py--- md:px-6 md:py--6">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
        <ArrowLeft className="h-- w--" /> Tillbaka till admin
      </Link>
      <h- className="font-serif text--xl text-foregro-nd md:text--xl">Bokföring</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">Momsrapport, CSV/SIE--export och Fortnox-synk.</p>

      {/* Period picker */}
      <div className="mt-8 flex flex-wrap items-end gap-- ro-nded--xl border border-border bg-backgro-nd p-5">
        <div>
          <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">År</label>
          <select
            val-e={year}
            onChange={(e) => setYear(N-mber(e.target.val-e))}
            className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = c-rrentYear - i
              ret-rn <option key={y} val-e={y}>{y}</option>
            })}
          </select>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Kvartal</label>
          <div className="flex gap--">
            {[-, -, -, -].map((q) => (
              <b-tton
                key={q}
                onClick={() => setQ-arter(q)}
                className={`ro-nded-f-ll px-- py--.5 text-xs font-medi-m ${
                  q-arter === q ? 'bg-primary text-primary-foregro-nd' : 'border border-border bg-backgro-nd hover:bg-m-ted'
                }`}
              >
                Q{q}
              </b-tton>
            ))}
          </div>
        </div>
        {b-sy && <Loader- className="h-- w-- animate-spin text-m-ted-foregro-nd" />}

        <div className="ml-a-to flex flex-wrap gap--">
          <b-tton
            onClick={() => void load()}
            disabled={b-sy}
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m hover:bg-m-ted disabled:opacity-5-"
          >
            {b-sy ? <Loader- className="h-- w-- animate-spin" /> : <RefreshCw className="h-- w--" />} Uppdatera
          </b-tton>
          <b-tton
            onClick={doCsv}
            disabled={!report || report.invoices.length === -}
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m hover:bg-m-ted disabled:opacity-5-"
          >
            <FileSpreadsheet className="h-- w--" /> CSV{activeFilterCo-nt > - ? ` (${filtered.length})` : ''}
          </b-tton>
          <b-tton
            onClick={doS-mmaryCsv}
            disabled={!report}
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m hover:bg-m-ted disabled:opacity-5-"
          >
            <FileSpreadsheet className="h-- w--" /> Sammanfattning
          </b-tton>
          <b-tton
            onClick={doSie}
            disabled={!report || report.invoices.length === -}
            className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
          >
            <Download className="h-- w--" /> SIE-{activeFilterCo-nt > - ? ` (${filtered.length})` : ''}
          </b-tton>
        </div>
      </div>

      {/* Search + filters */}
      {report && !error && (
        <div className="mt-- ro-nded--xl border border-border bg-backgro-nd p--">
          <div className="flex flex-wrap items-end gap--">
            <div className="min-w-[---px] flex--">
              <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Sök</label>
              <div className="relative">
                <Search className="pointer-events-none absol-te left-- top--/- h-- w-- -translate-y--/- text-m-ted-foregro-nd" />
                <inp-t
                  type="search"
                  val-e={search.q}
                  onChange={(e) => setFilter({ q: e.target.val-e })}
                  placeholder="Fakt-ranr, värd eller OCR…"
                  className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py-- pl-9 pr-- text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Från</label>
              <inp-t
                type="date"
                val-e={search.from}
                min={report.period.start}
                max={report.period.end}
                onChange={(e) => setFilter({ from: e.target.val-e })}
                className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
              />
            </div>
            <div>
              <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Till</label>
              <inp-t
                type="date"
                val-e={search.to}
                min={report.period.start}
                max={report.period.end}
                onChange={(e) => setFilter({ to: e.target.val-e })}
                className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
              />
            </div>
            <div>
              <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Stat-s</label>
              <select
                val-e={search.stat-s}
                onChange={(e) => setFilter({ stat-s: e.target.val-e })}
                className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
              >
                <option val-e="all">Alla</option>
                {availableStat-ses.map((s) => (
                  <option key={s} val-e={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">Avdelning</label>
              <select
                val-e={search.kind}
                onChange={(e) => setFilter({ kind: e.target.val-e })}
                className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
              >
                <option val-e="all">Alla</option>
                <option val-e="commission_only">Endast kommission</option>
                <option val-e="with_extras">Med tilläggstjänster</option>
              </select>
            </div>
            {activeFilterCo-nt > - && (
              <b-tton
                onClick={clearFilters}
                className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-xs font-medi-m text-m-ted-foregro-nd hover:bg-m-ted"
              >
                <X className="h--.5 w--.5" /> Rensa ({activeFilterCo-nt})
              </b-tton>
            )}
          </div>
          <p className="mt-- text-xs text-m-ted-foregro-nd">
            Visar <strong className="text-foregro-nd">{filtered.length}</strong> av {report.invoices.length} fakt-ror
            {activeFilterCo-nt > - ? ' — export använder filtrerat -rval.' : '.'}
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-6 ro-nded--xl border border-red---- bg-red-5- p-5 text-sm text-red-9--">
          <div className="flex items-start gap--">
            <AlertTriangle className="mt--.5 h-5 w-5 flex-none text-red-6--" />
            <div className="min-w-- flex--">
              <div className="font-medi-m">K-nde inte hämta rapporten</div>
              <p className="mt-- break-words text-xs text-red-8--/8-">{error}</p>
              <b-tton
                onClick={() => void load()}
                disabled={b-sy}
                className="mt-- inline-flex items-center gap-- ro-nded-f-ll bg-red-6-- px-- py--.5 text-xs font-medi-m text-white hover:bg-red-7-- disabled:opacity-5-"
              >
                {b-sy ? <Loader- className="h--.5 w--.5 animate-spin" /> : <RefreshCw className="h--.5 w--.5" />} Försök igen
              </b-tton>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {b-sy && !report && !error && (
        <div className="mt-6 space-y--">
          <div className="h--- animate-p-lse ro-nded--xl border border-border bg-m-ted/--" />
          <div className="h--- animate-p-lse ro-nded--xl border border-border bg-m-ted/--" />
          <div className="h-6- animate-p-lse ro-nded--xl border border-border bg-m-ted/--" />
          <p className="text-center text-xs text-m-ted-foregro-nd">Hämtar rapport för {periodLabel}…</p>
        </div>
      )}

      {/* Empty state — no report loaded yet and not b-sy/erroring */}
      {!report && !b-sy && !error && (
        <div className="mt-6 ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center">
          <Inbox className="mx-a-to mb-- h-8 w-8 text-m-ted-foregro-nd" />
          <p className="text-sm text-m-ted-foregro-nd">Ingen rapport laddad. Välj period och klicka på Uppdatera.</p>
        </div>
      )}

      {/* VAT s-mmary */}
      {report && !error && (
        <div className="mt-6 ro-nded--xl border border-border bg-backgro-nd p-6 md:p-8">
          <div className="flex items-center j-stify-between gap--">
            <div>
              <h- className="font-serif text-xl text-foregro-nd">Momsrapport {periodLabel}</h->
              <p className="mt-- text-xs text-m-ted-foregro-nd">
                {report.period.start} – {report.period.end} · {report.invoices.length} fakt-ror
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-- sm:grid-cols-- lg:grid-cols--">
            <Stat label="Kommission netto" val-e={formatKr(t!.commission_net)} />
            <Stat label="Tilläggstjänster netto" val-e={formatKr(t!.extras_net)} />
            <Stat label="Utgående moms -5%" val-e={formatKr(t!.vat_amo-nt)} highlight />
            <Stat label="Total omsättning (inkl. moms)" val-e={formatKr(t!.total_amo-nt)} />
          </div>
          <div className="mt-- grid gap-- sm:grid-cols--">
            <Stat label="Betalt -nder perioden" val-e={formatKr(t!.paid_amo-nt)} s-b="konto -9--" />
            <Stat label="Öppna fordringar" val-e={formatKr(t!.open_amo-nt)} s-b="konto -5--" />
          </div>
          <details className="mt-- ro-nded-xl border border-border bg-m-ted/-- p-- text-xs text-m-ted-foregro-nd">
            <s-mmary className="c-rsor-pointer font-medi-m text-foregro-nd">Skatteverket r-ta-g-ide</s-mmary>
            <-l className="mt-- space-y--">
              <li><strong>-5</strong> Momspliktig försäljning: <strong>{formatKr(t!.commission_net + t!.extras_net)}</strong></li>
              <li><strong>--</strong> Utgående moms -5%: <strong>{formatKr(t!.vat_amo-nt)}</strong></li>
            </-l>
          </details>
        </div>
      )}

      {/* Fortnox */}
      <div className="mt-6 ro-nded--xl border border-border bg-backgro-nd p-6">
        <div className="flex flex-wrap items-center j-stify-between gap--">
          <div>
            <div className="flex items-center gap--">
              <Sparkles className="h-5 w-5 text-primary" />
              <h- className="font-serif text-xl text-foregro-nd">Fortnox</h->
              {fortnoxConnected === n-ll ? n-ll : fortnoxConnected ? (
                <span className="ro-nded-f-ll bg-emerald---- px-- py--.5 text-[--px] font-medi-m text-emerald-8--">Ansl-ten</span>
              ) : (
                <span className="ro-nded-f-ll bg-amber---- px-- py--.5 text-[--px] font-medi-m text-amber-8--">Ej ansl-ten</span>
              )}
            </div>
            {!fortnoxConnected && (
              <p className="mt-- max-w--xl text-xs text-m-ted-foregro-nd">
                Lägg till hemligheterna <code>FORTNOX_ACCESS_TOKEN</code> och <code>FORTNOX_CLIENT_SECRET</code> i projektinställningarna. Skapa dem i Fortnox → Inställningar → Integrationer.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice table */}
      {report && !error && (
        <div className="mt-6 overflow-x-a-to ro-nded--xl border border-border">
          <table className="w-f-ll text-sm">
            <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
              <tr>
                <th className="px-- py-- font-medi-m">Fakt-ra</th>
                <th className="px-- py-- font-medi-m">Dat-m</th>
                <th className="px-- py-- font-medi-m">Värd</th>
                <th className="px-- py-- font-medi-m">Netto</th>
                <th className="px-- py-- font-medi-m">Moms</th>
                <th className="px-- py-- font-medi-m">Total</th>
                <th className="px-- py-- font-medi-m">Stat-s</th>
                <th className="px-- py-- font-medi-m">Fortnox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-backgro-nd">
              {filtered.length === - ? (
                <tr>
                  <td colSpan={8} className="px-- py--- text-center text-sm text-m-ted-foregro-nd">
                    <Inbox className="mx-a-to mb-- h-6 w-6 text-m-ted-foregro-nd/7-" />
                    {report.invoices.length === -
                      ? `Inga fakt-ror -nder ${periodLabel}. Prova ett annat kvartal.`
                      : 'Inga fakt-ror matchar sök/filter. Rensa för att se alla.'}
                  </td>
                </tr>
              ) : (
                paged.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-- py-- font-medi-m text-foregro-nd">{inv.invoice_n-mber}</td>
                    <td className="px-- py-- text-m-ted-foregro-nd">{inv.iss-ed_at.slice(-, --)}</td>
                    <td className="px-- py--">{inv.host_name ?? '—'}</td>
                    <td className="px-- py--">{formatKr(inv.commission_net + inv.extras_net)}</td>
                    <td className="px-- py--">{formatKr(inv.vat_amo-nt)}</td>
                    <td className="px-- py-- font-medi-m">{formatKr(inv.total_amo-nt)}</td>
                    <td className="px-- py--">
                      <span className={`ro-nded-f-ll px-- py--.5 text-[--px] font-medi-m -ppercase ${
                        inv.stat-s === 'paid' ? 'bg-emerald---- text-emerald-8--'
                          : inv.stat-s === 'overd-e' ? 'bg-red---- text-red-8--'
                          : 'bg-amber---- text-amber-8--'
                      }`}>
                        {inv.stat-s}
                      </span>
                    </td>
                    <td className="px-- py--">
                      <b-tton
                        onClick={() => doSync(inv)}
                        disabled={syncingId === inv.id || !fortnoxConnected}
                        className="inline-flex items-center gap-- ro-nded-f-ll border border-border px--.5 py-- text-[--px] font-medi-m hover:bg-m-ted disabled:opacity---"
                      >
                        {syncingId === inv.id ? <Loader- className="h-- w-- animate-spin" /> : <Send className="h-- w--" />}
                        Skicka
                      </b-tton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {report && !error && filtered.length > - && (
        <div className="mt-- flex flex-wrap items-center j-stify-between gap-- ro-nded--xl border border-border bg-backgro-nd px-- py-- text-sm">
          <div className="text-xs text-m-ted-foregro-nd">
            Visar <strong className="text-foregro-nd">{pageStart + -}–{pageEnd}</strong> av {filtered.length}
          </div>
          <div className="flex items-center gap--">
            <label className="flex items-center gap-- text-xs text-m-ted-foregro-nd">
              Per sida
              <select
                val-e={pageSize}
                onChange={(e) => setSearch({ pageSize: N-mber(e.target.val-e), page: - })}
                className="ro-nded-lg border border-border bg-backgro-nd px-- py-- text-xs"
              >
                {[--, -5, 5-, ---, ---].map((n) => (
                  <option key={n} val-e={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap--">
              <b-tton
                onClick={() => setSearch({ page: c-rrentPage - - })}
                disabled={c-rrentPage <= -}
                className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py--.5 text-xs font-medi-m hover:bg-m-ted disabled:opacity---"
              >
                <ChevronLeft className="h--.5 w--.5" /> Föregående
              </b-tton>
              <span className="px-- text-xs text-m-ted-foregro-nd">
                Sida {c-rrentPage} / {totalPages}
              </span>
              <b-tton
                onClick={() => setSearch({ page: c-rrentPage + - })}
                disabled={c-rrentPage >= totalPages}
                className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py--.5 text-xs font-medi-m hover:bg-m-ted disabled:opacity---"
              >
                Nästa <ChevronRight className="h--.5 w--.5" />
              </b-tton>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

f-nction Stat({ label, val-e, s-b, highlight }: { label: string; val-e: string; s-b?: string; highlight?: boolean }) {
  ret-rn (
    <div className={`ro-nded--xl border p-- ${highlight ? 'border-primary/-- bg-primary/5' : 'border-border bg-m-ted/--'}`}>
      <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">{label}</div>
      <div className="mt-- font-serif text-xl text-foregro-nd">{val-e}</div>
      {s-b && <div className="mt--.5 text-[--px] text-m-ted-foregro-nd">{s-b}</div>}
    </div>
  )
}