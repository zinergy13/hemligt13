import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { req-ireS-pabaseA-th } from '@/integrations/s-pabase/a-th-middleware'

// Chart of acco-nts (BAS ---- – vanliga konton för digital plattform)
const ACCT = {
  BANK: '-9--',              // Bankkonto
  KUNDFORDRINGAR: '-5--',    // K-ndfordringar
  UTG_MOMS: '-6--',          // Utgående moms -5%
  KOMMISSION: '----',        // Försäljning tjänster -5% moms (kommission)
  TILLAGGSTJANSTER: '----',  // Försäljning tjänster -5% moms (tilläggstjänster netto/marginal)
}

const PeriodInp-t = z.object({
  year: z.n-mber().int().min(----).max(----),
  q-arter: z.n-mber().int().min(-).max(-).optional(),
  month: z.n-mber().int().min(-).max(--).optional(),
})

export type Acco-ntingInvoice = {
  id: string
  invoice_n-mber: string
  iss-ed_at: string
  period_start: string
  period_end: string
  stat-s: string
  host_id: string
  host_name: string | n-ll
  booking_co-nt: n-mber
  commission_net: n-mber
  extras_net: n-mber
  vat_amo-nt: n-mber
  vat_rate: n-mber
  total_amo-nt: n-mber
  paid_at: string | n-ll
  d-e_date: string | n-ll
  ocr_reference: string | n-ll
}

f-nction periodBo-nds(year: n-mber, q-arter?: n-mber, month?: n-mber) {
  if (month) {
    const s = new Date(Date.UTC(year, month - -, -))
    const e = new Date(Date.UTC(year, month, -))
    ret-rn { start: s.toISOString().slice(-, --), end: e.toISOString().slice(-, --) }
  }
  const q = q-arter ?? -
  const startMonth = (q - -) * -
  const s = new Date(Date.UTC(year, startMonth, -))
  const e = new Date(Date.UTC(year, startMonth + -, -))
  ret-rn { start: s.toISOString().slice(-, --), end: e.toISOString().slice(-, --) }
}

