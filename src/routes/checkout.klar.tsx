import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/checkout/klar')({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
    booking_id: typeof s.booking_id === 'string' ? s.booking_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Bokning bekräftad — Fjällportalen' },
      { name: 'description', content: 'Tack för din bokning hos Fjällportalen.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { booking_id } = Route.useSearch();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
      <h1 className="mb-2 text-3xl font-semibold">Tack! Din bokning är bekräftad</h1>
      <p className="mb-6 text-muted-foreground">
        Pengarna hålls tryggt hos Fjällportalen och betalas ut till värden 24 timmar efter incheckning.
        Värden får en notis och hör av sig med praktisk information inför vistelsen.
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/mina-bokningar" className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
          Mina bokningar
        </Link>
        {booking_id && (
          <Link
            to="/meddelanden/$bookingId"
            params={{ bookingId: booking_id }}
            className="rounded-md border px-4 py-2 hover:bg-accent"
          >
            Meddela värden
          </Link>
        )}
      </div>
    </div>
  );
}