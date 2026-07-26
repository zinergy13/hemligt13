import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// Chart of accounts (BAS 2024 – vanliga konton för digital plattform)
const ACCT = {
  BANK: '1930',              // Bankkonto
  KUNDFORDRINGAR: '1510',    // Kundfordringar
  UTG_MOMS: '2611',          // Utgående moms 25%
  KOMMISSION: '3041',        // Försäljning tjänster 25% moms (kommission)
  TILLAGGSTJANSTER: '3042',  // Försäljning tjänster 25% moms (tilläggstjänster netto/marginal)
}

const PeriodInput = z.object({
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4).optional(),
  month: z.number().int().min(1).max(12).optional(),
})

export type AccountingInvoice = {
  id: string
  invoice_number: string
  issued_at: string
  period_start: string
  period_end: string
  status: string
  host_id: string
  host_name: string | null
  booking_count: number
  commission_net: number
  extras_net: number
  vat_amount: number
  vat_rate: number
  total_amount: number
  paid_at: string | null
  due_date: string | null
  ocr_reference: string | null
}

function periodBounds(year: number, quarter?: number, month?: number) {
  if (month) {
    const s = new Date(Date.UTC(year, month - 1, 1))
    const e = new Date(Date.UTC(year, month, 0))
    return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) }
  }
  const q = quarter ?? 1
  const startMonth = (q - 1) * 3
  const s = new Date(Date.UTC(year, startMonth, 1))
  const e = new Date(Date.UTC(year, startMonth + 3, 0))
  return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) }
}

async function requireAdmin(supabase: NonNullable<Parameters<typeof requireSupabaseAuth>[0]> extends never ? never : never, userId: string) {
  // placeholder to satisfy type when tools change
  void supabase
  void userId
}

export const getAccountingReport = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PeriodInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context
    void requireAdmin

    // Verify admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { status: 403 })

    const { start, end } = periodBounds(data.year, data.quarter, data.month)

    const { data: rows, error } = await supabase
      .from('host_invoices')
      .select(
        'id, invoice_number, issued_at, period_start, period_end, status, host_id, booking_count, commission_net, extras_net, vat_amount, vat_rate, total_amount, paid_at, due_date, ocr_reference',
      )
      .gte('issued_at', `${start}T00:00:00Z`)
      .lte('issued_at', `${end}T23:59:59Z`)
      .order('issued_at', { ascending: true })
    if (error) throw new Response(error.message, { status: 500 })

    const hostIds = Array.from(new Set((rows ?? []).map((r) => r.host_id)))
    const nameMap = new Map<string, string | null>()
    if (hostIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', hostIds)
      ;(profs ?? []).forEach((p) => nameMap.set(p.id, p.full_name))
    }

    const invoices: AccountingInvoice[] = (rows ?? []).map((r) => ({
      id: r.id,
      invoice_number: r.invoice_number,
      issued_at: r.issued_at,
      period_start: r.period_start,
      period_end: r.period_end,
      status: r.status,
      host_id: r.host_id,
      host_name: nameMap.get(r.host_id) ?? null,
      booking_count: r.booking_count,
      commission_net: r.commission_net,
      extras_net: r.extras_net,
      vat_amount: r.vat_amount,
      vat_rate: Number(r.vat_rate),
      total_amount: r.total_amount,
      paid_at: r.paid_at,
      due_date: r.due_date,
      ocr_reference: r.ocr_reference,
    }))

    const totals = invoices.reduce(
      (acc, i) => {
        acc.commission_net += i.commission_net
        acc.extras_net += i.extras_net
        acc.vat_amount += i.vat_amount
        acc.total_amount += i.total_amount
        acc.paid_amount += i.status === 'paid' ? i.total_amount : 0
        acc.open_amount += i.status !== 'paid' && i.status !== 'cancelled' ? i.total_amount : 0
        return acc
      },
      { commission_net: 0, extras_net: 0, vat_amount: 0, total_amount: 0, paid_amount: 0, open_amount: 0 },
    )

    return { period: { start, end }, invoices, totals, accounts: ACCT }
  })

// -------- CSV generation --------

