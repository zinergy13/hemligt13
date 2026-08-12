# Fjällportalen — Active Lovable Entry Plan

**Status:** Private beta / rebuild stabilization
**Authoritative specification:** `docs/LOVABLE_MASTER_AUDIT_AND_IMPLEMENTATION_PLAN.md` version 2.0
**Rule:** Read the master document in full before changing application code, Supabase, Stripe, scheduled jobs, email, or production configuration.

## Fixed product direction

The PRD is reference material, not the implementation authority. When it conflicts with the repository, production behavior, or the master audit, follow the master audit.

- Fjällportalen is a managed Swedish cabin-rental marketplace.
- Guests pay in SEK through Stripe Checkout.
- Hosts onboard through Stripe-hosted Connect onboarding and use the Express Dashboard.
- Use Stripe Connect destination charges because each booking has one host.
- Use Accounts v2 and recipient transfer capability where supported by the selected Stripe configuration.
- Connected host accounts use a platform-controlled manual payout schedule. Fjällportalen initiates the bank payout after the approved post-check-in release rule.
- Never call this escrow or claim Fjällportalen holds money in a segregated account. Stripe handles payment; Fjällportalen controls payout scheduling.
- The guest pays a transparent 400 SEK Fjällportalen service fee per booking. Treat it as VAT-inclusive until Swedish accountant validation is recorded.
- Stripe manual payouts in Sweden have a 90-day holding limit. For reservations more than 30 days away, collect the 400 SEK service/reservation fee at booking and collect accommodation through a destination charge 30 days before check-in. For near-term reservations, use one Checkout for rent plus fee.
- Card is the launch payment method. Do not implement direct Swish/bank instructions or a parallel payment path.
- Do not collect guest personnummer at launch. Stripe-hosted onboarding handles host identity/KYC.
- Use the 27 canonical mountain areas in the project and generate all counts from that source.
- Defer gift-card sales, third-party/multi-provider extras, Swish, native apps, multi-currency, and white-label.

## Execution order

Lovable must execute one work packet at a time and update the tracker and change log in the master document:

1. `WP-000` — freeze unsafe payment/payout claims and live money behavior.
   Status: DONE 2026-08-12 — evidence in `docs/decisions/WP-000-safety-freeze.md`.
2. `WP-001` — reconcile actual Lovable Cloud/Supabase production state.
3. `WP-002` — repair package manager, lockfile, build, and CI reproducibility. This may run alongside WP-001.
4. `WP-003` — build server-authoritative quotes and atomic reservation holds.
5. `WP-004` — implement Stripe Connect destination charges and controlled payouts in sandbox.
6. `WP-005` — legal, privacy, account security, and accountant/provider validation.
7. `WP-006` through `WP-012` — availability/iCal, search, extras scope, email/jobs, accounting, localization, and controlled public launch.
8. `WP-013` — future discovery only after the web marketplace is stable.

## Hard safety rules

- Keep the site password-gated until every public-launch gate passes.
- Use Stripe sandbox/test configuration until legal/accounting approval and the complete payment test matrix pass.
- Payment environment is server-owned; never accept `sandbox` or `live` from a browser request.
- Browser clients submit booking intent and option IDs, never authoritative prices.
- No booking is paid, transferred, paid out, refunded, or disputed because a database timestamp says so. Persist and verify the provider object/event.
- Never charge accommodation so early that the planned post-check-in payout can breach Stripe's applicable manual-payout holding limit.
- Only `payout.paid` can trigger host-paid confirmation copy.
- Every provider command uses an idempotency key and durable attempt/event record.
- Every exposed Supabase table/view/RPC has explicit grants and least-privilege RLS/authorization tests.
- Do not create a second pricing, payment, email, or cron implementation.
- Stop and report missing live/provider access; never simulate production verification.

## First Lovable prompt

```text
Read docs/LOVABLE_MASTER_AUDIT_AND_IMPLEMENTATION_PLAN.md version 2.0 in full.
Execute only WP-000.

Before editing, report:
- current payment/payout code paths and customer claims;
- whether any live Stripe mode is reachable;
- relevant Lovable Cloud/Supabase functions, jobs, secrets by name only, and deployment state;
- exact files/configuration to change;
- blockers or production access that must be provided.

Then implement the WP-000 safety freeze, add tests where applicable, update the master tracker and change log, and report evidence. Do not begin WP-001 or payment implementation.
```
