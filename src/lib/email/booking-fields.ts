/**
 * Shared helper that turns a booking row into the dynamic fields the
 * transactional email templates render (booking reference, formatted
 * check-in/out dates and the expected payout time — 24h after check-in).
 *
 * Check-in is stored as a DATE. We assume the guest arrives at 15:00
 * Swedish local time, so the expected payout is check-in date + 1 day
 * at 15:00 Europe/Stockholm.
 */

export interface BookingLike {
  id: string;
  check_in: string; // 'YYYY-MM-DD'
  check_out?: string | null;
}

const TZ = 'Europe/Stockholm';

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr ?? '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** 24h after assumed check-in at 15:00 Europe/Stockholm. */
export function computePayoutAtIso(checkIn: string): string {
  // 15:00 Europe/Stockholm ≈ 13:00 UTC (winter) / 14:00 UTC (summer).
  // Pick 13:00Z as a stable server-side proxy; the label is what guests see.
  const base = new Date(`${checkIn}T13:00:00Z`);
  base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString();
}

export function shortBookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function buildBookingEmailFields(booking: BookingLike) {
  const payoutAt = computePayoutAtIso(booking.check_in);
  return {
    bookingId: booking.id,
    bookingRef: shortBookingRef(booking.id),
    checkIn: booking.check_in,
    checkOut: booking.check_out ?? '',
    checkInLabel: fmtDate(booking.check_in),
    checkOutLabel: fmtDate(booking.check_out ?? ''),
    payoutAt,
    payoutAtLabel: fmtDateTime(payoutAt),
  };
}