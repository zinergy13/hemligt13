import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';
import { buildBookingEmailFields } from '@/lib/email/booking-fields';

let _admin: ReturnType<typeof createClient<Database>> | null = null;
function admin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _admin;
}

async function handleCheckoutCompleted(session: any) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.warn('checkout.session.completed without booking_id metadata:', session.id);
    return;
  }
  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
  await admin()
    .from('bookings')
    .update({
      payment_status: 'paid',
      stripe_payment_intent: paymentIntent,
      escrow_status: 'holding',
      status: 'confirmed',
    })
    .eq('id', bookingId);

  // Mark extras as confirmed too
  await admin().from('booking_extras').update({ status: 'confirmed' }).eq('booking_id', bookingId);

  await notifyGuestPaymentAndEscrow(bookingId);
}

async function notifyGuestPaymentAndEscrow(bookingId: string) {
  // Idempotency guard - only send once per booking
  const { data: booking } = await admin()
    .from('bookings')
    .select('id, guest_id, cabin_id, check_in, check_out, nights, guests, total_price, payment_notified_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return;
  if (booking.payment_notified_at) return;

  const [{ data: authUser }, { data: cabin }] = await Promise.all([
    admin().auth.admin.getUserById(booking.guest_id),
    admin()
      .from('cabins')
      .select('title, area_slug')
      .eq('id', booking.cabin_id)
      .maybeSingle(),
  ]);
  const email = authUser?.user?.email;
  if (!email) {
    console.warn('No guest email for booking, skipping notify', { bookingId });
    return;
  }
  const { data: profile } = await admin()
    .from('profiles')
    .select('full_name')
    .eq('id', booking.guest_id)
    .maybeSingle();

  const guestName = profile?.full_name?.split(' ')[0] ?? undefined;
  const fields = buildBookingEmailFields({
    id: booking.id,
    check_in: booking.check_in,
    check_out: booking.check_out,
  });
  const shared = {
    guestName,
    cabinName: cabin?.title ?? 'din stuga',
    areaName: cabin?.area_slug ?? '',
    ...fields,
    nights: booking.nights,
    guests: booking.guests,
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
      guestName,
      cabinName: shared.cabinName,
      totalKr: shared.totalKr,
      checkIn: shared.checkIn,
      checkInLabel: shared.checkInLabel,
      bookingRef: shared.bookingRef,
      payoutAtLabel: shared.payoutAtLabel,
    },
  });

  await admin()
    .from('bookings')
    .update({ payment_notified_at: new Date().toISOString() })
    .eq('id', bookingId);
}

async function handleRefundCreated(refund: any) {
  const paymentIntent = typeof refund.payment_intent === 'string'
    ? refund.payment_intent
    : refund.payment_intent?.id;
  if (!paymentIntent) return;

  const { data: booking } = await admin()
    .from('bookings')
    .select('id, total_price, refund_amount_ore')
    .eq('stripe_payment_intent', paymentIntent)
    .maybeSingle();
  if (!booking) return;

  const totalOre = booking.total_price * 100;
  const isFull = refund.amount >= totalOre;
  await admin()
    .from('bookings')
    .update({
      refund_amount_ore: refund.amount ?? booking.refund_amount_ore ?? 0,
      refunded_at: new Date().toISOString(),
      escrow_status: isFull ? 'refunded' : 'partially_refunded',
      payment_status: isFull ? 'refunded' : 'paid',
    })
    .eq('id', booking.id);
}

async function handlePaymentFailed(paymentIntent: any) {
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) return;
  await admin().from('bookings').update({ payment_status: 'failed' }).eq('id', bookingId);
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
              await handleCheckoutCompleted(event.data.object);
              break;
            case 'charge.refunded':
            case 'refund.created':
            case 'refund.updated':
              await handleRefundCreated(event.data.object);
              break;
            case 'payment_intent.payment_failed':
            case 'checkout.session.async_payment_failed':
              await handlePaymentFailed(event.data.object);
              break;
            default:
              console.log('Unhandled Stripe event:', event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});