function csvEscape(v: string | number | null | undefined) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildCsv(invoices: AccountingInvoice[]) {
  const headers = [
    'Fakturanr',
    'Utfärdad',
    'Period start',
    'Period slut',
    'Värd',
    'Antal bokningar',
    'Kommission (kr)',
    'Tilläggstjänster (kr)',
    'Netto (kr)',
    'Moms (kr)',
    'Total (kr)',
    'Momssats',
    'Status',
    'Förfallodatum',
    'Betald',
    'OCR',
  ]
  const rows = invoices.map((i) => [
    i.invoice_number,
    i.issued_at.slice(0, 10),
    i.period_start,
    i.period_end,
    i.host_name ?? '',
    i.booking_count,
    (i.commission_net / 100).toFixed(2).replace('.', ','),
    (i.extras_net / 100).toFixed(2).replace('.', ','),
    ((i.commission_net + i.extras_net) / 100).toFixed(2).replace('.', ','),
    (i.vat_amount / 100).toFixed(2).replace('.', ','),
    (i.total_amount / 100).toFixed(2).replace('.', ','),
    `${(i.vat_rate * 100).toFixed(0)}%`,
    i.status,
    i.due_date ?? '',
    i.paid_at ? i.paid_at.slice(0, 10) : '',
    i.ocr_reference ?? '',
  ])
  return [headers, ...rows].map((r) => r.map(csvEscape).join(';')).join('\r\n') + '\r\n'
}

// -------- SIE4 export --------
// Enkel SIE4-fil (encoding CP437 rekommenderas av standarden, vi levererar UTF-8 med BOM)

function sieDate(iso: string) {
  return iso.replace(/-/g, '').slice(0, 8)
}

export function buildSie4(params: {
  invoices: AccountingInvoice[]
  period: { start: string; end: string }
  companyName: string
  orgNr?: string
}) {
  const { invoices, period, companyName, orgNr } = params
  const now = new Date()
  const genDate = sieDate(now.toISOString())
  const yearStart = period.start.slice(0, 4) + '0101'
  const yearEnd = period.start.slice(0, 4) + '1231'

  const lines: string[] = []
  lines.push('#FLAGGA 0')
  lines.push(`#PROGRAM "Fjällportalen" "1.0"`)
  lines.push('#FORMAT PC8')
  lines.push(`#GEN ${genDate}`)
  lines.push('#SIETYP 4')
  lines.push(`#FNAMN "${companyName.replace(/"/g, '')}"`)
  if (orgNr) lines.push(`#ORGNR ${orgNr}`)
  lines.push(`#RAR 0 ${yearStart} ${yearEnd}`)

  // Konton
  lines.push(`#KONTO 1510 "Kundfordringar"`)
  lines.push(`#KONTO 1930 "Bankkonto"`)
  lines.push(`#KONTO 2611 "Utgående moms 25%"`)
  lines.push(`#KONTO 3041 "Kommission plattform"`)
  lines.push(`#KONTO 3042 "Tilläggstjänster netto"`)

  // Verifikationer
  invoices.forEach((inv, idx) => {
    const verNr = idx + 1
    const vDate = sieDate(inv.issued_at)
    const label = `Faktura ${inv.invoice_number} ${inv.host_name ?? ''}`.trim()
    lines.push(`#VER "A" "${verNr}" ${vDate} "${label.replace(/"/g, '')}"`)
    lines.push('{')
    // Kundfordringar debet
    lines.push(`   #TRANS 1510 {} ${(inv.total_amount / 100).toFixed(2)}`)
    // Kommission credit
    if (inv.commission_net > 0) {
      lines.push(`   #TRANS 3041 {} -${(inv.commission_net / 100).toFixed(2)}`)
    }
    // Tilläggstjänster credit
    if (inv.extras_net > 0) {
      lines.push(`   #TRANS 3042 {} -${(inv.extras_net / 100).toFixed(2)}`)
    }
    // Utgående moms credit
    if (inv.vat_amount > 0) {
      lines.push(`   #TRANS 2611 {} -${(inv.vat_amount / 100).toFixed(2)}`)
    }
    lines.push('}')

    // Betalning som separat verifikat om betald
    if (inv.paid_at) {
      const pDate = sieDate(inv.paid_at)
      lines.push(`#VER "B" "${verNr}" ${pDate} "Betalning ${inv.invoice_number}"`)
      lines.push('{')
      lines.push(`   #TRANS 1930 {} ${(inv.total_amount / 100).toFixed(2)}`)
      lines.push(`   #TRANS 1510 {} -${(inv.total_amount / 100).toFixed(2)}`)
      lines.push('}')
    }
  })

  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}

// -------- Fortnox sync --------

