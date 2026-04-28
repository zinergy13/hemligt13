import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoiceBookingRow = {
  cabin_title: string;
  check_in: string;
  check_out: string;
  total_price: number;
  commission_amount: number;
};

export type InvoiceData = {
  invoice_number: string;
  period_start: string;
  period_end: string;
  issued_at: string;
  total_amount: number; // öre
  currency: string;
  status: string;
  host_name: string;
  host_email: string;
  rows: InvoiceBookingRow[];
};

const formatKr = (ore: number) =>
  `${(ore / 100).toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr`;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("sv-SE");
  } catch {
    return iso;
  }
};

export async function buildInvoicePdf(inv: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.1, 0.12, 0.15);
  const muted = rgb(0.45, 0.48, 0.52);
  const accent = rgb(0.18, 0.45, 0.35);

  let y = 800;
  const left = 48;
  const right = 547;

  // Header
  page.drawText("Fjällmys", { x: left, y, size: 22, font: bold, color: accent });
  page.drawText("FAKTURA", { x: right - bold.widthOfTextAtSize("FAKTURA", 14), y: y + 4, size: 14, font: bold, color: ink });
  y -= 22;
  page.drawText("Provisionsavgift för uthyrningar", { x: left, y, size: 10, font, color: muted });

  // Invoice meta box
  y -= 30;
  page.drawText(`Fakturanr: ${inv.invoice_number}`, { x: right - 200, y, size: 10, font, color: ink });
  y -= 14;
  page.drawText(`Utfärdad: ${formatDate(inv.issued_at)}`, { x: right - 200, y, size: 10, font, color: ink });
  y -= 14;
  page.drawText(`Period: ${formatDate(inv.period_start)} – ${formatDate(inv.period_end)}`, { x: right - 200, y, size: 10, font, color: ink });

  // Recipient
  y -= 40;
  page.drawText("Faktureras till", { x: left, y, size: 9, font: bold, color: muted });
  y -= 14;
  page.drawText(inv.host_name || inv.host_email || "—", { x: left, y, size: 12, font: bold, color: ink });
  if (inv.host_email) {
    y -= 14;
    page.drawText(inv.host_email, { x: left, y, size: 10, font, color: muted });
  }

  // Table header
  y -= 36;
  page.drawRectangle({ x: left, y: y - 4, width: right - left, height: 22, color: rgb(0.96, 0.97, 0.96) });
  page.drawText("Stuga", { x: left + 8, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("Period", { x: left + 200, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("Bokningsvärde", { x: left + 330, y: y + 4, size: 9, font: bold, color: ink });
  page.drawText("Avgift", { x: right - 60, y: y + 4, size: 9, font: bold, color: ink });

  y -= 18;

  // Rows
  for (const r of inv.rows) {
    if (y < 120) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(truncate(r.cabin_title, 28), { x: left + 8, y, size: 10, font, color: ink });
    page.drawText(`${formatDate(r.check_in)} – ${formatDate(r.check_out)}`, { x: left + 200, y, size: 10, font, color: ink });
    page.drawText(`${r.total_price.toLocaleString("sv-SE")} kr`, { x: left + 330, y, size: 10, font, color: ink });
    const fee = formatKr(r.commission_amount);
    page.drawText(fee, { x: right - 8 - font.widthOfTextAtSize(fee, 10), y, size: 10, font, color: ink });
    y -= 18;
  }

  // Total
  y -= 12;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: rgb(0.85, 0.86, 0.87) });
  y -= 22;
  page.drawText("Att betala", { x: right - 200, y, size: 11, font: bold, color: ink });
  const totalStr = formatKr(inv.total_amount);
  page.drawText(totalStr, { x: right - 8 - bold.widthOfTextAtSize(totalStr, 14), y: y - 2, size: 14, font: bold, color: accent });

  // Footer
  page.drawText("Betalning sker till Fjällmys senast 30 dagar efter fakturadatum.", {
    x: left,
    y: 60,
    size: 9,
    font,
    color: muted,
  });
  page.drawText("Fjällmys AB · faktura@fjällmys.se", { x: left, y: 46, size: 9, font, color: muted });

  return await pdf.save();
}

function truncate(s: string, n: number) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}