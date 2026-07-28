import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { timingSafeEqual, createHash } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export const Route = createFileRoute("/api/public/hooks/generate-monthly-invoices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Endast pg_cron / interna anrop: kräv delad hemlighet från private.cron_config
        const provided = request.headers.get("x-cron-secret") ?? "";
        const { data: expected, error: sErr } = await admin.rpc("get_cron_secret", {
          _key: "invoice_hook",
        });
        if (sErr || !expected || !provided || !safeEqual(provided, expected as string)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const doOverdue = url.searchParams.get("mark_overdue") === "1";

        if (doOverdue) {
          const { data: overdueCount, error: oErr } = await admin.rpc("mark_overdue_invoices");
          if (oErr) {
            return new Response(JSON.stringify({ error: oErr.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(
            JSON.stringify({ success: true, mode: "mark_overdue", updated: overdueCount ?? 0 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        const { data, error } = await admin.rpc("generate_monthly_host_invoices");
        if (error) {
          console.error("generate_monthly_host_invoices failed:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Skicka e-postnotis till varje värd om ny månadsfaktura.
        try {
          const rows = (data ?? []) as Array<{ invoice_id: string; host_id: string; total_amount: number; booking_count: number }>;
          if (rows.length > 0) {
            const [{ render }, React, { template: hostInvoiceTemplate }] = await Promise.all([
              import("@react-email/render"),
              import("react"),
              import("@/lib/email-templates/host-invoice"),
            ]);
            const origin = new URL(request.url).origin;
            const { data: invoiceRows } = await admin
              .from("host_invoices")
              .select("id, invoice_number, period_start, period_end, total_amount, due_date, ocr_reference, host_id")
              .in("id", rows.map((r) => r.invoice_id));

            for (const inv of invoiceRows ?? []) {
              const { data: userRes } = await admin.auth.admin.getUserById(inv.host_id as string);
              const email = userRes?.user?.email;
              if (!email) continue;
              const { data: profile } = await admin
                .from("profiles").select("full_name").eq("id", inv.host_id as string).maybeSingle();
              const props = {
                hostName: profile?.full_name?.split(" ")[0] ?? undefined,
                invoiceNumber: inv.invoice_number,
                periodLabel: `${inv.period_start} - ${inv.period_end}`,
                amountKr: Math.round((inv.total_amount as number) / 100),
                dueDate: inv.due_date ?? undefined,
                ocrReference: inv.ocr_reference ?? undefined,
                downloadUrl: `${origin}/api/invoice/${inv.id}/pdf`,
              };
              const html = await render(React.createElement(hostInvoiceTemplate.component, props));
              const subject = typeof hostInvoiceTemplate.subject === "function"
                ? hostInvoiceTemplate.subject(props)
                : hostInvoiceTemplate.subject;
              const messageId = crypto.randomUUID();
              await admin.from("email_send_log").insert({
                message_id: messageId,
                template_name: "host-invoice",
                recipient_email: email,
                status: "pending",
              });
              await admin.rpc("enqueue_email", {
                queue_name: "transactional_emails",
                payload: {
                  message_id: messageId,
                  to: email,
                  from: `Fjällportalen <fakturor@fjallportalen.com>`,
                  sender_domain: "notify.fjallportalen.com",
                  subject,
                  html,
                  purpose: "transactional",
                  label: "host-invoice",
                  idempotency_key: `host-invoice-${inv.id}`,
                  queued_at: new Date().toISOString(),
                },
              });
            }
          }
        } catch (e) {
          console.error("Failed to enqueue invoice emails", e);
        }

        return new Response(
          JSON.stringify({ success: true, generated: data?.length ?? 0, invoices: data ?? [] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});