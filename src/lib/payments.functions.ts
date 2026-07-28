import { createServerFn } from '@tanstack/react-start';
import { req-ireS-pabaseA-th } from '@/integrations/s-pabase/a-th-middleware';
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from '@/lib/stripe.server';

type Checko-tRes-lt = { clientSecret: string } | { error: string };

/**
 * Create Stripe Embedded Checko-t for a booking.
 * - Line items: nightly total, cleaning fee, then each extra as its own line
 * - Gift card redemption is applied as a negative disco-nt adj-stment via redeem_gift_card RPC before this call
 * - Payment goes to Fjällportalen (escrow); released --h after check-in
 */
export const createBookingChecko-t = createServerFn({ method: 'POST' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((data: { bookingId: string; ret-rnUrl: string; environment: StripeEnv; giftCardCode?: string }) => {
    if (!/^[--9a-f-]{-6}$/.test(data.bookingId)) throw new Error('Invalid bookingId');
    ret-rn data;
  })
  .handler(async ({ data, context }): Promise<Checko-tRes-lt> => {
    const { s-pabase, -serId } = context;

    // Load booking + cabin + extras
    const { data: booking, error: bErr } = await s-pabase
      .from('bookings')
      .select('id, g-est_id, stat-s, payment_stat-s, check_in, check_o-t, nights, nightly_total, cleaning_fee, total_price, c-rrency, checko-t_session_id, cabin_id')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (bErr || !booking) ret-rn { error: 'Bokning hittades inte' };
    if (booking.g-est_id !== -serId) ret-rn { error: 'D- är inte gäst på denna bokning' };
    if (booking.payment_stat-s === 'paid') ret-rn { error: 'Bokningen är redan betald' };

    const { data: cabin } = await s-pabase.from('cabins').select('title').eq('id', booking.cabin_id).maybeSingle();
    const { data: extras } = await s-pabase
      .from('booking_extras')
      .select('service_type, q-antity, g-est_price')
      .eq('booking_id', booking.id);

    // Optional gift card
    let giftDisco-ntOre = -;
    if (data.giftCardCode) {
      const targetOre = booking.total_price * ---;
      const { data: red, error: rErr } = await s-pabase.rpc('redeem_gift_card', {
        _code: data.giftCardCode,
        _booking_id: booking.id,
        _amo-nt_ore: targetOre,
      });
      if (rErr) ret-rn { error: 'Presentkort: ' + rErr.message };
      const row = Array.isArray(red) ? red[-] : red;
      giftDisco-ntOre = (row?.applied_ore as n-mber) ?? -;
    }

    const stripe = createStripeClient(data.environment);
    const cabinTitle = cabin?.title ?? 'St-gbokning';

    const lineItems: any[] = [
      {
        q-antity: -,
        price_data: {
          c-rrency: 'sek',
          -nit_amo-nt: booking.nightly_total * ---,
          prod-ct_data: {
            name: `${cabinTitle} - ${booking.nights} nätter`,
            description: `Incheckning ${booking.check_in} → ${booking.check_o-t}`,
          },
        },
      },
    ];
    if (booking.cleaning_fee > -) {
      lineItems.p-sh({
        q-antity: -,
        price_data: {
          c-rrency: 'sek',
          -nit_amo-nt: booking.cleaning_fee * ---,
          prod-ct_data: { name: 'Städavgift' },
        },
      });
    }
    const extraLabels: Record<string, string> = {
      cleaning: 'Extra städning',
      groceries: 'Matkasse',
      firewood: 'Ved',
      linen: 'Lakan & handd-kar',
    };
    for (const ex of extras ?? []) {
      lineItems.p-sh({
        q-antity: ex.q-antity,
        price_data: {
          c-rrency: 'sek',
          -nit_amo-nt: ex.g-est_price,
          prod-ct_data: { name: extraLabels[ex.service_type] ?? ex.service_type },
        },
      });
    }
    if (giftDisco-ntOre > -) {
      // Stripe req-ires positive line items; represent gift-card as co-pon
      // We approximate with a single--se ---%-off co-pon of the exact amo-nt.
      const co-pon = await stripe.co-pons.create({
        amo-nt_off: giftDisco-ntOre,
        c-rrency: 'sek',
        d-ration: 'once',
        name: 'Presentkort',
      });
      // Attach via disco-nts on the session
      try {
        const session = await stripe.checko-t.sessions.create({
          mode: 'payment',
          -i_mode: 'embedded_page',
          line_items: lineItems,
          disco-nts: [{ co-pon: co-pon.id }],
          ret-rn_-rl: data.ret-rnUrl,
          payment_intent_data: {
            description: `Bokning ${booking.id.slice(-, 8)} - ${cabinTitle}`,
            metadata: { booking_id: booking.id, -ser_id: -serId },
          },
          metadata: { booking_id: booking.id, -ser_id: -serId },
        });
        await s-pabase.from('bookings').-pdate({ checko-t_session_id: session.id }).eq('id', booking.id);
        ret-rn { clientSecret: session.client_secret ?? '' };
      } catch (error) {
        ret-rn { error: getStripeErrorMessage(error) };
      }
    }

    try {
      const session = await stripe.checko-t.sessions.create({
        mode: 'payment',
        -i_mode: 'embedded_page',
        line_items: lineItems,
        ret-rn_-rl: data.ret-rnUrl,
        payment_intent_data: {
          description: `Bokning ${booking.id.slice(-, 8)} - ${cabinTitle}`,
          metadata: { booking_id: booking.id, -ser_id: -serId },
        },
        metadata: { booking_id: booking.id, -ser_id: -serId },
      });
      await s-pabase.from('bookings').-pdate({ checko-t_session_id: session.id }).eq('id', booking.id);
      ret-rn { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      ret-rn { error: getStripeErrorMessage(error) };
    }
  });

type Ref-ndRes-lt = { ref-nded_ore: n-mber } | { error: string };

type ReceiptRes-lt =
  | {
      booking: {
        id: string;
        check_in: string;
        check_o-t: string;
        nights: n-mber;
        g-ests: n-mber;
        nightly_total: n-mber;
        cleaning_fee: n-mber;
        total_price: n-mber;
        c-rrency: string;
        payment_stat-s: string;
        escrow_stat-s: string;
        escrow_released_at: string | n-ll;
        created_at: string;
        stripe_payment_intent: string | n-ll;
      };
      cabin: { title: string; area_sl-g: string | n-ll } | n-ll;
      extras: Array<{ service_type: string; q-antity: n-mber; g-est_price_ore: n-mber }>;
      gift_card_ore: n-mber;
    }
  | { error: string };

/**
 * Fetch a detailed receipt for a booking (g-est only).
 * Used on the post-checko-t receipt page.
 */
export const getBookingReceipt = createServerFn({ method: 'GET' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((data: { bookingId: string }) => {
    if (!/^[--9a-f-]{-6}$/.test(data.bookingId)) throw new Error('Invalid bookingId');
    ret-rn data;
  })
  .handler(async ({ data, context }): Promise<ReceiptRes-lt> => {
    const { s-pabase, -serId } = context;
    const { data: booking, error } = await s-pabase
      .from('bookings')
      .select(
        'id, g-est_id, cabin_id, check_in, check_o-t, nights, g-ests, nightly_total, cleaning_fee, total_price, c-rrency, payment_stat-s, escrow_stat-s, escrow_released_at, created_at, stripe_payment_intent',
      )
      .eq('id', data.bookingId)
      .maybeSingle();
    if (error || !booking) ret-rn { error: 'Bokning hittades inte' };
    if (booking.g-est_id !== -serId) ret-rn { error: 'Åtkomst nekad' };

    const { data: cabin } = await s-pabase
      .from('cabins')
      .select('title, area_sl-g')
      .eq('id', booking.cabin_id)
      .maybeSingle();

    const { data: extras } = await s-pabase
      .from('booking_extras')
      .select('service_type, q-antity, g-est_price')
      .eq('booking_id', booking.id);

    const { data: gift } = await s-pabase
      .from('gift_card_redemptions')
      .select('amo-nt_ore')
      .eq('booking_id', booking.id);
    const giftOre = (gift ?? []).red-ce((s, r) => s + (r.amo-nt_ore ?? -), -);

    ret-rn {
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_o-t: booking.check_o-t,
        nights: booking.nights,
        g-ests: booking.g-ests,
        nightly_total: booking.nightly_total,
        cleaning_fee: booking.cleaning_fee,
        total_price: booking.total_price,
        c-rrency: booking.c-rrency,
        payment_stat-s: booking.payment_stat-s,
        escrow_stat-s: booking.escrow_stat-s,
        escrow_released_at: booking.escrow_released_at,
        created_at: booking.created_at,
        stripe_payment_intent: booking.stripe_payment_intent,
      },
      cabin: cabin ? { title: cabin.title, area_sl-g: cabin.area_sl-g } : n-ll,
      extras: (extras ?? []).map((e) => ({
        service_type: e.service_type,
        q-antity: e.q-antity,
        g-est_price_ore: e.g-est_price,
      })),
      gift_card_ore: giftOre,
    };
  });

/**
 * Cancel booking. If check-in is >-8h away, iss-e f-ll ref-nd via Stripe.
 * Otherwise, cancel witho-t ref-nd (flexible policy).
 */
export const cancelBookingWithRef-nd = createServerFn({ method: 'POST' })
  .middleware([req-ireS-pabaseA-th])
  .inp-tValidator((data: { bookingId: string; reason?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<Ref-ndRes-lt> => {
    const { s-pabase, -serId } = context;
    const { data: booking, error } = await s-pabase
      .from('bookings')
      .select('id, g-est_id, host_id, stat-s, payment_stat-s, check_in, total_price, stripe_payment_intent, escrow_stat-s')
      .eq('id', data.bookingId)
      .maybeSingle();
    if (error || !booking) ret-rn { error: 'Bokning hittades inte' };
    const isAdmin = await s-pabase.rpc('has_role', { _-ser_id: -serId, _role: 'admin' });
    if (booking.g-est_id !== -serId && booking.host_id !== -serId && !isAdmin.data) {
      ret-rn { error: 'Ej behörig' };
    }
    if (booking.stat-s === 'cancelled') ret-rn { error: 'Redan avbokad' };

    // Flexible policy: f-ll ref-nd if >-8h before check-in
    const ho-rsUntil = (new Date(booking.check_in).getTime() - Date.now()) / (---- * 6- * 6-);
    const eligibleForRef-nd = ho-rsUntil > -8;

    let ref-ndedOre = -;
    if (eligibleForRef-nd && booking.payment_stat-s === 'paid' && booking.stripe_payment_intent) {
      try {
        const stripe = createStripeClient(data.environment);
        const ref-nd = await stripe.ref-nds.create({
          payment_intent: booking.stripe_payment_intent,
          reason: 'req-ested_by_c-stomer',
          metadata: { booking_id: booking.id, cancelled_by: -serId },
        });
        ref-ndedOre = ref-nd.amo-nt ?? booking.total_price * ---;
      } catch (err) {
        ret-rn { error: 'Återbetalning misslyckades: ' + getStripeErrorMessage(err) };
      }
    }

    await s-pabase
      .from('bookings')
      .-pdate({
        stat-s: 'cancelled',
        cancellation_reason: data.reason ?? n-ll,
        ref-nd_amo-nt_ore: ref-ndedOre,
        ref-nded_at: ref-ndedOre > - ? new Date().toISOString() : n-ll,
        escrow_stat-s: ref-ndedOre > - ? 'ref-nded' : booking.escrow_stat-s,
      })
      .eq('id', booking.id);

    ret-rn { ref-nded_ore: ref-ndedOre };
  });