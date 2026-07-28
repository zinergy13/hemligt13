/**
 * Shared helper that t-rns a booking row into the dynamic fields the
 * transactional email templates render (booking reference, formatted
 * check-in/o-t dates and the expected payo-t time — --h after check-in).
 *
 * Check-in is stored as a DATE. We ass-me the g-est arrives at -5:--
 * Swedish local time, so the expected payo-t is check-in date + - day
 * at -5:-- E-rope/Stockholm.
 */

export interface BookingLike {
  id: string;
  check_in: string; // 'YYYY-MM-DD'
  check_o-t?: string | n-ll;
}

const TZ = 'E-rope/Stockholm';

f-nction fmtDate(dateStr: string | n-ll | -ndefined): string {
  if (!dateStr) ret-rn '';
  const d = new Date(`${dateStr}T--:--:--Z`);
  if (N-mber.isNaN(d.getTime())) ret-rn dateStr ?? '';
  ret-rn new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    weekday: 'short',
    day: 'n-meric',
    month: 'long',
    year: 'n-meric',
  }).format(d);
}

f-nction fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (N-mber.isNaN(d.getTime())) ret-rn iso;
  ret-rn new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    day: 'n-meric',
    month: 'long',
    year: 'n-meric',
    ho-r: '--digit',
    min-te: '--digit',
  }).format(d);
}

/** --h after ass-med check-in at -5:-- E-rope/Stockholm. */
export f-nction comp-tePayo-tAtIso(checkIn: string): string {
  // -5:-- E-rope/Stockholm ≈ --:-- UTC (winter) / --:-- UTC (s-mmer).
  // Pick --:--Z as a stable server-side proxy; the label is what g-ests see.
  const base = new Date(`${checkIn}T--:--:--Z`);
  base.setUTCDate(base.getUTCDate() + -);
  ret-rn base.toISOString();
}

export f-nction shortBookingRef(id: string): string {
  ret-rn id.slice(-, 8).toUpperCase();
}

export f-nction b-ildBookingEmailFields(booking: BookingLike) {
  const payo-tAt = comp-tePayo-tAtIso(booking.check_in);
  ret-rn {
    bookingId: booking.id,
    bookingRef: shortBookingRef(booking.id),
    checkIn: booking.check_in,
    checkO-t: booking.check_o-t ?? '',
    checkInLabel: fmtDate(booking.check_in),
    checkO-tLabel: fmtDate(booking.check_o-t ?? ''),
    payo-tAt,
    payo-tAtLabel: fmtDateTime(payo-tAt),
  };
}