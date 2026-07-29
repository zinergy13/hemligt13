import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { timingSafeEqual, createHash } from 'node:crypto';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

let _admin: ReturnType<typeof createClient<Database>> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _admin;
}

export const Route = createFileRoute('/api/public/hooks/email-retry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get('x-cron-secret') ?? '';
        const { data: expected, error: sErr } = await admin().rpc('get_cron_secret', {
          _key: 'email_retry_hook',
        });
        if (sErr || !expected || !provided || !safeEqual(provided, expected as string)) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }
        const origin = new URL(request.url).origin;
        const nowIso = new Date().toISOString();
        const { data: rows, error } = await admin()
          .from('email_attempts')
          .select('*')
          .eq('status', 'pending')
          .lte('next_retry_at', nowIso)
          .gt('attempts', 0)
          .limit(25);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const results: Array<{ id: string; ok: boolean; status: number }> = [];
        for (const r of rows ?? []) {
          const res = await sendInternalTemplatedEmail({
            templateName: r.template_name,
            recipientEmail: r.recipient_email,
            idempotencyKey: r.idempotency_key ?? `retry-${r.id}`,
            bookingId: r.booking_id ?? undefined,
            templateData: (r.template_data as Record<string, unknown>) ?? {},
            origin,
          });
          results.push({ id: r.id, ok: res.ok, status: res.status });
        }
        return Response.json({ ok: true, processed: results.length, results });
      },
    },
  },
});