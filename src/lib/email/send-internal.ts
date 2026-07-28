// Server-only helper: POST to /lovable/email/transactional/send using the
// EMAIL_RELAY_INTERNAL_SECRET so server-side triggers (webhooks, cron) can
// send templated emails without a user JWT.

export interface InternalSendArgs {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, unknown>;
  origin?: string;
}

export async function sendInternalTemplatedEmail({
  templateName,
  recipientEmail,
  idempotencyKey,
  templateData,
  origin,
}: InternalSendArgs): Promise<{ ok: boolean; status: number; body: unknown }> {
  const secret = process.env.EMAIL_RELAY_INTERNAL_SECRET;
  if (!secret) {
    console.error('EMAIL_RELAY_INTERNAL_SECRET is not set — skipping send', { templateName });
    return { ok: false, status: 0, body: { error: 'missing_secret' } };
  }
  const base =
    origin ||
    process.env.SITE_URL ||
    'https://fjallportalen.com';
  const url = `${base.replace(/\/$/, '')}/lovable/email/transactional/send`;
  try {
    const res = await fetch(url, {
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
      console.error('Internal email send failed', { status: res.status, templateName, body });
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error('Internal email send threw', { templateName, err });
    return { ok: false, status: 0, body: { error: 'network_error' } };
  }
}