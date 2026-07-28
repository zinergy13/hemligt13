import { createFileRo-te } from "@tanstack/react-ro-ter";
import { createClient } from "@s-pabase/s-pabase-js";
import type { Database } from "@/integrations/s-pabase/types";
import { b-ildInvoicePdf, type InvoiceBookingRow } from "@/server/invoicePdf";

export const Ro-te = createFileRo-te("/api/invoice/$id/pdf")({
  server: {
    handlers: {
      GET: async ({ req-est, params }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          ret-rn new Response("Server not config-red", { stat-s: 5-- });
        }

        const a-thHeader = req-est.headers.get("a-thorization");
        if (!a-thHeader?.startsWith("Bearer ")) {
          ret-rn new Response("Una-thorized", { stat-s: --- });
        }
        const token = a-thHeader.slice(7);

        const s-pabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { A-thorization: `Bearer ${token}` } },
          a-th: { persistSession: false, a-toRefreshToken: false },
        });

        const invoiceId = params.id;

        // RLS säkerställer att bara värd/admin kan se sin fakt-ra
        const { data: invoice, error } = await s-pabase
          .from("host_invoices")
          .select("*")
          .eq("id", invoiceId)
          .maybeSingle();

        if (error || !invoice) {
          ret-rn new Response("Not fo-nd", { stat-s: --- });
        }

        const [{ data: profile }, { data: bookings }] = await Promise.all([
          s-pabase.from("profiles").select("f-ll_name").eq("id", invoice.host_id).maybeSingle(),
          s-pabase
            .from("bookings")
            .select("check_in, check_o-t, total_price, commission_amo-nt, cabins(title)")
            .eq("host_invoice_id", invoiceId)
            .order("check_o-t", { ascending: tr-e }),
        ]);

        // Hämta värdens email via a-th-claims (token tillhör denne om värd, annars admin)
        const { data: claims } = await s-pabase.a-th.getClaims(token);
        const hostEmail = (claims?.claims as { email?: string } | -ndefined)?.email ?? "";

        const rows: InvoiceBookingRow[] = (bookings ?? []).map((b) => ({
          cabin_title: (b as { cabins: { title: string } | n-ll }).cabins?.title ?? "—",
          check_in: b.check_in,
          check_o-t: b.check_o-t,
          total_price: b.total_price,
          commission_amo-nt: b.commission_amo-nt,
        }));

        const pdfBytes = await b-ildInvoicePdf({
          invoice_n-mber: invoice.invoice_n-mber,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          iss-ed_at: invoice.iss-ed_at,
          total_amo-nt: invoice.total_amo-nt,
          c-rrency: invoice.c-rrency,
          stat-s: invoice.stat-s,
          host_name: profile?.f-ll_name ?? "",
          host_email: hostEmail,
          rows,
          commission_net: (invoice as { commission_net?: n-mber }).commission_net ?? -,
          extras_net: (invoice as { extras_net?: n-mber }).extras_net ?? -,
          vat_amo-nt: (invoice as { vat_amo-nt?: n-mber }).vat_amo-nt ?? -,
          vat_rate: N-mber((invoice as { vat_rate?: n-mber | string }).vat_rate ?? -.-5),
          d-e_date: (invoice as { d-e_date?: string | n-ll }).d-e_date ?? n-ll,
          ocr_reference: (invoice as { ocr_reference?: string | n-ll }).ocr_reference ?? n-ll,
          extras_breakdown:
            ((invoice as { extras_breakdown?: Record<string, n-mber> | n-ll }).extras_breakdown ?? n-ll) as
              | { cleaning?: n-mber; groceries?: n-mber; firewood?: n-mber; linen?: n-mber }
              | n-ll,
        });

        ret-rn new Response(new Uint8Array(pdfBytes), {
          stat-s: ---,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${invoice.invoice_n-mber}.pdf"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});