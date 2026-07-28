import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
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

async function guestEmailAndName(guestId: string): Promise<{ email: string | null; firstName: string | undefined }> {
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin().auth.admin.getUserById(guestId),
    admin().from('profiles').select('full_name').eq('id', guestId).maybeSingle(),
  ]);
  return {
    email: authUser?.user?.email ?? null,
    firstName: profile?.full_name?.split(' ')[0] ?? undefined,
  };
}

async function sendCheckinNotifications(origin: string) {
  // Skicka påminnelsen inom ett 24h-fönster före incheckning: dagens datum
  // och morgondagen (fångar även bokningar som råkat missas tidigare).
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const windowEnd = tomorrow.toISOString().slice(0, 10);
  const { data: rows, error } = await admin()
    .from('bookings')
    .select('id, guest_id, cabin_id, check_in, check_out, host_id')
    .lte('check_in', windowEnd)
    .eq('payment_status', 'paid')
    .in('escrow_status', ['holding', 'released'])
    .is('checkin_notified_at', null)
    .limit(50);
  if (error) throw error;
  const results: Array<{ id: string; sent: boolean }> = [];
  for (const b of rows ?? []) {
    const [{ email, firstName }, { data: cabin }, { data: hostProfile }] = await Promise.all([
      guestEmailAndName(b.guest_id),
      admin().from('cabins').select('title, area_slug').eq('id', b.cabin_id).maybeSingle(),
      admin().from('profiles').select('full_name').eq('id', b.host_id).maybeSingle(),
    ]);
    if (!email) {
      await admin().from('bookings').update({ checkin_notified_at: new Date().toISOString() }).eq('id', b.id);
      results.push({ id: b.id, sent: false });
      continue;
    }
    const res = await sendInternalTemplatedEmail({
      templateName: 'checkin-reminder',
      recipientEmail: email,
      idempotencyKey: `checkin-${b.id}`,
      bookingId: b.id,
      origin,
      templateData: {
        guestName: firstName,
        cabinName: cabin?.title ?? 'din stuga',
        areaName: cabin?.area_slug ?? '',
        ...buildBookingEmailFields({ id: b.id, check_in: b.check_in, check_out: b.check_out }),
        hostName: hostProfile?.full_name?.split(' ')[0] ?? 'värden',
      },
    });
    if (res.ok) {
      await admin().from('bookings').update({ checkin_notified_at: new Date().toISOString() }).eq('id', b.id);
    }
    results.push({ id: b.id, sent: res.ok });
  }
  return results;
}

async function sendPayoutNotifications(origin: string) {
  const { data: rows, error } = await admin()
    .from('bookings')
    .select('id, guest_id, cabin_id, host_id, check_in, total_price')
    .eq('escrow_status', 'released')
    .is('payout_notified_at', null)
    .limit(50);
  if (error) throw error;
  const results: Array<{ id: string; sent: boolean }> = [];
  for (const b of rows ?? []) {
    const [{ email, firstName }, { data: cabin }, { data: hostProfile }] = await Promise.all([
      guestEmailAndName(b.guest_id),
      admin().from('cabins').select('title').eq('id', b.cabin_id).maybeSingle(),
      admin().from('profiles').select('full_name').eq('id', b.host_id).maybeSingle(),
    ]);
    if (!email) {
      await admin().from('bookings').update({ payout_notified_at: new Date().toISOString() }).eq('id', b.id);
      results.push({ id: b.id, sent: false });
      continue;
    }
    const res = await sendInternalTemplatedEmail({
      templateName: 'payout-released',
      recipientEmail: email,
      idempotencyKey: `payout-${b.id}`,
      bookingId: b.id,
      origin,
      templateData: {
        guestName: firstName,
        cabinName: cabin?.title ?? 'din stuga',
        hostName: hostProfile?.full_name?.split(' ')[0] ?? 'värden',
        ...buildBookingEmailFields({ id: b.id, check_in: b.check_in }),
        totalKr: b.total_price,
      },
    });
    if (res.ok) {
      await admin().from('bookings').update({ payout_notified_at: new Date().toISOString() }).eq('id', b.id);
    }
    results.push({ id: b.id, sent: res.ok });
  }
  return results;
}

/**
 * Fallback: fångar bokningar där Stripe-webhooken av någon anledning inte
 * hann skicka bekräftelsen (payment_status = 'paid' men payment_notified_at
 * är null). Kör varje timme via samma cron som övriga notiser.
 */
async function sendMissedBookingConfirmations(origin: string) {
  const { data: rows, error } = await admin()
    .from('bookings')
    .select('id, guest_id, cabin_id, check_in, check_out, host_id, nights, guests, total_price')
    .eq('payment_status', 'paid')
    .is('payment_notified_at', null)
    .limit(25);
  if (error) throw error;
  const results: Array<{ id: string; sent: boolean }> = [];
  for (const b of rows ?? []) {
    const [{ email, firstName }, { data: cabin }] = await Promise.all([
      guestEmailAndName(b.guest_id),
      admin().from('cabins').select('title, area_slug').eq('id', b.cabin_id).maybeSingle(),
    ]);
    if (!email) {
      await admin().from('bookings').update({ payment_notified_at: new Date().toISOString() }).eq('id', b.id);
      results.push({ id: b.id, sent: false });
      continue;
    }
    const fields = buildBookingEmailFields({
      id: b.id,
      check_in: b.check_in,
      check_out: b.check_out,
    });
    const shared = {
      guestName: firstName,
      cabinName: cabin?.title ?? 'din stuga',
      areaName: cabin?.area_slug ?? '',
      ...fields,
      nights: b.nights,
      guests: b.guests,
      totalKr: b.total_price,
    };
    const confirmRes = await sendInternalTemplatedEmail({
      templateName: 'booking-confirmation',
      recipientEmail: email,
      idempotencyKey: `booking-confirm-${b.id}`,
      bookingId: b.id,
      origin,
      templateData: shared,
    });
    const escrowRes = await sendInternalTemplatedEmail({
      templateName: 'escrow-activated',
      recipientEmail: email,
      idempotencyKey: `escrow-activated-${b.id}`,
      bookingId: b.id,
      origin,
      templateData: {
        guestName: firstName,
        cabinName: shared.cabinName,
        totalKr: shared.totalKr,
        checkIn: shared.checkIn,
        checkInLabel: shared.checkInLabel,
        bookingRef: shared.bookingRef,
        payoutAtLabel: shared.payoutAtLabel,
      },
    });
    if (confirmRes.ok && escrowRes.ok) {
      await admin().from('bookings').update({ payment_notified_at: new Date().toISOString() }).eq('id', b.id);
    }
    results.push({ id: b.id, sent: confirmRes.ok && escrowRes.ok });
  }
  return results;
}

export const Route = createFileRoute('/api/public/hooks/booking-notifications')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = new URL(request.url).origin;
        try {
          const [confirmation, checkin, payout] = await Promise.all([
            sendMissedBookingConfirmations(origin),
            sendCheckinNotifications(origin),
            sendPayoutNotifications(origin),
          ]);
          return Response.json({ ok: true, confirmation, checkin, payout });
        } catch (e) {
          console.error('booking-notifications hook error', e);
          return Response.json({ ok: false, error: String(e) }, { status: 500 });
        }
      },
    },
  },
});