const FortnoxSyncInput = z.object({ invoiceId: z.string().uuid() })

export const syncInvoiceToFortnox = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FortnoxSyncInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { status: 403 })

    const accessToken = process.env.FORTNOX_ACCESS_TOKEN
    const clientSecret = process.env.FORTNOX_CLIENT_SECRET
    if (!accessToken || !clientSecret) {
      throw new Response(
        'Fortnox är inte anslutet. Lägg till FORTNOX_ACCESS_TOKEN och FORTNOX_CLIENT_SECRET i inställningarna.',
        { status: 400 },
      )
    }

    const { data: inv, error } = await supabase
      .from('host_invoices')
      .select(
        'id, invoice_number, host_id, issued_at, due_date, commission_net, extras_net, vat_amount, vat_rate, total_amount, status, ocr_reference',
      )
      .eq('id', data.invoiceId)
      .single()
    if (error || !inv) throw new Response('Faktura hittades inte', { status: 404 })

    const { data: host } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', inv.host_id)
      .single()

    // 1) Ensure customer exists (upsert-lite: try create, ignore duplicate)
    const customerNumber = `H-${inv.host_id.slice(0, 8).toUpperCase()}`
    const customerBody = {
      Customer: {
        CustomerNumber: customerNumber,
        Name: host?.full_name || 'Värd',
        Email: host?.email ?? undefined,
        Type: 'PRIVATE',
        Currency: 'SEK',
      },
    }
    const custRes = await fetch(`https://api.fortnox.se/3/customers/${customerNumber}`, {
      method: 'GET',
      headers: {
        'Access-Token': accessToken,
        'Client-Secret': clientSecret,
        Accept: 'application/json',
      },
    })
    if (custRes.status === 404) {
      const create = await fetch('https://api.fortnox.se/3/customers/', {
        method: 'POST',
        headers: {
          'Access-Token': accessToken,
          'Client-Secret': clientSecret,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(customerBody),
      })
      if (!create.ok) {
        const body = await create.text()
        throw new Response(`Fortnox kundskapande misslyckades [${create.status}]: ${body}`, { status: 502 })
      }
    } else if (!custRes.ok) {
      const body = await custRes.text()
      throw new Response(`Fortnox kundlookup misslyckades [${custRes.status}]: ${body}`, { status: 502 })
    }

    // 2) Create invoice
    const invoiceRows: Array<{ Description: string; Price: number; DeliveredQuantity: number; VAT: number; AccountNumber: number }> = []
    if (inv.commission_net > 0) {
      invoiceRows.push({
        Description: `Provision plattformsavgift (${inv.invoice_number})`,
        Price: inv.commission_net / 100,
        DeliveredQuantity: 1,
        VAT: 25,
        AccountNumber: 3041,
      })
    }
    if (inv.extras_net > 0) {
      invoiceRows.push({
        Description: `Tilläggstjänster netto (${inv.invoice_number})`,
        Price: inv.extras_net / 100,
        DeliveredQuantity: 1,
        VAT: 25,
        AccountNumber: 3042,
      })
    }

    const invoiceBody = {
      Invoice: {
        CustomerNumber: customerNumber,
        InvoiceDate: inv.issued_at.slice(0, 10),
        DueDate: inv.due_date ?? undefined,
        Currency: 'SEK',
        Language: 'SV',
        YourReference: inv.invoice_number,
        Comments: `Fjällportalen faktura ${inv.invoice_number}`,
        OCR: inv.ocr_reference ?? undefined,
        InvoiceRows: invoiceRows,
      },
    }

    const invRes = await fetch('https://api.fortnox.se/3/invoices/', {
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
      throw new Response(`Fortnox fakturaskapande misslyckades [${invRes.status}]: ${body}`, { status: 502 })
    }
    const invJson = (await invRes.json()) as { Invoice?: { DocumentNumber?: number } }
    const documentNumber = invJson.Invoice?.DocumentNumber

    // Log event
    await supabase.from('host_invoice_events').insert({
      invoice_id: inv.id,
      event_type: 'fortnox_synced',
      metadata: { document_number: documentNumber ?? null },
      created_by: userId,
    } as never)

    return { ok: true, documentNumber }
  })

export const fortnoxStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Response('Forbidden', { status: 403 })
    return {
      connected: Boolean(process.env.FORTNOX_ACCESS_TOKEN && process.env.FORTNOX_CLIENT_SECRET),
    }
  })