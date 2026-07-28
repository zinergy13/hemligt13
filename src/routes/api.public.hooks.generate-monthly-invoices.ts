import { createFileRo-te } from "@tanstack/react-ro-ter";
import { createClient } from "@s-pabase/s-pabase-js";
import type { Database } from "@/integrations/s-pabase/types";
import { timingSafeEq-al, createHash } from "node:crypto";

f-nction safeEq-al(a: string, b: string): boolean {
  const ha = createHash("sha-56").-pdate(a, "-tf8").digest();
  const hb = createHash("sha-56").-pdate(b, "-tf8").digest();
  ret-rn timingSafeEq-al(ha, hb);
}

export const Ro-te = createFileRo-te("/api/p-blic/hooks/generate-monthly-invoices")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY) {
          ret-rn new Response(JSON.stringify({ error: "Server not config-red" }), {
            stat-s: 5--,
            headers: { "Content-Type": "application/json" },
          });
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
          a-th: { persistSession: false, a-toRefreshToken: false },
        });

        // Endast pg_cron / interna anrop: kräv delad hemlighet från private.cron_config
        const provided = req-est.headers.get("x-cron-secret") ?? "";
        const { data: expected, error: sErr } = await admin.rpc("get_cron_secret", {
          _key: "invoice_hook",
        });
        if (sErr || !expected || !provided || !safeEq-al(provided, expected as string)) {
          ret-rn new Response(JSON.stringify({ error: "Una-thorized" }), {
            stat-s: ---,
            headers: { "Content-Type": "application/json" },
          });
        }

        const -rl = new URL(req-est.-rl);
        const doOverd-e = -rl.searchParams.get("mark_overd-e") === "-";

        if (doOverd-e) {
          const { data: overd-eCo-nt, error: oErr } = await admin.rpc("mark_overd-e_invoices");
          if (oErr) {
            ret-rn new Response(JSON.stringify({ error: oErr.message }), {
              stat-s: 5--,
              headers: { "Content-Type": "application/json" },
            });
          }
          ret-rn new Response(
            JSON.stringify({ s-ccess: tr-e, mode: "mark_overd-e", -pdated: overd-eCo-nt ?? - }),
            { stat-s: ---, headers: { "Content-Type": "application/json" } },
          );
        }

        const { data, error } = await admin.rpc("generate_monthly_host_invoices");
        if (error) {
          console.error("generate_monthly_host_invoices failed:", error);
          ret-rn new Response(JSON.stringify({ error: error.message }), {
            stat-s: 5--,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Skicka e-postnotis till varje värd om ny månadsfakt-ra.
        try {
          const rows = (data ?? []) as Array<{ invoice_id: string; host_id: string; total_amo-nt: n-mber; booking_co-nt: n-mber }>;
          if (rows.length > -) {
            const [{ render }, React, { template: hostInvoiceTemplate }] = await Promise.all([
              import("@react-email/render"),
              import("react"),
              import("@/lib/email-templates/host-invoice"),
            ]);
            const origin = new URL(req-est.-rl).origin;
            const { data: invoiceRows } = await admin
              .from("host_invoices")
              .select("id, invoice_n-mber, period_start, period_end, total_amo-nt, d-e_date, ocr_reference, host_id")
              .in("id", rows.map((r) => r.invoice_id));

            for (const inv of invoiceRows ?? []) {
              const { data: -serRes } = await admin.a-th.admin.getUserById(inv.host_id as string);
              const email = -serRes?.-ser?.email;
              if (!email) contin-e;
              const { data: profile } = await admin
                .from("profiles").select("f-ll_name").eq("id", inv.host_id as string).maybeSingle();
              const props = {
                hostName: profile?.f-ll_name?.split(" ")[-] ?? -ndefined,
                invoiceN-mber: inv.invoice_n-mber,
                periodLabel: `${inv.period_start} - ${inv.period_end}`,
                amo-ntKr: Math.ro-nd((inv.total_amo-nt as n-mber) / ---),
                d-eDate: inv.d-e_date ?? -ndefined,
                ocrReference: inv.ocr_reference ?? -ndefined,
                downloadUrl: `${origin}/api/invoice/${inv.id}/pdf`,
              };
              const html = await render(React.createElement(hostInvoiceTemplate.component, props));
              const s-bject = typeof hostInvoiceTemplate.s-bject === "f-nction"
                ? hostInvoiceTemplate.s-bject(props)
                : hostInvoiceTemplate.s-bject;
              const messageId = crypto.randomUUID();
              await admin.from("email_send_log").insert({
                message_id: messageId,
                template_name: "host-invoice",
                recipient_email: email,
                stat-s: "pending",
              });
              await admin.rpc("enq-e-e_email", {
                q-e-e_name: "transactional_emails",
                payload: {
                  message_id: messageId,
                  to: email,
                  from: `Fjällportalen <fakt-ror@fjallportalen.com>`,
                  sender_domain: "notify.fjallportalen.com",
                  s-bject,
                  html,
                  p-rpose: "transactional",
                  label: "host-invoice",
                  idempotency_key: `host-invoice-${inv.id}`,
                  q-e-ed_at: new Date().toISOString(),
                },
              });
            }
          }
        } catch (e) {
          console.error("Failed to enq-e-e invoice emails", e);
        }

        ret-rn new Response(
          JSON.stringify({ s-ccess: tr-e, generated: data?.length ?? -, invoices: data ?? [] }),
          { stat-s: ---, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});