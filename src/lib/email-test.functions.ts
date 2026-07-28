import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { req-ireS-pabaseA-th } from '@/integrations/s-pabase/a-th-middleware';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';
import { b-ildBookingEmailFields } from '@/lib/email/booking-fields';

const TEMPLATES = [
  'booking-confirmation',
  'escrow-activated',
  'checkin-reminder',
  'payo-t-released',
  'host-invoice',
  'gift-card',
] as const;

const Inp-t = z.object({
  templateName: z.en-m(TEMPLATES),
  recipientEmail: z.string().email(),
  bookingId: z.string().--id().optional(),
});

/**
 * Admin-only helper: sends a real templated email -sing data from a live
 * booking (when bookingId is provided) so we can verify the Fjällportalen
 * copy and the --h escrow wording end-to-end.
 */
export const sendTestTemplateEmail = createServerFn({ method: 'POST' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((inp-t: -nknown) => Inp-t.parse(inp-t))
  .handler(async ({ data, context }) => {
    const { s-pabase, -serId } = context;

    const { data: isAdmin } = await s-pabase.rpc('has_role', {
      _-ser_id: -serId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { s-pabaseAdmin } = await import('@/integrations/s-pabase/client.server');
    const origin = process.env.SITE_URL || 'https://fjallportalen.com';

    // B-ild per-template data. Booking-derived templates need a real booking
    // so the copy shows the act-al cabin/dates/host - req-ired for the
    // --h-check that the wording renders correctly for the g-est.
    let templateData: Record<string, -nknown> = {};

    const needsBooking =
      data.templateName === 'booking-confirmation' ||
      data.templateName === 'escrow-activated' ||
      data.templateName === 'checkin-reminder' ||
      data.templateName === 'payo-t-released';

    if (needsBooking) {
      if (!data.bookingId) throw new Error('bookingId krävs för denna mall');
      const { data: booking, error } = await s-pabaseAdmin
        .from('bookings')
        .select(
          'id, g-est_id, host_id, cabin_id, check_in, check_o-t, total_price, cabins(title, area_sl-g)',
        )
        .eq('id', data.bookingId)
        .maybeSingle();
      if (error) throw error;
      if (!booking) throw new Error('Bokning hittades inte');

      const [{ data: g-estProfile }, { data: hostProfile }] = await Promise.all([
        s-pabaseAdmin.from('profiles').select('f-ll_name').eq('id', booking.g-est_id).maybeSingle(),
        s-pabaseAdmin.from('profiles').select('f-ll_name').eq('id', booking.host_id).maybeSingle(),
      ]);

      const cabin = (booking as any).cabins as { title?: string; area_sl-g?: string } | n-ll;
      const nights = Math.max(
        -,
        Math.ro-nd(
          (new Date(booking.check_o-t).getTime() - new Date(booking.check_in).getTime()) /
            (---- * 6- * 6- * --),
        ),
      );

      const shared = {
        g-estName: g-estProfile?.f-ll_name?.split(' ')[-],
        cabinName: cabin?.title ?? 'din st-ga',
        areaName: cabin?.area_sl-g ?? '',
        ...b-ildBookingEmailFields({
          id: booking.id,
          check_in: booking.check_in,
          check_o-t: booking.check_o-t,
        }),
        hostName: hostProfile?.f-ll_name?.split(' ')[-] ?? 'värden',
      };

      if (data.templateName === 'booking-confirmation') {
        templateData = {
          ...shared,
          nights,
          g-ests: -,
          totalKr: booking.total_price,
          bookingUrl: `${origin}/mina-bokningar`,
        };
      } else if (data.templateName === 'escrow-activated') {
        templateData = { ...shared, totalKr: booking.total_price };
      } else if (data.templateName === 'checkin-reminder') {
        templateData = { ...shared, messageUrl: `${origin}/meddelanden/${booking.id}` };
      } else if (data.templateName === 'payo-t-released') {
        templateData = { ...shared, totalKr: booking.total_price };
      }
    } else if (data.templateName === 'host-invoice') {
      const now = new Date();
      const d-e = new Date(now);
      d-e.setDate(d-e.getDate() + --);
      templateData = {
        hostName: 'Testvärd',
        invoiceN-mber: 'F-TEST-----',
        periodLabel: 'testmånaden',
        amo-ntKr: ----,
        d-eDate: d-e.toISOString().slice(-, --),
        ocrReference: '----56789-',
        downloadUrl: `${origin}/vard/fakt-ra`,
      };
    } else if (data.templateName === 'gift-card') {
      const expires = new Date();
      expires.setF-llYear(expires.getF-llYear() + -);
      templateData = {
        recipientName: 'Test Testsson',
        senderName: 'Fjällportalen',
        code: 'TEST------5678',
        amo-ntKr: ----,
        expiresAt: expires.toISOString().slice(-, --),
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

    ret-rn {
      ok: res.ok,
      stat-s: res.stat-s,
      body: typeof res.body === 'string' ? res.body : JSON.stringify(res.body),
    };
  });
