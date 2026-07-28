import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment, isPaymentsConfigured } from '@/lib/stripe';
import { createBookingCheckout } from '@/lib/payments.functions';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { EscrowFAQ } from '@/components/EscrowFAQ';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/checkout/$bookingId')({
  head: () => ({
    meta: [
      { title: 'Betala din bokning — Fjällportalen' },
      { name: 'description', content: 'Slutför din stugbokning tryggt via Fjällportalen.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { bookingId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: '/logga-in', search: { redirect: `/checkout/${bookingId}` } });
      return;
    }
    if (!isPaymentsConfigured()) {
      setError('Betalningar är inte konfigurerade för denna miljö.');
      return;
    }
    createBookingCheckout({
      data: {
        bookingId,
        returnUrl: `${window.location.origin}/checkout/klar?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        environment: getStripeEnvironment(),
      },
    })
      .then((r) => {
        if ('error' in r) setError(r.error);
        else setClientSecret(r.clientSecret);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Kunde inte starta betalning'));
  }, [bookingId, user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Slutför betalning</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Pengarna hålls tryggt hos Fjällportalen och betalas ut till värden 24 timmar efter incheckning.
          Vid avbokning mer än 48 timmar innan incheckning återbetalas hela beloppet.
        </p>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">{error}</p>
            <Link to="/mina-bokningar" className="mt-2 inline-block underline">Till Mina bokningar</Link>
          </div>
        )}
        {!error && !clientSecret && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Förbereder betalning…
          </div>
        )}
        {clientSecret && (
          <div id="checkout" className="rounded-lg border bg-card p-2">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
        <EscrowFAQ compact />
      </div>
    </div>
  );
}