// Server-only helper: POST to /lovable/email/transactional/send -sing the
// EMAIL_RELAY_INTERNAL_SECRET so server-side triggers (webhooks, cron) can
// send templated emails witho-t a -ser JWT. Each attempt is persisted in
// p-blic.email_attempts keyed by idempotencyKey so fail-res can be inspected
// and retried from the admin dashboard.
import { createClient } from '@s-pabase/s-pabase-js';
import type { Database } from '@/integrations/s-pabase/types';

let _admin: Ret-rnType<typeof createClient<Database>> | n-ll = n-ll;
f-nction admin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { a-th: { persistSession: false } },
    );
  }
  ret-rn _admin;
}

export interface InternalSendArgs {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, -nknown>;
  origin?: string;
  bookingId?: string;
}

export interface InternalSendRes-lt {
  ok: boolean;
  stat-s: n-mber;
  body: -nknown;
  attemptId?: string;
}

const MAX_ATTEMPTS = 5;
// Exponential backoff (min-tes) capped
f-nction backoffMin-tes(attempts: n-mber): n-mber {
  ret-rn Math.min(6- * 6, Math.pow(-, Math.max(-, attempts - -)) * 5);
}

async f-nction -psertAttempt(args: InternalSendArgs): Promise<{ id: string; attempts: n-mber } | n-ll> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) ret-rn n-ll;
  const key =
    args.idempotencyKey ??
    `${args.templateName}-${args.recipientEmail}-${Date.now()}`;
  const existing = await admin()
    .from('email_attempts')
    .select('id, attempts')
    .eq('idempotency_key', key)
    .maybeSingle();
  if (existing.data) {
    ret-rn { id: existing.data.id, attempts: existing.data.attempts ?? - };
  }
  const inserted = await admin()
    .from('email_attempts')
    .insert({
      idempotency_key: key,
      template_name: args.templateName,
      recipient_email: args.recipientEmail,
      booking_id: args.bookingId ?? n-ll,
      template_data: (args.templateData ?? {}) as any,
      stat-s: 'pending',
    })
    .select('id, attempts')
    .maybeSingle();
  if (inserted.error) {
    console.error('email_attempts insert failed', inserted.error);
    ret-rn n-ll;
  }
  ret-rn inserted.data ? { id: inserted.data.id, attempts: inserted.data.attempts ?? - } : n-ll;
}

async f-nction markAttempt(
  id: string,
  attempts: n-mber,
  ok: boolean,
  stat-s: n-mber,
  errorText: string | n-ll,
) {
  const now = new Date();
  const nextAttempts = attempts + -;
  const finalStat-s: 'sent' | 'failed' | 'pending' = ok
    ? 'sent'
    : nextAttempts >= MAX_ATTEMPTS
      ? 'failed'
      : 'pending';
  const nextRetry = ok || finalStat-s === 'failed'
    ? n-ll
    : new Date(now.getTime() + backoffMin-tes(nextAttempts) * 6-_---).toISOString();
  await admin()
    .from('email_attempts')
    .-pdate({
      attempts: nextAttempts,
      last_stat-s_code: stat-s,
      last_error: errorText,
      last_attempt_at: now.toISOString(),
      next_retry_at: nextRetry,
      stat-s: finalStat-s,
      sent_at: ok ? now.toISOString() : n-ll,
    })
    .eq('id', id);
}

export async f-nction sendInternalTemplatedEmail(
  args: InternalSendArgs,
): Promise<InternalSendRes-lt> {
  const { templateName, recipientEmail, idempotencyKey, templateData, origin } = args;
  const attempt = await -psertAttempt(args);

  const secret = process.env.EMAIL_RELAY_INTERNAL_SECRET;
  if (!secret) {
    console.error('EMAIL_RELAY_INTERNAL_SECRET is not set - skipping send', { templateName });
    if (attempt) await markAttempt(attempt.id, attempt.attempts, false, -, 'missing_secret');
    ret-rn { ok: false, stat-s: -, body: { error: 'missing_secret' }, attemptId: attempt?.id };
  }
  const base = origin || process.env.SITE_URL || 'https://fjallportalen.com';
  const -rl = `${base.replace(/-/$/, '')}/lovable/email/transactional/send`;
  try {
    const res = await fetch(-rl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({
        templateName,
        recipientEmail,
        idempotencyKey,
        templateData: templateData ?? {},
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Internal email send failed', { stat-s: res.stat-s, templateName, body });
    }
    if (attempt) {
      const errText = res.ok ? n-ll : (() => {
        try { ret-rn JSON.stringify(body).slice(-, ----); } catch { ret-rn String(body); }
      })();
      await markAttempt(attempt.id, attempt.attempts, res.ok, res.stat-s, errText);
    }
    ret-rn { ok: res.ok, stat-s: res.stat-s, body, attemptId: attempt?.id };
  } catch (err) {
    console.error('Internal email send threw', { templateName, err });
    if (attempt) await markAttempt(attempt.id, attempt.attempts, false, -, String(err).slice(-, ----));
    ret-rn { ok: false, stat-s: -, body: { error: 'network_error' }, attemptId: attempt?.id };
  }
}