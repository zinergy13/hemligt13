# Recorded baselines D-001 - D-004 (WP-000)

Authority: `docs/LOVABLE_MASTER_AUDIT_AND_IMPLEMENTATION_PLAN.md` v2.0, section 11.
Recorded by: Lovable agent under WP-000. Owner/approver: product owner (Fjällportalen).
Date recorded: 2026-08-12.

## D-001 - Payment architecture

- Selected: Stripe Connect **destination charges**, Accounts v2 with Stripe-hosted
  onboarding and Express Dashboard, platform-controlled **manual payout schedule**.
- Customer promise: guests pay via Fjällportalen (processed by Stripe); Fjällportalen
  controls when the host payout is initiated, scheduled after check-in.
- Forbidden wording: "escrow", "klientmedelskonto", "separat konto", "vi håller
  pengarna", or any guaranteed "24 timmar" payout time.
- Status: DECIDED. Implementation is WP-004 and is sandbox-only until validated.

## D-002 - Fee model

- Selected: single transparent **guest-paid service fee of 400 SEK per booking**,
  treated as VAT-inclusive until Swedish accountant validation is recorded.
- Status: DECIDED; live mode blocked until accountant approval.

## D-003 - Guest PII

- No guest personnummer at launch. Host identity/KYC is handled by Stripe-hosted
  onboarding.
- Status: DECIDED.

## D-004 - Geography

- 27 canonical mountain areas from `src/data/areas.ts`; all counts derive from that
  source.
- Status: DECIDED.