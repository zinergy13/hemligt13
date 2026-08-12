import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { createStripeClient, getStripeErrorMessage, resolvePaymentEnv } from '@/lib/stripe.server';

type CheckoutResult = { clientSecret: string } | { error: string };

/**
 * Create Stripe Embedded Checkout for a booking.
 * - Line items: nightly total, cleaning fee, then each extra as its own line
 * - Gift card redemption is applied as a negative discount adjustment via redeem_gift_card RPC before this call
 * - Payment goes to Fjällportalen (escrow); released 24h after check-in
 */
export const createBookingCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string; returnUrl: string; giftCardCode?: string }) => {
    if (!/^[0-9a-f-]{36}$/.test(data.bookingId)) throw new Error('Invalid bookingId');
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabase, userId } = context;

    // Load booking + cabin + extras
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, guest_id, status, payment_status, check_in, check_out, nights, nightly_total, cleaning_fee, total_price, currency, checkout_session_id, cabin_id')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (bErr || !booking) return { error: 'Bokning hittades inte' };
    if (booking.guest_id !== userId) return { error: 'Du är inte gäst på denna bokning' };
    if (booking.payment_status === 'paid') return { error: 'Bokningen är redan betald' };

    const { data: cabin } = await supabase.from('cabins').select('title').eq('id', booking.cabin_id).maybeSingle();
    const { data: extras } = await supabase
      .from('booking_extras')
      .select('service_type, quantity, guest_price')
      .eq('booking_id', booking.id);

    // Optional gift card
    let giftDiscountOre = 0;
    if (data.giftCardCode) {
      const targetOre = booking.total_price * 100;
      const { data: red, error: rErr } = await supabase.rpc('redeem_gift_card', {
        _code: data.giftCardCode,
        _booking_id: booking.id,
        _amount_ore: targetOre,
      });
      if (rErr) return { error: 'Presentkort: ' + rErr.message };
      const row = Array.isArray(red) ? red[0] : red;
      giftDiscountOre = (row?.applied_ore as number) ?? 0;
    }

    // WP-000: payment environment is server-owned and frozen to sandbox.
    const stripe = createStripeClient(resolvePaymentEnv());
    const cabinTitle = cabin?.title ?? 'Stugbokning';

    const lineItems: any[] = [
      {
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: booking.nightly_total * 100,
          product_data: {
            name: `${cabinTitle} - ${booking.nights} nätter`,
            description: `Incheckning ${booking.check_in} → ${booking.check_out}`,
          },
        },
      },
    ];
    if (booking.cleaning_fee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: booking.cleaning_fee * 100,
          product_data: { name: 'Städavgift' },
        },
      });
    }
    const extraLabels: Record<string, string> = {
      cleaning: 'Extra städning',
      groceries: 'Matkasse',
      firewood: 'Ved',
      linen: 'Lakan & handdukar',
    };
    for (const ex of extras ?? []) {
      lineItems.push({
        quantity: ex.quantity,
        price_data: {
          currency: 'sek',
          unit_amount: ex.guest_price,
          product_data: { name: extraLabels[ex.service_type] ?? ex.service_type },
        },
      });
    }
    if (giftDiscountOre > 0) {
      // Stripe requires positive line items; represent gift-card as coupon
      // We approximate with a single-use 100%-off coupon of the exact amount.
      const coupon = await stripe.coupons.create({
        amount_off: giftDiscountOre,
        currency: 'sek',
        duration: 'once',
        name: 'Presentkort',
      });
      // Attach via discounts on the session
      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          ui_mode: 'embedded_page',
          line_items: lineItems,
          discounts: [{ coupon: coupon.id }],
          return_url: data.returnUrl,
          payment_intent_data: {
            description: `Bokning ${booking.id.slice(0, 8)} - ${cabinTitle}`,
            metadata: { booking_id: booking.id, user_id: userId },
          },
          metadata: { booking_id: booking.id, user_id: userId },
        });
        await supabase.from('bookings').update({ checkout_session_id: session.id }).eq('id', booking.id);
        return { clientSecret: session.client_secret ?? '' };
      } catch (error) {
        return { error: getStripeErrorMessage(error) };
      }
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ui_mode: 'embedded_page',
        line_items: lineItems,
        return_url: data.returnUrl,
        payment_intent_data: {
          description: `Bokning ${booking.id.slice(0, 8)} - ${cabinTitle}`,
          metadata: { booking_id: booking.id, user_id: userId },
        },
        metadata: { booking_id: booking.id, user_id: userId },
      });
      await supabase.from('bookings').update({ checkout_session_id: session.id }).eq('id', booking.id);
      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type RefundResult = { refunded_ore: number } | { error: string };

