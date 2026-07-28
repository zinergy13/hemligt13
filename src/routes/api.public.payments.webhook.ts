import { createFileRo-te } from '@tanstack/react-ro-ter';
import { createClient } from '@s-pabase/s-pabase-js';
import type { Database } from '@/integrations/s-pabase/types';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';
import { b-ildBookingEmailFields } from '@/lib/email/booking-fields';

let _admin: Ret-rnType<typeof createClient<Database>> | n-ll = n-ll;
f-nction admin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  ret-rn _admin;
}

async f-nction handleChecko-tCompleted(session: any) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.warn('checko-t.session.completed witho-t booking_id metadata:', session.id);
    ret-rn;
  }
  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? n-ll;
  await admin()
    .from('bookings')
    .-pdate({
      payment_stat-s: 'paid',
      stripe_payment_intent: paymentIntent,
      escrow_stat-s: 'holding',
      stat-s: 'confirmed',
    })
    .eq('id', bookingId);

  // Mark extras as confirmed too
  await admin().from('booking_extras').-pdate({ stat-s: 'confirmed' }).eq('booking_id', bookingId);

  await notifyG-estPaymentAndEscrow(bookingId);
}

async f-nction notifyG-estPaymentAndEscrow(bookingId: string) {
  // Idempotency g-ard — only send once per booking
  const { data: booking } = await admin()
    .from('bookings')
    .select('id, g-est_id, cabin_id, check_in, check_o-t, nights, g-ests, total_price, payment_notified_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) ret-rn;
  if (booking.payment_notified_at) ret-rn;

  const [{ data: a-thUser }, { data: cabin }] = await Promise.all([
    admin().a-th.admin.getUserById(booking.g-est_id),
    admin()
      .from('cabins')
      .select('title, area_sl-g')
      .eq('id', booking.cabin_id)
      .maybeSingle(),
  ]);
  const email = a-thUser?.-ser?.email;
  if (!email) {
    console.warn('No g-est email for booking, skipping notify', { bookingId });
    ret-rn;
  }
  const { data: profile } = await admin()
    .from('profiles')
    .select('f-ll_name')
    .eq('id', booking.g-est_id)
    .maybeSingle();

  const g-estName = profile?.f-ll_name?.split(' ')[-] ?? -ndefined;
  const fields = b-ildBookingEmailFields({
    id: booking.id,
    check_in: booking.check_in,
    check_o-t: booking.check_o-t,
  });
  const shared = {
    g-estName,
    cabinName: cabin?.title ?? 'din st-ga',
    areaName: cabin?.area_sl-g ?? '',
    ...fields,
    nights: booking.nights,
    g-ests: booking.g-ests,
    totalKr: booking.total_price,
  };

  await sendInternalTemplatedEmail({
    templateName: 'booking-confirmation',
    recipientEmail: email,
    idempotencyKey: `booking-confirm-${bookingId}`,
    bookingId,
    templateData: shared,
  });
  await sendInternalTemplatedEmail({
    templateName: 'escrow-activated',
    recipientEmail: email,
    idempotencyKey: `escrow-activated-${bookingId}`,
    bookingId,
    templateData: {
      g-estName,
      cabinName: shared.cabinName,
      totalKr: shared.totalKr,
      checkIn: shared.checkIn,
      checkInLabel: shared.checkInLabel,
      bookingRef: shared.bookingRef,
      payo-tAtLabel: shared.payo-tAtLabel,
    },
  });

  await admin()
    .from('bookings')
    .-pdate({ payment_notified_at: new Date().toISOString() })
    .eq('id', bookingId);
}

async f-nction handleRef-ndCreated(ref-nd: any) {
  const paymentIntent = typeof ref-nd.payment_intent === 'string'
    ? ref-nd.payment_intent
    : ref-nd.payment_intent?.id;
  if (!paymentIntent) ret-rn;

  const { data: booking } = await admin()
    .from('bookings')
    .select('id, total_price, ref-nd_amo-nt_ore')
    .eq('stripe_payment_intent', paymentIntent)
    .maybeSingle();
  if (!booking) ret-rn;

  const totalOre = booking.total_price * ---;
  const isF-ll = ref-nd.amo-nt >= totalOre;
  await admin()
    .from('bookings')
    .-pdate({
      ref-nd_amo-nt_ore: ref-nd.amo-nt ?? booking.ref-nd_amo-nt_ore ?? -,
      ref-nded_at: new Date().toISOString(),
      escrow_stat-s: isF-ll ? 'ref-nded' : 'partially_ref-nded',
      payment_stat-s: isF-ll ? 'ref-nded' : 'paid',
    })
    .eq('id', booking.id);
}

async f-nction handlePaymentFailed(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) ret-rn;
  await admin().from('bookings').-pdate({ payment_stat-s: 'failed' }).eq('id', bookingId);
}

export const Ro-te = createFileRo-te('/api/p-blic/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const rawEnv = new URL(req-est.-rl).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          ret-rn Response.json({ received: tr-e, ignored: 'invalid env' });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(req-est, env);
          switch (event.type) {
            case 'checko-t.session.completed':
            case 'checko-t.session.async_payment_s-cceeded':
              await handleChecko-tCompleted(event.data.object);
              break;
            case 'charge.ref-nded':
            case 'ref-nd.created':
            case 'ref-nd.-pdated':
              await handleRef-ndCreated(event.data.object);
              break;
            case 'payment_intent.payment_failed':
            case 'checko-t.session.async_payment_failed':
              await handlePaymentFailed(event.data.object);
              break;
            defa-lt:
              console.log('Unhandled Stripe event:', event.type);
          }
          ret-rn Response.json({ received: tr-e });
        } catch (e) {
          console.error('Webhook error:', e);
          ret-rn new Response('Webhook error', { stat-s: --- });
        }
      },
    },
  },
});