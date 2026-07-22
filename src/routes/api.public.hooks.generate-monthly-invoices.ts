import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/hooks/generate-monthly-invoices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const CRON_SECRET = process.env.CRON_SECRET;
        if (!SUPABASE_URL || !SERVICE_KEY || !CRON_SECRET) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Require a shared secret header, compared in constant time.
        const provided = request.headers.get("x-cron-secret") ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(CRON_SECRET);
        const ok = a.length === b.length && timingSafeEqual(a, b);
        if (!ok) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

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