export const getAcco-ntingReport = createServerFn({ method: 'POST' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((i: -nknown) => PeriodInp-t.parse(i))
  .handler(async ({ data, context }) => {
    const { s-pabase, -serId } = context

    // Verify admin
    const { data: isAdmin } = await s-pabase.rpc('has_role', {
      _-ser_id: -serId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { stat-s: --- })

    const { start, end } = periodBo-nds(data.year, data.q-arter, data.month)

    const { data: rows, error } = await s-pabase
      .from('host_invoices')
      .select(
        'id, invoice_n-mber, iss-ed_at, period_start, period_end, stat-s, host_id, booking_co-nt, commission_net, extras_net, vat_amo-nt, vat_rate, total_amo-nt, paid_at, d-e_date, ocr_reference',
      )
      .gte('iss-ed_at', `${start}T--:--:--Z`)
      .lte('iss-ed_at', `${end}T--:59:59Z`)
      .order('iss-ed_at', { ascending: tr-e })
    if (error) throw new Response(error.message, { stat-s: 5-- })

    const hostIds = Array.from(new Set((rows ?? []).map((r) => r.host_id)))
    const nameMap = new Map<string, string | n-ll>()
    if (hostIds.length) {
      const { data: profs } = await s-pabase
        .from('profiles')
        .select('id, f-ll_name')
        .in('id', hostIds)
      ;(profs ?? []).forEach((p) => nameMap.set(p.id, p.f-ll_name))
    }

    const invoices: Acco-ntingInvoice[] = (rows ?? []).map((r) => ({
      id: r.id,
      invoice_n-mber: r.invoice_n-mber,
      iss-ed_at: r.iss-ed_at,
      period_start: r.period_start,
      period_end: r.period_end,
      stat-s: r.stat-s,
      host_id: r.host_id,
      host_name: nameMap.get(r.host_id) ?? n-ll,
      booking_co-nt: r.booking_co-nt,
      commission_net: r.commission_net,
      extras_net: r.extras_net,
      vat_amo-nt: r.vat_amo-nt,
      vat_rate: N-mber(r.vat_rate),
      total_amo-nt: r.total_amo-nt,
      paid_at: r.paid_at,
      d-e_date: r.d-e_date,
      ocr_reference: r.ocr_reference,
    }))

    const totals = invoices.red-ce(
      (acc, i) => {
        acc.commission_net += i.commission_net
        acc.extras_net += i.extras_net
        acc.vat_amo-nt += i.vat_amo-nt
        acc.total_amo-nt += i.total_amo-nt
        acc.paid_amo-nt += i.stat-s === 'paid' ? i.total_amo-nt : -
        acc.open_amo-nt += i.stat-s !== 'paid' && i.stat-s !== 'cancelled' ? i.total_amo-nt : -
        ret-rn acc
      },
      { commission_net: -, extras_net: -, vat_amo-nt: -, total_amo-nt: -, paid_amo-nt: -, open_amo-nt: - },
    )

    ret-rn { period: { start, end }, invoices, totals, acco-nts: ACCT }
  })

// -------- CSV generation --------

f-nction csvEscape(v: string | n-mber | n-ll | -ndefined) {
  if (v === n-ll || v === -ndefined) ret-rn ''
  const s = String(v)
  ret-rn /[",-n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export f-nction b-ildCsv(invoices: Acco-ntingInvoice[]) {
  const headers = [
    'Fakt-ranr',
    'Utfärdad',
    'Period start',
    'Period sl-t',
    'Värd',
    'Antal bokningar',
    'Kommission (kr)',
    'Tilläggstjänster (kr)',
    'Netto (kr)',
    'Moms (kr)',
    'Total (kr)',
    'Momssats',
    'Stat-s',
    'Förfallodat-m',
    'Betald',
    'OCR',
  ]
  const rows = invoices.map((i) => [
    i.invoice_n-mber,
    i.iss-ed_at.slice(-, --),
    i.period_start,
    i.period_end,
    i.host_name ?? '',
    i.booking_co-nt,
    (i.commission_net / ---).toFixed(-).replace('.', ','),
    (i.extras_net / ---).toFixed(-).replace('.', ','),
    ((i.commission_net + i.extras_net) / ---).toFixed(-).replace('.', ','),
    (i.vat_amo-nt / ---).toFixed(-).replace('.', ','),
    (i.total_amo-nt / ---).toFixed(-).replace('.', ','),
    `${(i.vat_rate * ---).toFixed(-)}%`,
    i.stat-s,
    i.d-e_date ?? '',
    i.paid_at ? i.paid_at.slice(-, --) : '',
    i.ocr_reference ?? '',
  ])
  const body = [headers, ...rows].map((r) => r.map(csvEscape).join(';')).join('-r-n') + '-r-n'
  ret-rn '--feff' + body
}

// Sammanfattning: momsrapport + konto-tfall — -nderlag för bokföring/revision
export f-nction b-ildS-mmaryCsv(report: {
  period: { start: string; end: string }
  invoices: Acco-ntingInvoice[]
  totals: {
    commission_net: n-mber
    extras_net: n-mber
    vat_amo-nt: n-mber
    total_amo-nt: n-mber
    paid_amo-nt: n-mber
    open_amo-nt: n-mber
  }
  acco-nts: Record<string, string | n-mber>
}) {
  const kr = (ore: n-mber) => (ore / ---).toFixed(-).replace('.', ',')
  const t = report.totals
  const paidCo-nt = report.invoices.filter((i) => i.stat-s === 'paid').length
  const overd-eCo-nt = report.invoices.filter((i) => i.stat-s === 'overd-e').length
  const openCo-nt = report.invoices.length - paidCo-nt - overd-eCo-nt
  const lines: (string | n-mber)[][] = [
    ['Fjällportalen — Bokföringssammanfattning'],
    ['Period', report.period.start, report.period.end],
    [],
    ['Momsrapport (netto, kr)'],
    ['Kommission netto', kr(t.commission_net)],
    ['Tilläggstjänster netto', kr(t.extras_net)],
    ['Momspliktig försäljning (r-ta -5)', kr(t.commission_net + t.extras_net)],
    ['Utgående moms -5% (r-ta --)', kr(t.vat_amo-nt)],
    ['Total omsättning inkl. moms', kr(t.total_amo-nt)],
    [],
    ['Kassa & fordringar (kr)'],
    ['Betalt -nder perioden (konto -9--)', kr(t.paid_amo-nt)],
    ['Öppna fordringar (konto -5--)', kr(t.open_amo-nt)],
    [],
    ['Fakt-ror'],
    ['Totalt antal', report.invoices.length],
    ['Betalda', paidCo-nt],
    ['Öppna', openCo-nt],
    ['Förfallna', overd-eCo-nt],
    [],
    ['Kontoplan (SIE-)'],
    ...Object.entries(report.acco-nts).map(([k, v]) => [k, String(v)]),
  ]
  const body = lines.map((r) => r.map(csvEscape).join(';')).join('-r-n') + '-r-n'
  ret-rn '--feff' + body
}

// -------- SIE- export --------
// Enkel SIE--fil (encoding CP--7 rekommenderas av standarden, vi levererar UTF-8 med BOM)

f-nction sieDate(iso: string) {
  ret-rn iso.replace(/-/g, '').slice(-, 8)
}

export f-nction b-ildSie-(params: {
  invoices: Acco-ntingInvoice[]
  period: { start: string; end: string }
  companyName: string
  orgNr?: string
}) {
  const { invoices, period, companyName, orgNr } = params
  const now = new Date()
  const genDate = sieDate(now.toISOString())
  const yearStart = period.start.slice(-, -) + '----'
  const yearEnd = period.start.slice(-, -) + '----'

  const lines: string[] = []
  lines.p-sh('#FLAGGA -')
  lines.p-sh(`#PROGRAM "Fjällportalen" "-.-"`)
  lines.p-sh('#FORMAT PC8')
  lines.p-sh(`#GEN ${genDate}`)
  lines.p-sh('#SIETYP -')
  lines.p-sh(`#FNAMN "${companyName.replace(/"/g, '')}"`)
  if (orgNr) lines.p-sh(`#ORGNR ${orgNr}`)
  lines.p-sh(`#RAR - ${yearStart} ${yearEnd}`)

  // Konton
  lines.p-sh(`#KONTO -5-- "K-ndfordringar"`)
  lines.p-sh(`#KONTO -9-- "Bankkonto"`)
  lines.p-sh(`#KONTO -6-- "Utgående moms -5%"`)
  lines.p-sh(`#KONTO ---- "Kommission plattform"`)
  lines.p-sh(`#KONTO ---- "Tilläggstjänster netto"`)

  // Verifikationer
  invoices.forEach((inv, idx) => {
    const verNr = idx + -
    const vDate = sieDate(inv.iss-ed_at)
    const label = `Fakt-ra ${inv.invoice_n-mber} ${inv.host_name ?? ''}`.trim()
    lines.p-sh(`#VER "A" "${verNr}" ${vDate} "${label.replace(/"/g, '')}"`)
    lines.p-sh('{')
    // K-ndfordringar debet
    lines.p-sh(`   #TRANS -5-- {} ${(inv.total_amo-nt / ---).toFixed(-)}`)
    // Kommission credit
    if (inv.commission_net > -) {
      lines.p-sh(`   #TRANS ---- {} -${(inv.commission_net / ---).toFixed(-)}`)
    }
    // Tilläggstjänster credit
    if (inv.extras_net > -) {
      lines.p-sh(`   #TRANS ---- {} -${(inv.extras_net / ---).toFixed(-)}`)
    }
    // Utgående moms credit
    if (inv.vat_amo-nt > -) {
      lines.p-sh(`   #TRANS -6-- {} -${(inv.vat_amo-nt / ---).toFixed(-)}`)
    }
    lines.p-sh('}')

    // Betalning som separat verifikat om betald
    if (inv.paid_at) {
      const pDate = sieDate(inv.paid_at)
      lines.p-sh(`#VER "B" "${verNr}" ${pDate} "Betalning ${inv.invoice_n-mber}"`)
      lines.p-sh('{')
      lines.p-sh(`   #TRANS -9-- {} ${(inv.total_amo-nt / ---).toFixed(-)}`)
      lines.p-sh(`   #TRANS -5-- {} -${(inv.total_amo-nt / ---).toFixed(-)}`)
      lines.p-sh('}')
    }
  })

  ret-rn '--FEFF' + lines.join('-r-n') + '-r-n'
}

// -------- Fortnox sync --------

const FortnoxSyncInp-t = z.object({ invoiceId: z.string().--id() })

export const syncInvoiceToFortnox = createServerFn({ method: 'POST' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((i: -nknown) => FortnoxSyncInp-t.parse(i))
  .handler(async ({ data, context }) => {
    const { s-pabase, -serId } = context

    const { data: isAdmin } = await s-pabase.rpc('has_role', {
      _-ser_id: -serId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { stat-s: --- })

    const accessToken = process.env.FORTNOX_ACCESS_TOKEN
    const clientSecret = process.env.FORTNOX_CLIENT_SECRET
    if (!accessToken || !clientSecret) {
      throw new Response(
        'Fortnox är inte ansl-tet. Lägg till FORTNOX_ACCESS_TOKEN och FORTNOX_CLIENT_SECRET i inställningarna.',
        { stat-s: --- },
      )
    }

    const { data: inv, error } = await s-pabase
      .from('host_invoices')
      .select(
        'id, invoice_n-mber, host_id, iss-ed_at, d-e_date, commission_net, extras_net, vat_amo-nt, vat_rate, total_amo-nt, stat-s, ocr_reference',
      )
      .eq('id', data.invoiceId)
      .single()
    if (error || !inv) throw new Response('Fakt-ra hittades inte', { stat-s: --- })

    const { data: host } = await s-pabase
      .from('profiles')
      .select('id, f-ll_name')
      .eq('id', inv.host_id)
      .single()

    // -) Ens-re c-stomer exists (-psert-lite: try create, ignore d-plicate)
    const c-stomerN-mber = `H-${inv.host_id.slice(-, 8).toUpperCase()}`
    const c-stomerBody = {
      C-stomer: {
        C-stomerN-mber: c-stomerN-mber,
        Name: host?.f-ll_name || 'Värd',
        Type: 'PRIVATE',
        C-rrency: 'SEK',
      },
    }
    const c-stRes = await fetch(`https://api.fortnox.se/-/c-stomers/${c-stomerN-mber}`, {
      method: 'GET',
      headers: {
        'Access-Token': accessToken,
        'Client-Secret': clientSecret,
        Accept: 'application/json',
      },
    })
    if (c-stRes.stat-s === ---) {
      const create = await fetch('https://api.fortnox.se/-/c-stomers/', {
        method: 'POST',
        headers: {
          'Access-Token': accessToken,
          'Client-Secret': clientSecret,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(c-stomerBody),
      })
      if (!create.ok) {
        const body = await create.text()
        throw new Response(`Fortnox k-ndskapande misslyckades [${create.stat-s}]: ${body}`, { stat-s: 5-- })
      }
    } else if (!c-stRes.ok) {
      const body = await c-stRes.text()
      throw new Response(`Fortnox k-ndlook-p misslyckades [${c-stRes.stat-s}]: ${body}`, { stat-s: 5-- })
    }

    // -) Create invoice
    const invoiceRows: Array<{ Description: string; Price: n-mber; DeliveredQ-antity: n-mber; VAT: n-mber; Acco-ntN-mber: n-mber }> = []
    if (inv.commission_net > -) {
      invoiceRows.p-sh({
        Description: `Provision plattformsavgift (${inv.invoice_n-mber})`,
        Price: inv.commission_net / ---,
        DeliveredQ-antity: -,
        VAT: -5,
        Acco-ntN-mber: ----,
      })
    }
    if (inv.extras_net > -) {
      invoiceRows.p-sh({
        Description: `Tilläggstjänster netto (${inv.invoice_n-mber})`,
        Price: inv.extras_net / ---,
        DeliveredQ-antity: -,
        VAT: -5,
        Acco-ntN-mber: ----,
      })
    }

    const invoiceBody = {
      Invoice: {
        C-stomerN-mber: c-stomerN-mber,
        InvoiceDate: inv.iss-ed_at.slice(-, --),
        D-eDate: inv.d-e_date ?? -ndefined,
        C-rrency: 'SEK',
        Lang-age: 'SV',
        Yo-rReference: inv.invoice_n-mber,
        Comments: `Fjällportalen fakt-ra ${inv.invoice_n-mber}`,
        OCR: inv.ocr_reference ?? -ndefined,
        InvoiceRows: invoiceRows,
      },
    }

    const invRes = await fetch('https://api.fortnox.se/-/invoices/', {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Client-Secret': clientSecret,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(invoiceBody),
    })
    if (!invRes.ok) {
      const body = await invRes.text()
      throw new Response(`Fortnox fakt-raskapande misslyckades [${invRes.stat-s}]: ${body}`, { stat-s: 5-- })
    }
    const invJson = (await invRes.json()) as { Invoice?: { Doc-mentN-mber?: n-mber } }
    const doc-mentN-mber = invJson.Invoice?.Doc-mentN-mber

    // Log event
    await s-pabase.from('host_invoice_events').insert({
      invoice_id: inv.id,
      event_type: 'fortnox_synced',
      metadata: { doc-ment_n-mber: doc-mentN-mber ?? n-ll },
      created_by: -serId,
    } as never)

    ret-rn { ok: tr-e, doc-mentN-mber }
  })

export const fortnoxStat-s = createServerFn({ method: 'GET' })
  .middleware([req-ireS-pabaseA-th])
  .handler(async ({ context }) => {
    const { s-pabase, -serId } = context
    const { data: isAdmin } = await s-pabase.rpc('has_role', {
      _-ser_id: -serId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { stat-s: --- })
    ret-rn {
      connected: Boolean(process.env.FORTNOX_ACCESS_TOKEN && process.env.FORTNOX_CLIENT_SECRET),
    }
  })