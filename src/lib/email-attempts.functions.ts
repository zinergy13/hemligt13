import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const ListInput = z.object({
  status: z.enum(['all', 'pending', 'failed', 'sent']).default('all'),
  templateName: z.string().optional(),
  bookingId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listEmailAttempts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    let q = context.supabase
      .from('email_attempts')
      .select(
        'id, idempotency_key, booking_id, template_name, recipient_email, status, attempts, last_status_code, last_error, last_attempt_at, next_retry_at, sent_at, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.status !== 'all') q = q.eq('status', data.status);
    if (data.templateName) q = q.eq('template_name', data.templateName);
    if (data.bookingId) q = q.eq('booking_id', data.bookingId);
    if (data.search) q = q.ilike('recipient_email', `%${data.search}%`);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    const { data: summaryRows } = await context.supabase
      .from('email_attempts')
      .select('status');
    const summary = { pending: 0, sent: 0, failed: 0 };
    for (const r of summaryRows ?? []) {
      const s = (r as any).status as keyof typeof summary;
      if (s in summary) summary[s]++;
    }

    return { rows: rows ?? [], total: count ?? 0, summary };
  });

const RetryInput = z.object({ id: z.string().uuid() });

export const retryEmailAttempt = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RetryInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin
      .from('email_attempts')
      .select('*')
      .eq('id', data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error('Not found');

    // Reset attempts so send-internal can persist a fresh outcome
    await supabaseAdmin
      .from('email_attempts')
      .update({ status: 'pending', attempts: 0, next_retry_at: null, last_error: null })
      .eq('id', row.id);

    const { sendInternalTemplatedEmail } = await import('@/lib/email/send-internal');
    const res = await sendInternalTemplatedEmail({
      templateName: row.template_name,
      recipientEmail: row.recipient_email,
      idempotencyKey: row.idempotency_key ?? `retry-${row.id}`,
      bookingId: row.booking_id ?? undefined,
      templateData: (row.template_data as Record<string, unknown>) ?? {},
    });
    return { ok: res.ok, status: res.status };
  });