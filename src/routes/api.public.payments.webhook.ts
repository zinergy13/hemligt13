import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

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