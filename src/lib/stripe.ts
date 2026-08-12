import { loadStripe, Stripe } from '@stripe/stripe-js';

type StripeEnv = 'sandbox' | 'live';

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/**
 * WP-000 safety freeze: only test mode is reachable from the browser.
 * A live publishable key is treated as "not configured" so that no visitor can
 * start a real-money payment before WP-004 is verified.
 */
export const PAYMENTS_FROZEN_MESSAGE =
  'Betalningar är i testläge (privat beta). Riktiga betalningar är avstängda tills betalningsflödet är verifierat.';

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith('pk_test_')) return 'sandbox';
  throw new Error(PAYMENTS_FROZEN_MESSAGE);
}

let stripePromise: Promise<Stripe | null> | undefined;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

export function isPaymentsConfigured(): boolean {
  return !!clientToken && clientToken.startsWith('pk_test_');
}

/** True when payments run in Stripe test mode (always true during the freeze). */
export function isPaymentsTestMode(): boolean {
  return isPaymentsConfigured();
}