type ReceiptResult =
  | {
      booking: {
        id: string;
        check_in: string;
        check_out: string;
        nights: number;
        guests: number;
        nightly_total: number;
        cleaning_fee: number;
        total_price: number;
        currency: string;
        payment_status: string;
        escrow_status: string;
        escrow_released_at: string | null;
        created_at: string;
        stripe_payment_intent: string | null;
      };
      cabin: { title: string; area_slug: string | null } | null;
      extras: Array<{ service_type: string; quantity: number; guest_price_ore: number }>;
      gift_card_ore: number;
    }
  | { error: string };

/**
 * Fetch a detailed receipt for a booking (guest only).
 * Used on the post-checkout receipt page.
 */
export const getBookingReceipt = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string }) => {
    if (!/^[0-9a-f-]{36}$/.test(data.bookingId)) throw new Error('Invalid bookingId');
    return data;
  })
  .handler(async ({ data, context }): Promise<ReceiptResult> => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, guest_id, cabin_id, check_in, check_out, nights, guests, nightly_total, cleaning_fee, total_price, currency, payment_status, escrow_status, escrow_released_at, created_at, stripe_payment_intent',
      )
      .eq('id', data.bookingId)
      .maybeSingle();
    if (error || !booking) return { error: 'Bokning hittades inte' };
    if (booking.guest_id !== userId) return { error: 'Åtkomst nekad' };

    const { data: cabin } = await supabase
      .from('cabins')
      .select('title, area_slug')
      .eq('id', booking.cabin_id)
      .maybeSingle();

    const { data: extras } = await supabase
      .from('booking_extras')
      .select('service_type, quantity, guest_price')
      .eq('booking_id', booking.id);

    const { data: gift } = await supabase
      .from('gift_card_redemptions')
      .select('amount_ore')
      .eq('booking_id', booking.id);
    const giftOre = (gift ?? []).reduce((s, r) => s + (r.amount_ore ?? 0), 0);

    return {
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        nights: booking.nights,
        guests: booking.guests,
        nightly_total: booking.nightly_total,
        cleaning_fee: booking.cleaning_fee,
        total_price: booking.total_price,
        currency: booking.currency,
        payment_status: booking.payment_status,
        escrow_status: booking.escrow_status,
        escrow_released_at: booking.escrow_released_at,
        created_at: booking.created_at,
        stripe_payment_intent: booking.stripe_payment_intent,
      },
      cabin: cabin ? { title: cabin.title, area_slug: cabin.area_slug } : null,
      extras: (extras ?? []).map((e) => ({
        service_type: e.service_type,
        quantity: e.quantity,
        guest_price_ore: e.guest_price,
      })),
      gift_card_ore: giftOre,
    };
  });

/**
 * Cancel booking. If check-in is >48h away, issue full refund via Stripe.
 * Otherwise, cancel without refund (flexible policy).
 */
export const cancelBookingWithRefund = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string; reason?: string }) => data)
  .handler(async ({ data, context }): Promise<RefundResult> => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, guest_id, host_id, status, payment_status, check_in, total_price, stripe_payment_intent, escrow_status')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (error || !booking) return { error: 'Bokning hittades inte' };
    const isAdmin = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (booking.guest_id !== userId && booking.host_id !== userId && !isAdmin.data) {
      return { error: 'Ej behörig' };
    }
    if (booking.status === 'cancelled') return { error: 'Redan avbokad' };

    // Flexible policy: full refund if >48h before check-in
    const hoursUntil = (new Date(booking.check_in).getTime() - Date.now()) / (1000 * 60 * 60);
    const eligibleForRefund = hoursUntil > 48;

    let refundedOre = 0;
    if (eligibleForRefund && booking.payment_status === 'paid' && booking.stripe_payment_intent) {
      try {
        const stripe = createStripeClient(resolvePaymentEnv());
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent,
          reason: 'requested_by_customer',
          metadata: { booking_id: booking.id, cancelled_by: userId },
        });
        refundedOre = refund.amount ?? booking.total_price * 100;
      } catch (err) {
        return { error: 'Återbetalning misslyckades: ' + getStripeErrorMessage(err) };
      }
    }

    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: data.reason ?? null,
        refund_amount_ore: refundedOre,
        refunded_at: refundedOre > 0 ? new Date().toISOString() : null,
        escrow_status: refundedOre > 0 ? 'refunded' : booking.escrow_status,
      })
      .eq('id', booking.id);

    return { refunded_ore: refundedOre };
  });