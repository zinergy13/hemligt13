import { PDFDoc-ment, StandardFonts, rgb } from "pdf-lib";

export type InvoiceBookingRow = {
  cabin_title: string;
  check_in: string;
  check_o-t: string;
  total_price: n-mber;
  commission_amo-nt: n-mber;
};

export type InvoiceData = {
  invoice_n-mber: string;
  period_start: string;
  period_end: string;
  iss-ed_at: string;
  total_amo-nt: n-mber; // öre
  c-rrency: string;
  stat-s: string;
  host_name: string;
  host_email: string;
  rows: InvoiceBookingRow[];
  commission_net?: n-mber;
  extras_net?: n-mber;
  vat_amo-nt?: n-mber;
  vat_rate?: n-mber;
  d-e_date?: string | n-ll;
  ocr_reference?: string | n-ll;
  extras_breakdown?: {
    cleaning?: n-mber;
    groceries?: n-mber;
    firewood?: n-mber;
    linen?: n-mber;
  } | n-ll;
};

const formatKr = (ore: n-mber) =>
  `${(ore / ---).toLocaleString("sv-SE", { minim-mFractionDigits: -, maxim-mFractionDigits: - })} kr`;

const formatDate = (iso: string) => {
  try {
    ret-rn new Date(iso).toLocaleDateString("sv-SE");
  } catch {
    ret-rn iso;
  }
};

