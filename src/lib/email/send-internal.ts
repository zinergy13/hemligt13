// Server-only helper: POST to /lovable/email/transactional/send using the
// EMAIL_RELAY_INTERNAL_SECRET so server-side triggers (webhooks, cron) can
// send templated emails without a user JWT. Each attempt is persisted in
// public.email_attempts keyed by idempotencyKey so failures can be inspected
// and retried from the admin dashboard.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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

export interface InternalSendArgs {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
  origin?: string;
  bookingId?: string;
}

export interface InternalSendResult {
  ok: boolean;
  status: number;
  body: unknown;
  attemptId?: string;
}

const MAX_ATTEMPTS = 5;
// Exponential backoff (minutes) capped
function backoffMinutes(attempts: number): number {
  return Math.min(60 * 6, Math.pow(2, Math.max(0, attempts - 1)) * 5);
}

async function upsertAttempt(args: InternalSendArgs): Promise<{ id: string; attempts: number } | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const key =
    args.idempotencyKey ??
    `${args.templateName}-${args.recipientEmail}-${Date.now()}`;
  const existing = await admin()
    .from('email_attempts')
    .select('id, attempts')
    .eq('idempotency_key', key)
    .maybeSingle();
  if (existing.data) {
    return { id: existing.data.id, attempts: existing.data.attempts ?? 0 };
  }
  const inserted = await admin()
    .from('email_attempts')
    .insert({
      idempotency_key: key,
      template_name: args.templateName,
      recipient_email: args.recipientEmail,
      booking_id: args.bookingId ?? null,
      template_data: (args.templateData ?? {}) as any,
      status: 'pending',
    })
    .select('id, attempts')
    .maybeSingle();
  if (inserted.error) {
    console.error('email_attempts insert failed', inserted.error);
    return null;
  }
  return inserted.data ? { id: inserted.data.id, attempts: inserted.data.attempts ?? 0 } : null;
}

async function markAttempt(
  id: string,
  attempts: number,
  ok: boolean,
  status: number,
  errorText: string | null,
) {
  const now = new Date();
  const nextAttempts = attempts + 1;
  const finalStatus: 'sent' | 'failed' | 'pending' = ok
    ? 'sent'
    : nextAttempts >= MAX_ATTEMPTS
      ? 'failed'
      : 'pending';
  const nextRetry = ok || finalStatus === 'failed'
    ? null
    : new Date(now.getTime() + backoffMinutes(nextAttempts) * 60_000).toISOString();
  await admin()
    .from('email_attempts')
    .update({
      attempts: nextAttempts,
      last_status_code: status,
      last_error: errorText,
      last_attempt_at: now.toISOString(),
      next_retry_at: nextRetry,
      status: finalStatus,
      sent_at: ok ? now.toISOString() : null,
    })
    .eq('id', id);
}

export async function sendInternalTemplatedEmail(
  args: InternalSendArgs,
): Promise<InternalSendResult> {
  const { templateName, recipientEmail, idempotencyKey, templateData } = args;
  const attempt = await upsertAttempt(args);

  // Send in-process via the shared core. Server-side callers (cron hooks,
  // webhooks, admin retries) must not rely on an HTTP self-call guarded by
  // EMAIL_RELAY_INTERNAL_SECRET - a missing/mismatched secret in any
  // deployment silently 403s every send.
  try {
    const { sendTemplatedEmailCore } = await import('@/lib/email/send-core.server');
    const res = await sendTemplatedEmailCore({
      templateName,
      recipientEmail,
      idempotencyKey,
      templateData: templateData ?? {},
    });
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) {
      console.error('Internal email send failed', { status: res.status, templateName, body: res.body });
    }
    if (attempt) {
      const errText = ok ? null : (() => {
        try { return JSON.stringify(res.body).slice(0, 2000); } catch { return String(res.body); }
      })();
      await markAttempt(attempt.id, attempt.attempts, ok, res.status, errText);
    }
    return { ok, status: res.status, body: res.body, attemptId: attempt?.id };
  } catch (err) {
    console.error('Internal email send threw', { templateName, err });
    if (attempt) await markAttempt(attempt.id, attempt.attempts, false, 0, String(err).slice(0, 2000));
    return { ok: false, status: 0, body: { error: 'send_error' }, attemptId: attempt?.id };
  }
}