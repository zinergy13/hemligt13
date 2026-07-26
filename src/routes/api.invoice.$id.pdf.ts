import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildInvoicePdf, type InvoiceBookingRow } from "@/server/invoicePdf";

export const Route = createFileRoute("/api/invoice/$id/pdf")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server not configured", { status: 500 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const invoiceId = params.id;

        // RLS säkerställer att bara värd/admin kan se sin faktura
        const { data: invoice, error } = await supabase
          .from("host_invoices")
          .select("*")
          .eq("id", invoiceId)
          .maybeSingle();

        if (error || !invoice) {
          return new Response("Not found", { status: 404 });
        }

        const [{ data: profile }, { data: bookings }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", invoice.host_id).maybeSingle(),
          supabase
            .from("bookings")
            .select("check_in, check_out, total_price, commission_amount, cabins(title)")
            .eq("host_invoice_id", invoiceId)
            .order("check_out", { ascending: true }),
        ]);

        // Hämta värdens email via auth-claims (token tillhör denne om värd, annars admin)
        const { data: claims } = await supabase.auth.getClaims(token);
        const hostEmail = (claims?.claims as { email?: string } | undefined)?.email ?? "";

        const rows: InvoiceBookingRow[] = (bookings ?? []).map((b) => ({
          cabin_title: (b as { cabins: { title: string } | null }).cabins?.title ?? "—",
          check_in: b.check_in,
          check_out: b.check_out,
          total_price: b.total_price,
          commission_amount: b.commission_amount,
        }));

        const pdfBytes = await buildInvoicePdf({
          invoice_number: invoice.invoice_number,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          issued_at: invoice.issued_at,
          total_amount: invoice.total_amount,
          currency: invoice.currency,
          status: invoice.status,
          host_name: profile?.full_name ?? "",
          host_email: hostEmail,
          rows,
          commission_net: (invoice as { commission_net?: number }).commission_net ?? 0,
          extras_net: (invoice as { extras_net?: number }).extras_net ?? 0,
          vat_amount: (invoice as { vat_amount?: number }).vat_amount ?? 0,
          vat_rate: Number((invoice as { vat_rate?: number | string }).vat_rate ?? 0.25),
          due_date: (invoice as { due_date?: string | null }).due_date ?? null,
          ocr_reference: (invoice as { ocr_reference?: string | null }).ocr_reference ?? null,
          extras_breakdown:
            ((invoice as { extras_breakdown?: Record<string, number> | null }).extras_breakdown ?? null) as
              | { cleaning?: number; groceries?: number; firewood?: number; linen?: number }
              | null,
        });

        return new Response(new Uint8Array(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});