# WP-000 - Safety freeze evidence

Date: 2026-08-12. Actor: Lovable agent. Scope: freeze unsafe payment/payout
claims and real-money behavior. No WP-001+ work performed.

## 1. No production user can create a live charge

- `src/lib/stripe.server.ts`: added `resolvePaymentEnv()`. The payment mode is read
  from the server-only `PAYMENTS_ENV` variable and anything other than `sandbox`
  throws. `createStripeClient()` and `verifyWebhook()` additionally reject a
  non-sandbox environment.
- `src/lib/payments.functions.ts`: `environment` was removed from the input of
  `createBookingCheckout` and `cancelBookingWithRefund`; the browser can no longer
  influence the payment mode.
- `src/routes/api.public.payments.webhook.ts`: the `?env=` query parameter is
  ignored; the mode comes from server configuration.
- `src/lib/stripe.ts`: a `pk_live_` publishable key is now treated as
  "not configured"; only `pk_test_` enables checkout.
- `src/components/PaymentTestModeBanner.tsx`: non-test configuration renders an
  explicit "real payments are disabled" banner instead of nothing.

## 2. No email or UI claims a host was paid without provider evidence

- Migration (2026-08-12): `cron.unschedule('release-escrow-hourly')` and
  `public.release_eligible_escrow()` rewritten as a no-op. A timer can no longer
  mark a booking as released.
- `src/routes/api.public.hooks.booking-notifications.ts`: `sendPayoutNotifications`
  is disabled (`PAYOUT_NOTIFICATIONS_ENABLED = false`) and returns a disabled
  marker. Re-enable only in WP-004 on a verified `payout.paid` event.
- Email templates reworded: `payout-released` no longer states money was released,
  `escrow-activated` no longer claims funds are held by Fjällportalen,
  `booking-confirmation` and `checkin-reminder` no longer promise a 24-hour payout.
- Guest-facing UI reworded: `EscrowFAQ`, `PayoutFAQ`, `TrustPaymentBanner`,
  `PaymentPayoutTimeline`, `HostPayoutForm`, `BookingForm`, `checkout/$bookingId`,
  `checkout/klar`, `index`, `hur-det-funkar`, `hyr-ut`, `om-oss`, `kontakt`,
  `mina-bokningar`, `sok`, `omrade/$slug`, `stuga/$slug`, `vard/faktura`, and the
  root OG/JSON-LD metadata.
- Copy inventory rule now enforced by `src/test/wp000-payment-claims.test.ts`.

## 3. One payment and fee model recorded

- See `docs/decisions/D-001-D-004-baselines.md` (owner: product owner, recorded
  2026-08-12).

## Remaining risk / blockers

- The site stays password-gated (`SITE_PASSWORD`); do not remove.
- Live Stripe credentials and the accountant validation for D-002 are not
  available; live mode remains hard-blocked in code.
- `bookings.escrow_status` column and related fields still exist and will be
  replaced by the WP-004 payout state machine.