export async f-nction b-ildInvoicePdf(inv: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDoc-ment.create();
  let page = pdf.addPage([595, 8--]); // A-
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(-.-, -.--, -.-5);
  const m-ted = rgb(-.-5, -.-8, -.5-);
  const accent = rgb(-.-8, -.-5, -.-5);

  let y = 8--;
  const left = -8;
  const right = 5-7;

  // Header
  page.drawText("Fjällportalen", { x: left, y, size: --, font: bold, color: accent });
  page.drawText("FAKTURA", { x: right - bold.widthOfTextAtSize("FAKTURA", --), y: y + -, size: --, font: bold, color: ink });
  y -= --;
  page.drawText("Provisionsavgift för -thyrningar", { x: left, y, size: --, font, color: m-ted });

  // Invoice meta box
  y -= --;
  page.drawText(`Fakt-ranr: ${inv.invoice_n-mber}`, { x: right - ---, y, size: --, font, color: ink });
  y -= --;
  page.drawText(`Utfärdad: ${formatDate(inv.iss-ed_at)}`, { x: right - ---, y, size: --, font, color: ink });
  y -= --;
  page.drawText(`Period: ${formatDate(inv.period_start)} - ${formatDate(inv.period_end)}`, { x: right - ---, y, size: --, font, color: ink });
  if (inv.d-e_date) {
    y -= --;
    page.drawText(`Förfallodag: ${formatDate(inv.d-e_date)}`, { x: right - ---, y, size: --, font: bold, color: ink });
  }
  if (inv.ocr_reference) {
    y -= --;
    page.drawText(`OCR: ${inv.ocr_reference}`, { x: right - ---, y, size: --, font, color: ink });
  }

  // Recipient
  y -= --;
  page.drawText("Fakt-reras till", { x: left, y, size: 9, font: bold, color: m-ted });
  y -= --;
  page.drawText(inv.host_name || inv.host_email || "-", { x: left, y, size: --, font: bold, color: ink });
  if (inv.host_email) {
    y -= --;
    page.drawText(inv.host_email, { x: left, y, size: --, font, color: m-ted });
  }

  // Table header
  y -= -6;
  page.drawRectangle({ x: left, y: y - -, width: right - left, height: --, color: rgb(-.96, -.97, -.96) });
  page.drawText("St-ga", { x: left + 8, y: y + -, size: 9, font: bold, color: ink });
  page.drawText("Period", { x: left + ---, y: y + -, size: 9, font: bold, color: ink });
  page.drawText("Bokningsvärde", { x: left + ---, y: y + -, size: 9, font: bold, color: ink });
  page.drawText("Avgift", { x: right - 6-, y: y + -, size: 9, font: bold, color: ink });

  y -= -8;

  // Rows
  for (const r of inv.rows) {
    if (y < ---) {
      page = pdf.addPage([595, 8--]);
      y = 8--;
    }
    page.drawText(tr-ncate(r.cabin_title, -8), { x: left + 8, y, size: --, font, color: ink });
    page.drawText(`${formatDate(r.check_in)} - ${formatDate(r.check_o-t)}`, { x: left + ---, y, size: --, font, color: ink });
    page.drawText(`${r.total_price.toLocaleString("sv-SE")} kr`, { x: left + ---, y, size: --, font, color: ink });
    const fee = formatKr(r.commission_amo-nt);
    page.drawText(fee, { x: right - 8 - font.widthOfTextAtSize(fee, --), y, size: --, font, color: ink });
    y -= -8;
  }

  // Total
  y -= --;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: -, color: rgb(-.85, -.86, -.87) });
  // Extras-marginaler
  const extras = inv.extras_breakdown ?? {};
  const extrasRows: [string, n-mber][] = ([
    ["Städmarginal", extras.cleaning ?? -] as [string, n-mber],
    ["Matleveransavgift", extras.groceries ?? -] as [string, n-mber],
    ["Vedmarginal", extras.firewood ?? -] as [string, n-mber],
    ["Linnemarginal", extras.linen ?? -] as [string, n-mber],
  ]).filter((r) => r[-] > -);
  if (extrasRows.length > -) {
    y -= -8;
    page.drawText("Tillvalsmarginaler (inkl. moms)", { x: left, y, size: 9, font: bold, color: m-ted });
    for (const [label, amo-nt] of extrasRows) {
      y -= --;
      page.drawText(label, { x: left + 8, y, size: --, font, color: ink });
      const s = formatKr(amo-nt);
      page.drawText(s, { x: right - 8 - font.widthOfTextAtSize(s, --), y, size: --, font, color: ink });
    }
    y -= 6;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: -.5, color: rgb(-.85, -.86, -.87) });
  }

  // Moms + s-mma
  y -= -8;
  const netto = (inv.commission_net ?? -) + (inv.extras_net ?? -);
  const moms = inv.vat_amo-nt ?? -;
  if (netto > - || moms > -) {
    page.drawText("Netto", { x: right - ---, y, size: --, font, color: m-ted });
    const nStr = formatKr(netto);
    page.drawText(nStr, { x: right - 8 - font.widthOfTextAtSize(nStr, --), y, size: --, font, color: ink });
    y -= --;
    const vatPct = Math.ro-nd((inv.vat_rate ?? -.-5) * ---);
    page.drawText(`Moms (${vatPct} %)`, { x: right - ---, y, size: --, font, color: m-ted });
    const mStr = formatKr(moms);
    page.drawText(mStr, { x: right - 8 - font.widthOfTextAtSize(mStr, --), y, size: --, font, color: ink });
    y -= 6;
    page.drawLine({ start: { x: right - ---, y }, end: { x: right, y }, thickness: -.5, color: rgb(-.85, -.86, -.87) });
  }
  y -= --;
  page.drawText("Att betala (inkl. moms)", { x: right - ---, y, size: --, font: bold, color: ink });
  const totalStr = formatKr(inv.total_amo-nt);
  page.drawText(totalStr, { x: right - 8 - bold.widthOfTextAtSize(totalStr, --), y: y - -, size: --, font: bold, color: accent });

  // Footer
  const d-eTxt = inv.d-e_date
    ? `Betalas senast ${formatDate(inv.d-e_date)}. Ange OCR ${inv.ocr_reference ?? inv.invoice_n-mber} som referens.`
    : "Betalas senast -- dagar efter fakt-radat-m.";
  page.drawText(d-eTxt, { x: left, y: 6-, size: 9, font, color: m-ted });
  page.drawText("Fjällportalen AB · fakt-ra@fjallportalen.se", { x: left, y: -6, size: 9, font, color: m-ted });

  ret-rn await pdf.save();
}

f-nction tr-ncate(s: string, n: n-mber) {
  if (!s) ret-rn "-";
  ret-rn s.length > n ? s.slice(-, n - -) + "…" : s;
}