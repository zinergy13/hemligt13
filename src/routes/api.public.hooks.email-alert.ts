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

interface Payload {
  attempt_id?: string;
  template_name?: string;
  recipient_email?: string;
  booking_id?: string | null;
  attempts?: number;
  last_status_code?: number | null;
  last_error?: string | null;
  last_attempt_at?: string | null;
}

export const Route = createFileRoute('/api/public/hooks/email-alert')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY) {
          return Response.json({ error: 'server_not_configured' }, { status: 500 });
        }
        const admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const provided = request.headers.get('x-cron-secret') ?? '';
        const { data: expected, error: sErr } = await admin.rpc('get_cron_secret', {
          _key: 'email_alert_hook',
        });
        if (sErr || !expected || !provided || !safeEqual(provided, expected as string)) {
          return Response.json({ error: 'unauthorized' }, { status: 401 });
        }

        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 });
        }

        if (!payload.template_name || !payload.recipient_email) {
          return Response.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Skydda mot rekursion om själva varningsmailet skulle misslyckas.
        if (payload.template_name === 'admin-email-alert') {
          return Response.json({ ok: true, skipped: 'self' });
        }

        const { data: adminEmail } = await admin.rpc('get_cron_secret', {
          _key: 'alert_admin_email',
        });
        const recipient = (adminEmail as string | null) || 'zinergy13@gmail.com';

        const origin = new URL(request.url).origin;
        const res = await sendInternalTemplatedEmail({
          templateName: 'admin-email-alert',
          recipientEmail: recipient,
          idempotencyKey: `email-alert-${payload.attempt_id ?? `${payload.template_name}-${payload.recipient_email}-${Date.now()}`}`,
          origin,
          templateData: {
            templateName: payload.template_name,
            recipientEmail: payload.recipient_email,
            bookingId: payload.booking_id ?? '',
            attempts: payload.attempts ?? 5,
            lastStatusCode: payload.last_status_code ?? 0,
            lastError: (payload.last_error ?? '').slice(0, 4000),
            lastAttemptAt: payload.last_attempt_at ?? '',
            attemptId: payload.attempt_id ?? '',
          },
        });

        return Response.json({ ok: res.ok, status: res.status });
      },
    },
  },
});