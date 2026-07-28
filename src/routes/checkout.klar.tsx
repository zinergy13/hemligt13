import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, MessageSquare, Printer, ShieldCheck } from 'lucide-react';
import { getBookingReceipt } from '@/lib/payments.functions';
import { PaymentPayoutTimeline } from '@/components/PaymentPayoutTimeline';
import { PayoutFAQ } from '@/components/PayoutFAQ';
import { useLiveBooking } from '@/hooks/useLiveBooking';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/checkout/klar')({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
    booking_id: typeof s.booking_id === 'string' ? s.booking_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Kvitto — Fjällportalen' },
      { name: 'description', content: 'Kvitto och detaljer för din bokning hos Fjällportalen.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CheckoutReceipt,
});

const kr = (ore: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(ore / 100);

const extraLabels: Record<string, string> = {
  cleaning: 'Extra städning',
  groceries: 'Matkasse',
  firewood: 'Ved',
  linen: 'Lakan & handdukar',
};

function CheckoutReceipt() {
  const { booking_id } = Route.useSearch();
  const fetchReceipt = useServerFn(getBookingReceipt);

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking-receipt', booking_id],
    queryFn: () => fetchReceipt({ data: { bookingId: booking_id! } }),
    enabled: !!booking_id,
    refetchInterval: (q) => {
      const r = q.state.data as any;
      return r && 'booking' in r && r.booking.payment_status !== 'paid' ? 2000 : false;
    },
  });

  const live = useLiveBooking(booking_id ?? null);

  if (!booking_id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-3xl font-semibold">Tack för din bokning</h1>
        <p className="text-muted-foreground">Vi kunde inte hitta din bokningsreferens. Kolla dina bokningar nedan.</p>
        <Link to="/mina-bokningar" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Mina bokningar
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data || 'error' in data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Kunde inte hämta kvitto</h1>
        <p className="text-muted-foreground">{(data && 'error' in data && data.error) || 'Försök igen om en stund.'}</p>
        <Link to="/mina-bokningar" className="mt-6 inline-block rounded-md border px-4 py-2">
          Till mina bokningar
        </Link>
      </div>
    );
  }

  const { booking, cabin, extras, gift_card_ore } = data;
  const isPaid = booking.payment_status === 'paid';

  const nightlyOre = booking.nightly_total * 100;
  const cleaningOre = booking.cleaning_fee * 100;
  const extrasOre = extras.reduce((s, e) => s + e.guest_price_ore * e.quantity, 0);
  const totalOre = booking.total_price * 100;

  const checkIn = new Date(booking.check_in);
  const payoutDate = new Date(checkIn.getTime() + 24 * 3600 * 1000);
  const fmtDate = (d: Date) => d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:py-4">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold">Tack — din bokning är {isPaid ? 'bekräftad' : 'registrerad'}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Pengarna ligger tryggt hos Fjällportalen och betalas ut till värden{' '}
          <strong>24 timmar efter din incheckning ({fmtDate(payoutDate)})</strong>.
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap justify-center gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          <Printer className="h-4 w-4" /> Skriv ut / spara PDF
        </button>
        <Link
          to="/meddelanden/$bookingId"
          params={{ bookingId: booking.id }}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          <MessageSquare className="h-4 w-4" /> Meddela värden
        </Link>
        <Link to="/mina-bokningar" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
          <Download className="h-4 w-4" /> Mina bokningar
        </Link>
      </div>

      {/* Receipt card */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b p-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Kvitto</div>
            <div className="mt-1 font-mono text-sm">#{booking.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{new Date(booking.created_at).toLocaleString('sv-SE')}</div>
            <div className="mt-1">
              Status:{' '}
              <span className={isPaid ? 'font-medium text-primary' : 'font-medium text-amber-600'}>
                {isPaid ? 'Betald' : 'Behandlas'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b p-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Stuga</div>
            <div className="mt-1 font-medium">{cabin?.title ?? 'Stuga'}</div>
            {cabin?.area_slug && <div className="text-sm text-muted-foreground capitalize">{cabin.area_slug.replace(/-/g, ' ')}</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Vistelse</div>
            <div className="mt-1 font-medium">
              {new Date(booking.check_in).toLocaleDateString('sv-SE')} → {new Date(booking.check_out).toLocaleDateString('sv-SE')}
            </div>
            <div className="text-sm text-muted-foreground">
              {booking.nights} nätter · {booking.guests} gäster
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2">Boende ({booking.nights} nätter)</td>
                <td className="py-2 text-right tabular-nums">{kr(nightlyOre)}</td>
              </tr>
              {booking.cleaning_fee > 0 && (
                <tr className="border-b">
                  <td className="py-2">Slutstädning</td>
                  <td className="py-2 text-right tabular-nums">{kr(cleaningOre)}</td>
                </tr>
              )}
              {extras.map((e, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">
                    {extraLabels[e.service_type] ?? e.service_type}
                    {e.quantity > 1 && <span className="text-muted-foreground"> × {e.quantity}</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{kr(e.guest_price_ore * e.quantity)}</td>
                </tr>
              ))}
              {gift_card_ore > 0 && (
                <tr className="border-b text-primary">
                  <td className="py-2">Presentkort</td>
                  <td className="py-2 text-right tabular-nums">−{kr(gift_card_ore)}</td>
                </tr>
              )}
              <tr>
                <td className="pt-4 text-base font-semibold">Totalt betalt</td>
                <td className="pt-4 text-right text-base font-semibold tabular-nums">{kr(totalOre)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Alla priser inkl. moms. Betalning hanteras av Fjällportalen AB.
          </p>
        </div>
      </div>

      {/* Escrow explanation */}
      <div className="mt-6 rounded-lg border bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="mb-1 font-semibold">Så fungerar din betalning</div>
            <p className="text-muted-foreground">
              Hela beloppet på <strong>{kr(totalOre)}</strong> hålls tryggt hos Fjällportalen fram till din
              vistelse. Värden får utbetalning först{' '}
              <strong>{fmtDate(payoutDate)}</strong> — 24 timmar efter din incheckning. Om något är fel med
              stugan hjälper vi dig innan pengarna släpps.
            </p>
          </div>
        </div>
      </div>

      {/* Live timeline */}
      <div className="mt-6">
        <PaymentPayoutTimeline
          booking={
            live ?? {
              status: isPaid ? 'confirmed' : 'pending',
              payment_status: booking.payment_status,
              escrow_status: booking.escrow_status,
              escrow_released_at: booking.escrow_released_at,
              check_in: booking.check_in,
            }
          }
        />
      </div>

      <PayoutFAQ />

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Ett bekräftelsemejl med detta kvitto har skickats till din e-post. Du hittar det även under Mina bokningar.
      </p>
    </div>
  );
}