import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { sendInternalTemplatedEmail } from '@/lib/email/send-internal';

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
  const today = new Date().toISOString().slice(0, 10);
  const { data: rows, error } = await admin()
    .from('bookings')
    .select('id, guest_id, cabin_id, check_in, check_out, host_id')
    .lte('check_in', today)
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
      origin,
      templateData: {
        guestName: firstName,
        cabinName: cabin?.title ?? 'din stuga',
        areaName: cabin?.area_slug ?? '',
        checkIn: b.check_in,
        checkOut: b.check_out,
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
      origin,
      templateData: {
        guestName: firstName,
        cabinName: cabin?.title ?? 'din stuga',
        hostName: hostProfile?.full_name?.split(' ')[0] ?? 'värden',
        checkIn: b.check_in,
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

export const Route = createFileRoute('/api/public/hooks/booking-notifications')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = new URL(request.url).origin;
        try {
          const [checkin, payout] = await Promise.all([
            sendCheckinNotifications(origin),
            sendPayoutNotifications(origin),
          ]);
          return Response.json({ ok: true, checkin, payout });
        } catch (e) {
          console.error('booking-notifications hook error', e);
          return Response.json({ ok: false, error: String(e) }, { status: 500 });
        }
      },
    },
  },
});