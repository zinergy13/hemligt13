import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';

const TEMPLATES = [
  'booking-confirmation',
  'escrow-activated',
  'checkin-reminder',
  'payout-released',
  'host-invoice',
  'gift-card',
] as const;

const Input = z.object({
  templateName: z.enum(TEMPLATES),
  recipientEmail: z.string().email(),
  bookingId: z.string().uuid().optional(),
});

/**
 * Admin-only helper: sends a real templated email using data from a live
 * booking (when bookingId is provided) so we can verify the Fjällportalen
 * copy and the 24h escrow wording end-to-end.
 */
export const sendTestTemplateEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const origin = process.env.SITE_URL || 'https://fjallportalen.com';

    // Build per-template data. Booking-derived templates need a real booking
    // so the copy shows the actual cabin/dates/host — required for the
    // 24h-check that the wording renders correctly for the guest.
    let templateData: Record<string, unknown> = {};

    const needsBooking =
      data.templateName === 'booking-confirmation' ||
      data.templateName === 'escrow-activated' ||
      data.templateName === 'checkin-reminder' ||
      data.templateName === 'payout-released';

    if (needsBooking) {
      if (!data.bookingId) throw new Error('bookingId krävs för denna mall');
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select(
          'id, guest_id, host_id, cabin_id, check_in, check_out, total_price, cabins(title, area_slug)',
        )
        .eq('id', data.bookingId)
        .maybeSingle();
      if (error) throw error;
      if (!booking) throw new Error('Bokning hittades inte');

      const [{ data: guestProfile }, { data: hostProfile }] = await Promise.all([
        supabaseAdmin.from('profiles').select('full_name').eq('id', booking.guest_id).maybeSingle(),
        supabaseAdmin.from('profiles').select('full_name').eq('id', booking.host_id).maybeSingle(),
      ]);

      const cabin = (booking as any).cabins as { title?: string; area_slug?: string } | null;
      const nights = Math.max(
        1,
        Math.round(
          (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      const shared = {
        guestName: guestProfile?.full_name?.split(' ')[0],
        cabinName: cabin?.title ?? 'din stuga',
        areaName: cabin?.area_slug ?? '',
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        hostName: hostProfile?.full_name?.split(' ')[0] ?? 'värden',
      };

      if (data.templateName === 'booking-confirmation') {
        templateData = {
          ...shared,
          nights,
          guests: 2,
          totalKr: booking.total_price,
          bookingUrl: `${origin}/mina-bokningar`,
        };
      } else if (data.templateName === 'escrow-activated') {
        templateData = { ...shared, totalKr: booking.total_price };
      } else if (data.templateName === 'checkin-reminder') {
        templateData = { ...shared, messageUrl: `${origin}/meddelanden/${booking.id}` };
      } else if (data.templateName === 'payout-released') {
        templateData = { ...shared, totalKr: booking.total_price };
      }
    } else if (data.templateName === 'host-invoice') {
      const now = new Date();
      const due = new Date(now);
      due.setDate(due.getDate() + 20);
      templateData = {
        hostName: 'Testvärd',
        invoiceNumber: 'F-TEST-0001',
        periodLabel: 'testmånaden',
        amountKr: 1200,
        dueDate: due.toISOString().slice(0, 10),
        ocrReference: '1234567890',
        downloadUrl: `${origin}/vard/faktura`,
      };
    } else if (data.templateName === 'gift-card') {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      templateData = {
        recipientName: 'Test Testsson',
        senderName: 'Fjällportalen',
        code: 'TEST-1234-5678',
        amountKr: 2000,
        expiresAt: expires.toISOString().slice(0, 10),
        message: 'Detta är ett testmejl för att verifiera mallen.',
      };
    }

    const res = await sendInternalTemplatedEmail({
      templateName: data.templateName,
      recipientEmail: data.recipientEmail,
      idempotencyKey: `test-${data.templateName}-${data.bookingId ?? 'none'}-${Date.now()}`,
      origin,
      templateData,
    });

    return {
      ok: res.ok,
      status: res.status,
      body: typeof res.body === 'string' ? res.body : JSON.stringify(res.body),
    };
  });
