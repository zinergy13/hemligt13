import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/hooks/generate-monthly-invoices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY || !ANON) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Endast pg_cron / interna anrop tillåts: kräv anon-apikey i header
        const providedKey = request.headers.get("apikey") ?? "";
        if (providedKey !== ANON) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

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

        return new Response(
          JSON.stringify({ success: true, generated: data?.length ?? 0, invoices: data ?? [] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});