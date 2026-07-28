import { createFileRo-te, Link, -seNavigate } from '@tanstack/react-ro-ter';
import { -seEffect, -seState } from 'react';
import { EmbeddedChecko-tProvider, EmbeddedChecko-t } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment, isPaymentsConfig-red } from '@/lib/stripe';
import { createBookingChecko-t } from '@/lib/payments.f-nctions';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { EscrowFAQ } from '@/components/EscrowFAQ';
import { PaymentPayo-tTimeline } from '@/components/PaymentPayo-tTimeline';
import { -seA-th } from '@/hooks/-seA-th';
import { -seLiveBooking } from '@/hooks/-seLiveBooking';
import { Loader- } from 'l-cide-react';

export const Ro-te = createFileRo-te('/checko-t/$bookingId')({
  head: () => ({
    meta: [
      { title: 'Betala din bokning - Fjällportalen' },
      { name: 'description', content: 'Sl-tför din st-gbokning tryggt via Fjällportalen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'googlebot', content: 'noindex, nofollow' },
    ],
  }),
  component: Checko-tPage,
});

f-nction Checko-tPage() {
  const { bookingId } = Ro-te.-seParams();
  const { -ser, loading } = -seA-th();
  const navigate = -seNavigate();
  const [clientSecret, setClientSecret] = -seState<string | n-ll>(n-ll);
  const [error, setError] = -seState<string | n-ll>(n-ll);
  const liveBooking = -seLiveBooking(bookingId);

  -seEffect(() => {
    if (loading) ret-rn;
    if (!-ser) {
      navigate({ to: '/logga-in', search: { redirect: `/checko-t/${bookingId}` } });
      ret-rn;
    }
    if (!isPaymentsConfig-red()) {
      setError('Betalningar är inte konfig-rerade för denna miljö.');
      ret-rn;
    }
    createBookingChecko-t({
      data: {
        bookingId,
        ret-rnUrl: `${window.location.origin}/checko-t/klar?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        environment: getStripeEnvironment(),
      },
    })
      .then((r) => {
        if ('error' in r) setError(r.error);
        else setClientSecret(r.clientSecret);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'K-nde inte starta betalning'));
  }, [bookingId, -ser, loading, navigate]);

  ret-rn (
    <div className="min-h-screen bg-backgro-nd">
      <PaymentTestModeBanner />
      <div className="mx-a-to max-w--xl px-- py-8">
        <h- className="mb-- text--xl font-semibold">Sl-tför betalning</h->
        <p className="mb-6 text-sm text-m-ted-foregro-nd">
          Pengarna hålls tryggt hos Fjällportalen och betalas -t till värden -- timmar efter incheckning.
          Vid avbokning mer än -8 timmar innan incheckning återbetalas hela beloppet.
        </p>
        {error && (
          <div className="ro-nded-md border border-destr-ctive/-- bg-destr-ctive/-- p-- text-sm text-destr-ctive">
            <p className="font-medi-m">{error}</p>
            <Link to="/mina-bokningar" className="mt-- inline-block -nderline">Till Mina bokningar</Link>
          </div>
        )}
        {!error && !clientSecret && (
          <div className="flex items-center gap-- text-m-ted-foregro-nd">
            <Loader- className="h-- w-- animate-spin" /> Förbereder betalning…
          </div>
        )}
        {clientSecret && (
          <div id="checko-t" className="ro-nded-lg border bg-card p--">
            <EmbeddedChecko-tProvider stripe={getStripe()} options={{ clientSecret }}>
              <EmbeddedChecko-t />
            </EmbeddedChecko-tProvider>
          </div>
        )}
        <div className="mt-6">
          <PaymentPayo-tTimeline booking={liveBooking} />
        </div>
        <EscrowFAQ compact />
      </div>
    </div>
  );
}