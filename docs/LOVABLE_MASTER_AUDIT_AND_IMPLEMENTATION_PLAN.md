# Fjällportalen — Lovable Master Audit and Implementation Plan

**Document version:** 2.0
**Audit date:** 2026-07-31
**Repository branch audited:** `main` at `e2df26e`
**Source PRD:** Fjällportalen PRD v2.0, dated 2026-07-28
**Intended operator:** Lovable, Fjällportalen product owner, and technical reviewers
**Current release verdict:** **NOT READY FOR PUBLIC LAUNCH OR REAL-MONEY PAYMENTS**

---

## 1. How Lovable must use this document

This file is the authoritative execution tracker until the product owner replaces it with a newer version. `.lovable/plan.md` is the concise Lovable entry point and must remain aligned with this master document.

Lovable must follow these rules on every implementation pass:

1. Read this entire document before changing code or the Supabase schema.
2. Work on one numbered work packet at a time, in dependency order.
3. Implement the payment architecture selected in D-001. Do not reintroduce direct Swish/bank payments or a second payment path.
4. Before a database change, inspect the live Lovable Cloud/Supabase schema, policies, grants, functions, cron jobs, advisors, and migration history. Repository migrations alone are not proof of production state.
5. Create reversible migrations, review generated SQL, and test with `anon`, authenticated guest, host, admin, and service/secret-key contexts as applicable.
6. Never mark a feature complete because a route, component, table, or migration exists. Completion requires passing acceptance criteria and recorded evidence.
7. After each work packet, update the tracker in section 11 and append an entry to the change log in section 16.
8. Keep Swedish customer-facing copy consistent across UI, email, metadata, structured data, invoices, and policies.
9. Do not introduce another parallel implementation of payments, email, pricing, or cron. Consolidate around one documented path.
10. Stop and report a blocker if external configuration, a legal/business choice, or production access is required. Do not simulate completion.

### Allowed status values

- `TODO` — not started.
- `IN PROGRESS` — actively being implemented.
- `BLOCKED` — awaiting a named decision, credential, provider setup, or external review.
- `DECIDED` — product/architecture direction is fixed; implementation may still have dependencies.
- `CODE COMPLETE` — implemented locally but not proven in a production-like environment.
- `VERIFIED STAGING` — acceptance criteria passed in an isolated/staging environment.
- `VERIFIED PROD` — production configuration and smoke tests passed with evidence.

---

## 2. Executive audit verdict

The repository contains a substantial prototype: 57 route files, host/admin surfaces, Supabase migrations, pricing UI, iCal code, email templates, invoices, reviews, messaging, favorites, and a Stripe Checkout flow. It is not, however, in the state claimed by PRD v2.0.

The most important findings are:

- The PRD says Fjällportalen takes payment and releases escrow. The earlier Lovable plan said Fjällportalen handled no money and guests paid hosts directly. The repository still contains artifacts from both models.
- The current “escrow release” changes a database status only. It does not create a Stripe Connect transfer or payout. The system can send a “payout released” email without moving money.
- The client computes seasonal and dynamic prices, but the database trigger validates only a base-price floor. It can reject legitimate discounts and still accept a manipulated high-season price.
- A caller can submit `sandbox` or `live` as an input to the server checkout function. Payment environment must be server-owned.
- Instant-book reservations become `confirmed` before payment and have no expiry path, so abandoned checkouts can block inventory indefinitely.
- The deployed `fjallportalen.com` site is password-gated as “demoläge.” The PRD’s `Live` and SEO-complete statuses are false in the current deployment.
- A credentialed, signed-out walkthrough behind the demo gate confirms that the polished public UI overstates current behavior: “Hur det funkar” advertises date, bed, ski-in/ski-out, and map/list search that `/sok` does not provide; pages say 21 areas while the UI exposes 27.
- The product collects or plans to collect high-risk PII, including Swedish personal identity numbers, but has no visible privacy policy, terms route, retention/deletion workflow, or documented legal basis.
- Only three test files exist. CI runs unit tests only; it does not run lint, a production build, migration validation, type checks, or end-to-end booking/payment tests.
- The committed npm lockfile is out of sync with `package.json`, while CI uses Bun. The README tells developers to use npm. A clean npm install fails.
- Many PRD features are partial or absent: full search filters, automatic iCal import scheduling, guest gift-card purchase, complete multilingual UI, real payouts, native app work, multi-currency, and white-label support.

The correct next step is not “build Sprint 6.” The correct next step is to resolve the business/payment model, reconcile production state, repair the booking/payment core, establish compliance and test gates, and only then finish product expansion.

### Selected product direction

The PRD is a source of goals, not an implementation contract. Where the PRD, repository, deployment, or old Lovable plan conflict, this document selects the coherent target:

- Fjällportalen is a managed Swedish cabin-rental marketplace.
- Guests pay through Stripe Checkout in SEK. Card is the launch payment method; Swish is deferred until a supported provider integration is designed and reconciled.
- Hosts onboard through Stripe-hosted Connect onboarding and use a lightweight Stripe-hosted dashboard. Fjällportalen does not collect host bank/KYC data itself.
- Each launch booking pays one host, so use Stripe Connect **destination charges**, not separate charges and transfers.
- Stripe limits manual payout holding for Swedish/other non-US connected accounts to 90 days. Therefore far-future reservations use a staged schedule: charge the 400 SEK service/reservation fee at booking, collect accommodation 30 days before check-in using a destination charge, and initiate the host bank payout after the approved post-check-in release rule. A booking made within 30 days of check-in can use one Checkout containing rent plus the service fee.
- The host share moves to the connected Stripe balance as part of the accommodation charge. The connected account uses a platform-controlled manual payout schedule; Fjällportalen initiates the bank payout only after the approved post-check-in release rule.
- This is not escrow. Customer copy must say that Stripe handles the payment and that payout is scheduled after check-in. It must never claim that Fjällportalen holds money in a segregated account.
- The launch platform fee is a transparent 400 SEK guest service fee, included in Checkout and the immutable quote. Treat it as VAT-inclusive pending Swedish accountant confirmation; Stripe processing cost is absorbed from that fee unless D-002 is amended before launch.
- Personnummer is removed from the launch guest flow. Reintroduce it only after a documented legal necessity and privacy review.
- Launch geography uses the 27 areas currently represented in canonical source data, after content/slug validation.
- Third-party/multi-provider extras, gift-card sales, Swish, native apps, multi-currency, and white-label are deferred until the core marketplace is reconciled and stable.

---

## 3. Audit scope and evidence confidence

### Evidence reviewed

- PRD v2.0 supplied by the product owner.
- Repository source, generated Supabase types, SQL migrations, Lovable plan, CI workflow, dependency manifests, and tracked environment-file names.
- Public deployment behavior at `https://fjallportalen.com` on 2026-07-31, including a credentialed signed-out walkthrough behind the demo gate of home, search, cabin detail, host acquisition, how-it-works, contact, and login pages. No account, booking, payment, or form submission was created.
- Current official Supabase and Stripe documentation relevant to RLS, keys, cron, connected accounts, and marketplace transfers.

### Not available in this audit

The audit did not have authenticated Lovable Cloud or Supabase project tools. Therefore the following remain **unverified** and must be checked in Work Packet WP-001:

- Actual production tables, columns, constraints, grants, RLS policies, views, functions, triggers, extensions, and migration ledger.
- Supabase Security and Performance Advisors.
- Live cron job definitions and recent `cron.job_run_details` results.
- Realtime publication configuration.
- Storage bucket configuration and policies in production.
- Auth provider settings, redirect allow-list, email confirmation behavior, password rules, CAPTCHA/rate limits, and MFA.
- Cloud secrets and environment separation.
- Stripe/Lovable connection mode, webhook endpoints, webhook deliveries, balance, disputes, and whether Connect is enabled.
- Lovable email domain status, queue health, bounce handling, and delivery metrics.
- Fortnox credentials and API authorization lifecycle.
- Production data quality, backup/PITR settings, logs, monitoring, and incident alerts.

No item may be promoted to `VERIFIED PROD` until these are inspected directly.

---

## 4. Product decisions and remaining validations

### D-001 — Controlled marketplace payment model

**Owner:** Product owner + payments/legal/accounting adviser
**Status:** `DECIDED`
**Decision date:** 2026-07-31

Use Stripe Connect as a marketplace with Accounts v2 where supported, Stripe-hosted onboarding, Express Dashboard access, destination charges, and a platform-controlled manual payout schedule. Use the connected account's `recipient` configuration/transfer capability for indirect charges; add `merchant` only if the final Stripe configuration requires `on_behalf_of`. Confirm the generated configuration in Stripe's platform profile and sandbox before coding because account responsibilities cannot always be changed later.

Why this model:

- Every cabin booking has one guest and one host; Stripe documents destination charges for this one-to-one marketplace shape.
- It gives Fjällportalen one payment provider and unified operational view, with one or two Checkouts based on booking lead time, plus control of refunds, disputes, and payout timing.
- Hosted onboarding and the Express Dashboard keep KYC, bank-account maintenance, and changing verification requirements with Stripe.
- Separate charges and transfers add balance/transfer complexity intended for multi-party or delayed-destination cases. Direct host payments remove the trust and operational control the product is trying to provide.

Non-negotiable consequence: Fjällportalen bears platform-level payment fees and operational responsibility for refunds, disputes, chargebacks, and negative-balance risk under indirect charges. Legal/accounting/provider review validates the implementation; it does not reopen the rejected direct-payment branch without a new recorded decision.

### D-002 — Platform fee baseline

**Status:** `DECIDED`, accountant validation required

The guest pays one transparent 400 SEK Fjällportalen service fee per booking, shown separately in search-price breakdown, quote, Checkout, receipt, cancellation, and refund views. For far-future reservations it is collected as the initial platform reservation payment; for bookings inside the accommodation-payment window it is retained through the destination-charge fee mechanics in a single Checkout. Baseline treatment is VAT-inclusive; a Swedish accountant must approve VAT, revenue recognition, invoice/receipt responsibility, and refund treatment before live mode. Until that approval, test mode only.

Default refund rule: refund the service fee when Fjällportalen or the host cancels, or when payment never completes; apply the approved cancellation policy for guest cancellations. Never silently keep or refund it based only on a booking-status mutation.

### D-003 — Decide whether personal identity number is necessary

**Status:** `DECIDED`

Do not collect personnummer from guests at launch. Require only the minimum booking/contact data approved in the privacy design. Stripe collects host identity/KYC data through hosted onboarding. If a future regulated or insurance use case genuinely requires personnummer, create a separate privacy decision covering purpose, legal basis, access, protection, retention, deletion, and alternatives before adding it.

### D-004 — Define launch geography and canonical area list

**Status:** `DECIDED`, content validation required

Use the 27 areas currently represented by canonical source data. Generate counts and navigation from that source instead of hard-coded copy. Validate names, slugs, region mapping, descriptions, and images before public launch. Remove invented listing estimates unless sourced and labeled.

---

## 5. Release-blocking findings

### P0-001 — Contradictory payment architecture

**Evidence:** PRD sections 2 and 6 describe Stripe escrow. The superseded Lovable plan specified direct Swish/bank payment, while the repository contains both `host_payout_details` and Stripe checkout/escrow code. `.lovable/plan.md` has now been replaced with the selected marketplace direction, but the losing code/data path still requires removal or deliberate migration.

**Risk:** Lovable can continue building mutually exclusive flows, creating incorrect customer promises, accounting, refunds, access rules, and operational procedures.

**Required action:** Implement D-001, delete/deprecate the direct-payment path, migrate existing data deliberately, and run a site-wide copy scan.

### P0-002 — “Escrow release” does not transfer money

**Evidence:** `release_eligible_escrow()` only updates `bookings.escrow_status` and `escrow_released_at`. No Stripe connected-account ID, destination-charge record, payout creation, transfer recovery/reversal, or payout webhook handling exists. `booking-notifications` sends `payout-released` when the database field says `released`.

**Risk:** Customers and hosts may receive false financial confirmations; funds can remain in the platform account; reconciliation cannot prove where money went.

**Required action:** Immediately disable payout-released messaging and real-money launch. Replace the database-only release with the selected destination-charge and controlled-payout state machine.

### P0-003 — Server-side pricing validation is not authoritative

**Evidence:** Guest UI uses seasonal prices, weekly prices, weekend surcharges, last-minute discounts, long-stay discounts, early-bird discounts, and high-demand markup. The `validate_booking_pricing()` trigger checks only that `nightly_total >= base_price × nights` and that total components add up.

**Failure modes:**

- Legitimate discounts below base price are rejected.
- A manipulated client can pay base price during a higher seasonal/demand price.
- Server and UI can drift silently.

**Required action:** Move all quote calculation into a single database RPC or trusted server function that reads authoritative pricing rules, returns a versioned quote, and creates the booking from that quote. The client may preview but may not submit financial totals as authority.

### P0-004 — Payment environment is client-controlled

**Evidence:** `createBookingCheckout` accepts `{ environment: 'sandbox' | 'live' }` from the request and chooses server credentials from that value.

**Risk:** If both credential sets and webhooks exist, a caller can create a test-mode checkout for a production booking and have the shared production database mark it paid.

**Required action:** Derive environment exclusively from trusted server deployment configuration. Store payment mode on the payment attempt and verify that every webhook object matches it. Test and production should ideally use separate Supabase projects and Stripe accounts/connections.

### P0-005 — Unpaid reservations can block dates indefinitely

**Evidence:** Instant-book inserts a booking as `confirmed` before Checkout completes. The exclusion constraint blocks overlapping `pending` and `confirmed` rows. There is no `checkout.session.expired` handler or reservation-expiry cron.

**Required action:** Add a short-lived `reserved`/`payment_pending` state with `expires_at`, use an atomic reservation RPC, release expired holds, and confirm only after verified payment success. Handle Checkout expiration explicitly.

### P0-006 — Booking and extras are not atomic

**Evidence:** The browser inserts `bookings`, then separately inserts `booking_extras`. Failure leaves a booking without the extras the guest selected. Checkout later constructs its amount from the current booking and current extras.

**Required action:** Create the booking, quote snapshot, selected extras, and hold in one transaction/RPC. Persist immutable monetary snapshots. Checkout must use the snapshot, not mutable catalog rows.

### P0-007 — Production is still a password-protected demo

**Evidence:** On 2026-07-31, `/` and `/sok` redirect to `/unlock`, which presents “Fjällportalen - demoläge.” The root guard protects every non-API route.

**Risk:** The marketplace is not publicly usable or indexable. PRD status, SEO claims, and launch KPIs are misleading.

**Required action:** Keep the gate during remediation. Change PRD status to Private Beta. Remove the gate only after the launch checklist passes.

### P0-008 — Legal and privacy launch surface is missing

**Evidence:** No privacy-policy or terms route was found. Signup’s “villkor” link points to `/`. The product stores contact details, address, email, phone, and personnummer and processes bookings/payments.

**Required action:** Obtain appropriate Swedish/EU legal review; publish terms, privacy notice, cancellation/refund policy, host terms, provider terms, cookie/analytics disclosure as applicable, data-subject request process, and retention/deletion policy. Remove personnummer from the launch guest flow under D-003.

### P0-009 — Production database state is unverified

**Evidence:** The repository has many incremental migrations, including eight empty SQL files. Generated TypeScript types are not proof that production matches Git. No live advisor or migration output was available.

**Required action:** Complete WP-001 before any new schema work. Back up first. Reconcile drift and create a trusted baseline.

---

## 6. High-priority findings

### P1-001 — Webhook correctness and idempotency are incomplete

- Database update errors are ignored, yet the endpoint still returns success.
- Processed Stripe event IDs are not stored, so delivery idempotency is implicit and incomplete.
- `checkout.session.completed` is treated as paid without a documented check for the actual payment status/method behavior.
- Booking ID metadata is trusted without verifying expected amount, currency, booking state, Checkout session ID, mode, and customer ownership against an immutable payment attempt.
- Checkout creation has no idempotency key and can create duplicate sessions/coupons.
- The handler accepts `env` from the webhook URL and shares one database across modes.

Implement a `payment_attempts`/`webhook_events` ledger, verify all invariants, fail non-2xx when persistence fails, and test replay/out-of-order delivery.

### P1-002 — Gift-card redemption is not transactional

The gift card is redeemed before Checkout session creation. A session failure or abandonment can consume balance without a successful payment. Guest purchase/send UI is also absent; only admin issuance exists.

Reserve gift-card value against an expiring payment attempt, capture it after payment, and release it after failure/expiry. Add guest purchase only after the base payment model is safe.

### P1-003 — Search does not meet the PRD

Current `/sok` supports region, area, guest count, and maximum base price. It does not implement date availability, free text, pet, Wi-Fi, sauna, ski-in/ski-out, season, or effective-price filtering.

The deployed “Hur det funkar” page explicitly tells users they can filter by area, date, bed count, ski-in/ski-out, and price with a map and list side by side. The deployed search page does not match that promise. Treat public copy as part of the acceptance contract: remove unsupported claims immediately or ship the behavior before public launch.

Build search only after authoritative availability and pricing exist. Date filtering must include bookings, temporary holds, manual blocks, and imported iCal blocks.

### P1-004 — Automatic iCal import is absent

Host-triggered `syncIcalFeed` and export code exist, but no `/api/public/hooks/sync-ical-feeds` route or 30-minute scheduler exists. The PRD’s automatic sync claim is therefore incomplete.

Add a service-authenticated batch worker with bounded concurrency, timeouts, payload limits, durable per-feed results, monitoring, and tests for Airbnb/Booking variants before calling it complete.

### P1-005 — iCal and reservation consistency needs a single availability model

External blocks are stored separately from bookings, while the exclusion constraint protects booking overlaps only. A race can occur between availability read and booking insert, and imported blocks do not participate in the database exclusion rule.

Use one transactional availability check/lock path. Define precedence and conflict behavior when a newly imported event overlaps an existing paid booking.

### P1-006 — Notification timing and financial wording are unsafe

The check-in reminder query has an upper bound but no lower bound; previously missed historical bookings can receive a reminder after check-in. The payout email is driven by the false database-only release described in P0-002.

Add exact time windows, timezone rules (`Europe/Stockholm`), idempotent job records, late/missed-event policy, and delivery metrics. Disable payout wording until a provider-confirmed transfer exists.

### P1-007 — Accounting needs reconciliation and expert validation

- Accommodation charge, platform fee, extras, refunds, Stripe fees, transfers, disputes, chargebacks, and host invoices are not represented in a unified ledger.
- SIE output declares `#FORMAT PC8` but emits UTF-8 with BOM. Verify the required encoding with the target accounting importer.
- Fortnox sync can create duplicate invoices on repeated clicks because no remote document ID/idempotency guard blocks a second create.
- The code uses static Fortnox tokens with no visible OAuth/refresh/revocation lifecycle.

Create an append-only financial ledger and daily provider reconciliation before relying on KPI or accounting screens. Have the chart of accounts, VAT logic, invoice responsibility, and SIE mapping approved by a Swedish accountant.

### P1-008 — PII controls are incomplete

Column grants and admin RPCs show useful hardening work, but the product lacks documented field validation, masking in admin UI/exports, audit trails for PII access, retention/deletion jobs, data export, breach response, and production verification. Avoid logging raw email, phone, address, personnummer, booking messages, tokens, or payment identifiers.

The deployed signed-out cabin page exposes the cabin's full street address before booking. Define an address-disclosure policy and default public listings to an approximate area/map location; reveal exact arrival details only to an authorized, paid guest at the approved time.

### P1-009 — Authentication/authorization launch controls are incomplete

Verify Google OAuth, allowed redirects, signup email confirmation, leaked-password protection, rate limits/CAPTCHA, admin MFA, session revocation, and role-change audit logs. Admin capability must be tested server-side/RLS-side; route hiding is not authorization.

### P1-010 — Localization is partial

Cabin title/description translation fields and a per-cabin language selector exist. The rest of navigation, search, booking, checkout, emails, legal pages, validation errors, metadata, and formatting remains Swedish. This is not a Swedish/English/German product.

Choose an i18n framework, locale routing/canonical strategy, fallback rules, human review workflow, and translation freshness/versioning. Do not expose AI output without host review.

### P1-011 — Public content and SEO are incomplete

- Root HTML declares `lang="en"` while content is Swedish.
- The live password gate prevents indexing.
- Sitemap is static and omits published cabin URLs.
- Search structured data declares a `q` search action, but `/sok` has no free-text `q` parameter.
- Legal pages are missing.
- Sitemap includes `/listor`, which appears account-oriented rather than a canonical public landing page.

Fix only after product routes are genuinely public and stable. Validate structured data from rendered production HTML.

### P1-012 — Extras operations are not complete

The booking picker exists, but the old Lovable plan itself records missing operational surfaces: selected extras across guest/host views, grocery receipt upload, assignment/fulfillment workflow, and admin task tracking. Define provider ownership, cancellation, refund, SLA, evidence, and failure handling before selling extras.

### P1-013 — Deployed content and public UX are not release-consistent

The private demo walkthrough found release-facing inconsistencies that should be tested as product defects, not left as copy polish:

- Home and footer repeatedly claim 21 mountain areas, while `/sok` exposes 27.
- A published cabin description displays Markdown markers such as `###` and `*` as literal text instead of rendering sanitized structure.
- Public pages state that Fjällportalen holds and releases money 24 hours after check-in even though the repository has no provider-backed transfer implementation.
- Login asks the user to accept “villkor,” but the link goes to the home page.

Create one approved claims/content inventory for payment, area coverage, verification, support hours/location, fees, and feature availability. Add signed-out browser tests for every launch-critical public route.

---

## 7. Medium-priority engineering findings

### P2-001 — Toolchain and lockfiles are inconsistent

- `package.json` contains ranges that resolve to packages requiring Node 22+, while the available local Node was 20.
- `npm ci` fails because `package-lock.json` does not match `package.json`.
- `bun.lock` also exists and CI uses Bun, while README instructs npm.
- No `engines` or `packageManager` field declares the supported runtime.

Choose Bun or npm, use one authoritative lockfile, pin the runtime, update README, and prove a clean frozen install.

### P2-002 — CI is insufficient

Current CI runs Vitest only. Add frozen install, format check, lint, typecheck, production build, unit/integration tests, migration lint/reset, generated-type drift check, secret scan, dependency audit policy, and browser smoke tests. Payment tests must use test mode and never touch live credentials.

### P2-003 — Test coverage is far below system risk

Only three test files were found. There are no repository tests for payment state transitions, webhook replay/order, refunds, quote authority, RLS roles, booking races, iCal imports, cron windows, invoice idempotency, or end-to-end checkout.

### P2-004 — Documentation is not operational

README is a short Lovable template and does not describe architecture, supported runtime, environment variables, local setup, migrations, test accounts, deployment, rollback, cron, providers, or incident procedures. Add an `.env.example` containing names only—never secrets.

### P2-005 — Error and observability model is fragmented

Several routes catch and suppress errors, or expose raw error messages. Define structured logs, request/job correlation IDs, redaction, user-safe errors, alert thresholds, and runbooks. Add provider reconciliation dashboards rather than relying only on UI status fields.

### P2-006 — Product counts and roadmap status are inaccurate

The PRD says 21 areas while source data contains 27. It marks many partial features complete. Native app, multi-currency, advanced SEO scaling, and white-label are not present and should remain future epics, not “next sprint” until the core is safe.

---

## 8. PRD-to-repository coverage matrix

| Capability | Evidence state | Audit conclusion / required proof |
|---|---|---|
| Email/password auth | Implemented, production unverified | UI exists; verify confirmation, recovery, rate limits, session behavior. |
| Google OAuth | Implemented, production unverified | Lovable OAuth call exists; verify redirect/provider configuration. |
| Map-first discovery | Implemented | Sweden map and region/area routes exist. Confirm mobile/keyboard UX after gate removal. |
| Full PRD search/filter set | Partial | Only region, area, guests, and max base price implemented. |
| Availability from iCal | Partial | Manual sync/export exists; automatic import scheduler and robust operational coverage absent. |
| Seasonal/dynamic pricing | Partial and unsafe | UI calculator exists; authoritative server validation does not match it. |
| Booking | Partial and unsafe | Core rows and overlap constraint exist; holds, atomic extras, expiry, authoritative quote missing. |
| Stripe Embedded Checkout | Partial and unsafe | Checkout exists; environment, idempotency, state verification, and payout model need redesign. |
| Escrow/payout | Missing despite UI claims | Database status only; no Connect transfer/payout. |
| Automatic >48h refund | Partial | Refund code exists; policy/timezone/provider state and transfer reversal need redesign/testing. |
| Guest booking history/receipt | Implemented, unverified | Routes exist; reconcile totals/extras/refunds and legal receipt requirements. |
| Realtime booking status | Implemented, unverified | Realtime hook exists; verify production publication and auth. |
| Messaging | Implemented, unverified | Messages table/UI/realtime exist; add abuse, retention, notification, and support workflows. |
| Notifications | Partial | In-app/email structures exist; job timing and financial messaging have gaps. |
| Favorites | Implemented, unverified | Table/component/routes exist. |
| Price alerts | Partial | Management and hook code exist; verify scheduler, delivery, deduplication, and effective price semantics. |
| Reviews | Implemented, unverified | Review/moderation code exists; test eligibility, duplicate prevention, moderation audit. |
| Guest gift-card purchase/send | Missing | Admin issuance only. Redemption is not transaction-safe. |
| Swedish/English/German | Partial | Only cabin content translation is visible. No full application i18n. |
| Host cabin CRUD/images | Implemented, unverified | Forms/storage policies exist; verify production bucket and draft cleanup. |
| Host calendar | Partial | Manual blocks and feed UI exist; automation and conflict operations incomplete. |
| Host payouts | Missing | No connected-account or transfer implementation. |
| Host insights | Partial | Basic analytics/AI tooling exists; KPI definitions and production data quality unverified. |
| Extras | Partial | Sales UI and pricing tables exist; fulfillment and accounting operations incomplete. |
| Admin dashboard | Implemented, unverified | Routes/RPCs exist; production role security and KPI correctness unverified. |
| PDF invoices | Implemented, unverified | Generator exists; validate legal fields, sequence, credit notes, totals, and archival. |
| CSV export | Implemented, unverified | Code exists; test encoding, escaping, PII access, and large datasets. |
| SIE4 | Partial | Generator exists; encoding/format and accountant import must be validated. |
| Fortnox | Partial | Create-customer/invoice code exists; no safe token lifecycle or duplicate guard. |
| Email retry/status | Substantial, unverified | Multiple queue/attempt structures exist; verify one canonical pipeline, cron, domain, and provider events. |
| SEO | Partial / blocked | Metadata exists, but gate, wrong language, static sitemap, and missing search behavior block claim. |
| Legal/privacy | Missing | No real terms/privacy routes or operational privacy program found. |
| Native app | Not started | Keep as 2027 discovery after web core is stable. |
| Multi-currency | Not started | Current money and Stripe line items are SEK-specific. |
| White-label | Not started | No tenant model or isolation design. |

---

## 9. Target architecture

### Core principles

1. Browser clients submit intent, dates, guest count, and selected option IDs—not authoritative money values.
2. A trusted quote service reads current cabin, pricing, availability, taxes/fees, and extras and returns a versioned immutable quote with expiry.
3. One transaction creates the hold/booking, quote snapshot, extras snapshot, and audit event.
4. Every external action uses an idempotency key and durable attempt/event record.
5. Database status changes only after the external provider response or verified webhook is persisted.
6. State machines use explicit transitions and reject invalid/out-of-order changes.
7. Cron jobs select bounded batches, lock work, retry safely, record results, and alert on age/backlog/failure.
8. Financial state is reconciled against provider records daily.
9. PII access is least-privilege, masked by default, audited, and retained only as long as approved.

### Suggested core records

- `quotes` and `quote_lines` — immutable calculation inputs/results, currency, version, expiry.
- `booking_holds` or explicit booking hold fields — state and expiry.
- `payment_attempts` — mode, provider IDs, expected amount/currency, idempotency key, state.
- `provider_webhook_events` — provider event ID, type, received/processed timestamps, result/error.
- `booking_state_events` — append-only transition audit.
- `financial_ledger_entries` — append-only debits/credits for accommodation, platform fee, extras, tax, refunds, transfers, disputes, and adjustments.
- `host_payment_accounts`, `provider_transfers`, `provider_payouts`, `refunds`, `disputes`, and reversal/event records. Use provider-neutral table names while storing Stripe object IDs explicitly.
- `job_runs` / `notification_deliveries` — durable cron and communication state.

Do not add these blindly. First reconcile the live schema and then design the smallest coherent migration series.

### Canonical lifecycle

Do not overload one `booking.status` column with inventory, payment, stay, cancellation, and payout meaning. Persist compatible state dimensions and append every transition:

1. **Inventory:** `hold` → `reserved` → `occupied/completed`, or `expired/cancelled`.
2. **Service fee:** `not_due` → `checkout_open` → `paid`, or `failed/refunded`.
3. **Accommodation:** `scheduled` → `due` → `checkout_open` → `paid`, or `past_due/failed/refunded`.
4. **Stay:** `upcoming` → `checked_in` → `completed`, with an admin exception path backed by evidence.
5. **Host payout:** `not_eligible` → `eligible` → `submitted` → `paid`, or `failed/reversed`.
6. **Cancellation/dispute:** separate append-only events calculate inventory, refund, transfer recovery, payout, and ledger consequences; they do not rewrite history.

Only server/database transition functions may advance financial states. Provider webhook replay must be harmless, and a later event may not move a state backward unless an explicit compensating transition permits it.

---

## 10. Ordered Lovable work packets

### WP-000 — Freeze unsafe claims and record decisions

**Priority:** P0
**Depends on:** none
**Initial status:** `TODO`; D-001 through D-004 are now decided, with named external validations remaining

Tasks:

- Change project status to Private Beta in PRD/readme/admin banner.
- Keep the password gate enabled.
- Disable real-money checkout unless it is guaranteed test-mode only.
- Disable payout-released jobs/emails and remove definitive payout copy until verified transfer exists.
- Record the selected D-001 through D-004 baselines in repository-facing documentation and configuration notes.
- Run a repository-wide copy inventory for `escrow`, `utbetalning`, `24 timmar`, fee payer, refunds, and “no intermediary.”

Acceptance:

- No production user can create a live charge.
- No email/UI can claim a host was paid without provider evidence.
- One payment model and fee model are recorded with owner/date.

### WP-001 — Reconcile Lovable Cloud/Supabase production state

**Priority:** P0
**Depends on:** WP-000 safety freeze

Tasks:

- Confirm project reference and environments; establish separate staging and production if absent.
- Take/verify a recoverable backup and PITR policy before changes.
- Export current schema and migration history; compare with repository migrations and generated types.
- Inventory tables, columns, indexes, constraints, RLS, grants, policies, views, functions, triggers, storage policies, Realtime publications, extensions, Vault/private config, and cron jobs.
- Run Security and Performance Advisors and resolve all critical/high findings.
- Inspect `cron.job_run_details`, email queues, failed attempts, and access-denial logs.
- Replace empty/ambiguous migration history with a documented, non-destructive baseline strategy.
- Commit regenerated database types from the reconciled schema.

Acceptance:

- Staging can be built from migrations from zero.
- Migration list and generated types match staging.
- Role test matrix passes for each exposed table/view/RPC.
- Advisor output and exceptions are attached to the change log.

Supabase requirements:

- RLS on every exposed table.
- Explicit grants plus RLS; neither substitutes for the other.
- Verify the project's Data API exposure settings and grant only the tables/views/RPCs the client needs. Supabase's 2026 rollout no longer guarantees that new `public` tables are exposed automatically.
- Views exposed to clients use `security_invoker = true` or are inaccessible to public roles.
- `SECURITY DEFINER` functions live outside exposed schemas where practical, have fixed `search_path`, internal auth checks, and explicit `REVOKE`/`GRANT`.
- Use publishable key in public clients and secret/service key only in isolated server clients. Never let a user session override an admin client.

### WP-002 — Repair build reproducibility and CI

**Priority:** P0
**Depends on:** none; can run alongside WP-001

Tasks:

- Choose Bun or npm as the only package manager. Prefer matching Lovable’s supported build environment.
- Add `packageManager` and `engines` with Node 22.12+ if required by resolved dependencies.
- Regenerate and commit one authoritative lockfile; remove the stale alternative after review.
- Add `.env.example` with variable names, descriptions, public/secret classification, and environment ownership.
- Rewrite README with exact install/test/build/migrate/deploy steps.
- CI: frozen install, format check, lint, typecheck, production build, unit/integration tests, migration reset/lint, generated-type check, secret scan, and smoke test.

Acceptance:

- A clean checkout installs without changing the lockfile.
- All CI jobs pass on a PR and on `main`.
- No secret value exists in Git history introduced by this work.

### WP-003 — Build authoritative quote and atomic reservation

**Priority:** P0
**Depends on:** WP-001, WP-002

Tasks:

- Write a single quote specification covering base/season/week/weekend/dynamic rules, cleaning, extras, fee, VAT, currency, rounding, minimum stay, and weekday constraints.
- Implement trusted quote calculation in database or server-only code and prove identical expected fixtures across UI/server.
- Persist quote version, inputs, lines, totals, currency, and expiry.
- Persist the payment schedule: service-fee due/paid, accommodation due date (default 30 days before check-in), grace deadline, and cancellation result. For bookings inside the window, combine the fee and accommodation into one Checkout.
- Atomically validate availability and create hold/booking + extras snapshots.
- Add hold expiry and safe cleanup.
- Prevent host/client mutation of historical financial snapshots.
- Add concurrency tests for overlapping booking attempts and iCal blocks.

Acceptance:

- Tampered totals/options are rejected.
- Seasonal increases and legitimate discounts both work.
- Booking/extras either fully commit or fully roll back.
- Abandoned holds release automatically.
- At most one successful overlapping reservation is possible under concurrency.

### WP-004 — Implement controlled Stripe marketplace payments

**Priority:** P0
**Depends on:** WP-003, Stripe Connect sandbox enabled; live mode also requires legal/accounting approval

Tasks:

- Configure Stripe Connect using Accounts v2 where supported, recipient transfer capability, Stripe-hosted onboarding, and Express Dashboard access. Confirm responsibility settings in the Stripe platform profile before creating production accounts.
- Implement host onboarding, capability/readiness state, account-link refresh/return, payout-account status, and requirements-due handling.
- Server derives mode; use separate staging/test and production/live configuration.
- Implement the staged schedule. For far-future bookings, collect the 400 SEK platform reservation fee at booking and create the accommodation destination-charge Checkout at T-30 days. For bookings already inside T-30, create one destination-charge Checkout with the 400 SEK platform fee included.
- Add durable payment-due jobs, guest reminders, hosted payment recovery, a grace deadline, and deterministic cancellation/release of inventory when accommodation remains unpaid. Never rely solely on an off-session charge succeeding.
- Implement webhook event ledger and verified state transitions.
- Set connected accounts to a platform-controlled manual payout schedule and disable host-initiated early/instant payouts for the launch configuration. Persist the automatic destination transfer and initiate the eligible host bank payout after the approved post-check-in rule.
- Assert before every accommodation charge that its planned payout falls within Stripe's applicable manual-payout holding limit; alert and block on an invalid schedule rather than silently paying early.
- Track `payout.created`, `payout.updated`, `payout.paid`, and `payout.failed`; only `payout.paid` can produce a host-paid confirmation.
- Implement cancellation, full/partial refund, dispute, chargeback, destination-transfer reversal/recovery, payout failure, and ledger effects.
- Reconcile Stripe charges, fees, balances, destination transfers, payouts, refunds, disputes, and the database ledger daily.
- Replace all copy with legally/provider-approved language.
- Launch with card only. Do not simulate Swish or expose host bank details. Defer multi-provider extras and gift-card sales.

Acceptance:

- End-to-end Stripe sandbox scenarios pass: far-future reservation fee, T-30 accommodation request, near-term combined Checkout, SCA/payment recovery, grace expiry, duplicate webhook, out-of-order webhook, Checkout expiry, full/partial refund before and after payout, destination-transfer recovery, payout success/failure, and dispute.
- A host cannot publish/receive bookings until payment account requirements are satisfied as defined.
- A host-paid email requires a persisted `payout.paid` signal—not a destination transfer, scheduled payout, or timestamp-only database update.
- Finance can reconcile each booking to provider objects and ledger entries.

### WP-005 — Compliance, privacy, and account safety

**Priority:** P0 before public launch
**Depends on:** WP-000; live payment launch also depends on D-002 accountant validation

Tasks:

- Publish approved terms, privacy notice, cancellation/refund policy, host terms, and provider terms.
- Fix signup legal links and record accepted document version/timestamp where required.
- Implement data export, correction, deletion/anonymization, retention schedules, and support workflow.
- Remove personnummer from launch guest UI and new-booking requirements. Inventory legacy values, restrict/mask access, define retention/deletion, and do not migrate them into new records without an approved future decision.
- Enable/admin-enforce MFA, secure role changes, rate limits/CAPTCHA as appropriate, and session revocation procedures.
- Document subprocessors, DPAs, incident response, breach notification, and support escalation.

Acceptance:

- Legal pages are linked from signup, checkout, footer, and account.
- Approved retention/deletion tests pass.
- Admin access to sensitive data is least-privilege and auditable.

### WP-006 — Operationalize iCal and availability

**Priority:** P1
**Depends on:** WP-001, WP-003

Tasks:

- Implement automatic feed scheduler/worker and job monitoring.
- Add fetch timeout, size/event/date bounds, safe redirects policy, DNS rebinding-resistant SSRF strategy, parser fixture suite, and rate limits.
- Define conflict behavior and expose actionable host/admin errors.
- Test exports in Airbnb and Booking.com importers; test their representative feeds on import.

Acceptance:

- Feeds sync within the stated SLA and failures alert after threshold.
- External blocks participate in atomic availability checks.
- Manual blocks are never deleted by feed refresh.

### WP-007 — Complete search and core guest journey

**Priority:** P1
**Depends on:** WP-003, WP-006

Tasks:

- Add dates, free text, pets, Wi-Fi, sauna, ski-in/ski-out, season/effective price, and pagination/sort.
- Define filter semantics and indexed query plan.
- Reconcile the canonical area count (PRD and public copy say 21; deployed data exposes 27) and generate all counts from one source.
- Render host-authored descriptions with a safe, allow-listed Markdown renderer or store structured rich text; never inject unsanitized HTML.
- Hide exact cabin addresses from signed-out and pre-payment users; expose only the approved approximate location until the arrival-information release point.
- Maintain a launch-claims checklist so `/hur-det-funkar`, home, host acquisition, FAQs, email, and booking UI cannot promise behavior that has not passed acceptance tests.
- Enforce profile requirements at the correct step based on D-003.
- Show immutable price/fee/extras/refund breakdown throughout booking, checkout, receipt, and cancellation.
- Add responsive and accessibility tests.

Acceptance:

- Search results are available for selected dates and exclude all holds/blocks/bookings.
- URL state is shareable and canonical handling is defined.
- Public copy, filter controls, area counts, address visibility, and listing-description rendering match the approved product contract.
- WCAG-focused keyboard, focus, label, error, contrast, and screen-reader smoke tests pass.

### WP-008 — Complete extras operations

**Priority:** P1
**Depends on:** WP-003 and chosen payment model

Tasks:

- Show extras consistently to guest, host, admin, receipt, refund, invoice, and ledger.
- Build assignment/acceptance/fulfillment/cancellation states for providers.
- Add grocery receipt/order evidence storage with private bucket and signed access.
- Add operational queue, SLA, alerts, and reconciliation.

Acceptance:

- Every sold extra has an owner, status, fulfillment evidence, refund rule, and financial entry.

### WP-009 — Stabilize email and scheduled jobs

**Priority:** P1
**Depends on:** payment state machine

Tasks:

- Select one canonical email attempt/queue model and retire duplicates.
- Correct check-in windows/timezone; disable false payout messages.
- Inventory every cron job, secret, route, schedule, batch size, retry policy, and alert.
- Add delivery, bounce, complaint, suppression, backlog, and age metrics.
- Verify SPF/DKIM/DMARC and sender mapping in production.

Acceptance:

- Template, trigger, recipient, idempotency, retry, suppression, and operator recovery are tested for every transactional email.
- No historical or duplicate reminder is sent in tests.

### WP-010 — Accounting and Fortnox hardening

**Priority:** P1
**Depends on:** payment/fee model and ledger

Tasks:

- Obtain accountant-approved transaction/VAT/ledger/invoice specification.
- Rebuild reports and host invoices from ledger entries.
- Add credit notes and correction audit rather than mutating history.
- Validate PDF legal fields and numbering.
- Validate SIE4 against a real importer and correct encoding declaration/output.
- Implement supported Fortnox authorization lifecycle, remote ID storage, idempotency, retry, status sync, and reconciliation.

Acceptance:

- Test month closes reconcile database, Stripe charges/transfers/payouts, invoices, VAT report, SIE import, and Fortnox.

### WP-011 — Localization and content governance

**Priority:** P1/P2
**Depends on:** stable core journey and legal copy

Tasks:

- Implement full application i18n and locale-aware routes/metadata.
- Add translation review/publish state and invalidate translations when Swedish source changes.
- Translate emails and legal/customer-support surfaces deliberately.
- Resolve the 21-vs-27 area list and verify content claims.

Acceptance:

- A guest can complete the entire journey in Swedish, English, and German with correct currency/date/content fallbacks.

### WP-012 — Public launch and SEO

**Priority:** P1
**Depends on:** WP-000 through WP-011 launch-critical items

Tasks:

- Fix `<html lang="sv">` and locale variants.
- Generate dynamic sitemap entries for published cabins; exclude private/account routes.
- Align SearchAction schema with actual search behavior.
- Validate unique metadata, canonical, Open Graph, robots, structured data, 404s, and redirects on rendered production pages.
- Add performance budgets and synthetic monitoring.
- Remove password gate only during a controlled launch window with rollback owner.

Acceptance:

- Launch checklist in section 13 passes.
- Public smoke tests pass from a signed-out clean browser.
- Search-engine accessible HTML contains correct content and status codes.

### WP-013 — Future roadmap discovery

**Priority:** P2/P3
**Depends on:** stable public web product and measured demand

Keep Native/Capacitor, multi-currency, advanced SEO scale, and white-label as separate discovery projects. Each requires a new PRD, threat model, data model, cost estimate, and rollout plan. Do not start by wrapping unresolved web/payment issues in a native shell.

---

## 11. Master execution tracker

Lovable must update this table after each work packet. Evidence should be a migration name, test file/run, deployment ID, provider event, screenshot, or documented decision—not “implemented.”

| ID | Work item | Priority | Depends on | Status | Evidence / notes |
|---|---|---:|---|---|---|
| D-001 | Stripe Connect destination-charge marketplace | P0 | — | DECIDED | Accounts v2/hosted onboarding/Express; validate exact Stripe sandbox configuration |
| D-002 | Guest-paid 400 SEK service fee | P0 | — | DECIDED | VAT-inclusive baseline; accountant approval required before live mode |
| D-003 | Remove guest personnummer at launch | P0 | — | DECIDED | Minimize guest PII; Stripe handles host KYC |
| D-004 | Use and validate 27 canonical areas | P1 | — | DECIDED | Generate counts from canonical data |
| WP-000 | Freeze unsafe claims/real-money behavior | P0 | — | TODO | Keep site gated; update architecture/copy |
| WP-001 | Reconcile live Supabase state | P0 | WP-000 | TODO | Live access required |
| WP-002 | Reproducible build and CI | P0 | — | TODO | npm lock currently fails clean install |
| WP-003 | Authoritative quote + atomic hold/booking | P0 | WP-001/002 | TODO | Replace client-authoritative totals |
| WP-004 | Controlled Stripe marketplace flow | P0 | WP-003 | TODO | Sandbox first; live blocked by provider/accounting/legal validation |
| WP-005 | Legal/privacy/account security | P0 | WP-000 | TODO | Required before public launch |
| WP-006 | Automatic iCal + availability operations | P1 | WP-001/003 | TODO | Manual sync exists |
| WP-007 | Complete search/guest journey | P1 | WP-003/006 | TODO | Current filters incomplete |
| WP-008 | Extras fulfillment operations | P1 | WP-003/004 | TODO | Sales UI only partial |
| WP-009 | Email/cron stabilization | P1 | WP-004 | TODO | Disable false payout email first |
| WP-010 | Ledger/accounting/Fortnox | P1 | WP-004, D-002 | TODO | Accountant review required |
| WP-011 | Full i18n/content governance | P1/P2 | Stable core | TODO | Cabin text only is partial |
| WP-012 | SEO/public launch | P1 | Launch-critical work | TODO | Site remains password-gated |
| WP-013 | Native/multi-currency/white-label discovery | P3 | Stable launch | TODO | Not current sprint |

---

## 12. Required test matrix

### Roles and RLS

For every exposed table/view/RPC, test:

- signed-out `anon`;
- authenticated guest who owns the row;
- authenticated unrelated guest;
- host who owns the cabin/booking;
- unrelated host;
- admin;
- isolated server secret/service client.

Test SELECT, INSERT, UPDATE with ownership change attempts, DELETE, and RPC execution. Include column-level grants and storage policies. Verify that updates have both appropriate SELECT policy and ownership-preserving checks.

### Booking and availability

- invalid ranges, past dates, min nights, check-in weekday;
- base/season overlap boundaries, mixed seasons, weekly rates, weekend surcharge;
- every dynamic discount/markup and rounding boundary;
- iCal block, manual block, paid booking, temporary hold;
- two concurrent guests selecting the same dates;
- abandoned checkout expiration;
- booking with zero, one, and multiple extras;
- failure during extra insertion/quote creation must roll back all state.

### Payments

- environment isolation and server-owned mode;
- duplicate Checkout requests and webhook replay;
- out-of-order provider events;
- amount/currency/metadata/session mismatch;
- payment success, failure, expiration, async processing if enabled;
- far-future two-stage payment, near-term combined payment, due reminders, recovery, and grace cancellation;
- full/partial refund before and after bank payout;
- destination transfer creation/recovery and payout success/failure/retry;
- dispute/chargeback and negative-balance path;
- provider/database ledger reconciliation.

### Scheduled jobs and email

- correct Stockholm timezone boundary including DST;
- backlog greater than one batch;
- duplicate job invocation;
- worker crash between external side effect and acknowledgement;
- retry exhaustion and alert;
- suppression/bounce/complaint;
- template rendering with missing/long/non-ASCII fields;
- no check-in reminder after check-in;
- no host-paid notification without a verified `payout.paid` event.

### Accessibility and UX

- keyboard-only map, search, date/guest controls, dialogs, checkout, admin tables;
- focus placement after errors/navigation;
- visible labels and accessible names;
- status/error announcement;
- color contrast, zoom/reflow, mobile breakpoints;
- correct document language and localized validation.

---

## 13. Public launch checklist

Every item must have an owner and evidence.

### Product and policy

- [ ] D-001 through D-004 are implemented consistently; D-002 accounting treatment is approved.
- [ ] Terms, privacy, cancellation/refund, host/provider terms published and linked.
- [ ] Support, dispute, refund, incident, and escalation processes staffed.
- [ ] Customer copy accurately describes money flow and fee payer.

### Data and security

- [ ] Production backup/PITR verified by restore exercise.
- [ ] Supabase schema/migrations/types reconciled.
- [ ] Security/Performance Advisors reviewed; no unexplained critical/high findings.
- [ ] Complete RLS/grant/RPC/storage role matrix passed.
- [ ] Admin MFA and role audit enabled.
- [ ] Secrets separated by environment and rotated after setup review.
- [ ] PII masking, audit, retention, export, and deletion tested.

### Booking and payments

- [ ] Authoritative quote and atomic reservation tests passed.
- [ ] Abandoned holds expire.
- [ ] Stripe destination-charge and controlled-payout lifecycle passes sandbox/staging scenarios.
- [ ] Refund/dispute/reversal process tested.
- [ ] Daily reconciliation and alerting active.
- [ ] No test/live cross-contamination is possible.

### Operations

- [ ] Cron inventory documented and recent successful runs inspected.
- [ ] Email domain and delivery/suppression loop verified.
- [ ] iCal scheduler and conflicts tested.
- [ ] Extras fulfillment owner/SLA exists before extras are sold.
- [ ] Accounting month-close dry run approved.
- [ ] Monitoring, alerting, on-call owner, and rollback runbook active.

### Quality and launch

- [ ] Frozen clean install, lint, typecheck, build, tests, migration reset, and browser smoke tests pass.
- [ ] Correct `lang`, robots, dynamic sitemap, canonicals, metadata, and structured data verified on rendered production.
- [ ] Core Web Vitals/performance budgets accepted.
- [ ] Password gate removal and rollback rehearsed.
- [ ] Signed-out production smoke test completes search → cabin → signup/login → booking path.
- [ ] Status page/incident communication route defined.

---

## 14. Lovable work-packet prompt template

Use the following format when asking Lovable to execute a packet:

```text
Read docs/LOVABLE_MASTER_AUDIT_AND_IMPLEMENTATION_PLAN.md in full.
Execute only WP-XXX. Respect all blocking decisions and dependencies.

Before editing:
1. Report the current repository and live Lovable Cloud/Supabase state relevant to this packet.
2. List exact files, schema objects, secrets/configuration names, and external providers affected.
3. State any blocker. Do not simulate missing cloud/provider state.

Implementation requirements:
- Preserve unrelated work.
- Use one reviewed migration per coherent schema change.
- Keep RLS/grants/functions/storage policies least-privilege.
- Add tests for positive, negative, authorization, concurrency, retry, and rollback paths described in the packet.
- Do not mark completion from code presence alone.

Completion report:
- Files changed
- Migrations and production/staging application state
- Tests/commands and exact results
- Manual/provider verification evidence
- Remaining risks or follow-ups
- Updated section 11 tracker row and section 16 change-log entry
```

For high-risk packets, request a review-only pass first, then a separate implementation pass. Do not combine payment architecture, database reconciliation, accounting, and public launch in one Lovable prompt.

---

## 15. Authoritative external references

These are starting points; Lovable must re-check current documentation at implementation time.

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase API security: https://supabase.com/docs/guides/api/securing-your-api
- Supabase 2026 Data API exposure change: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Cron: https://supabase.com/docs/guides/cron
- Stripe Connect overview: https://docs.stripe.com/connect
- Stripe Accounts v2: https://docs.stripe.com/connect/accounts-v2
- Stripe marketplace connected-account creation: https://docs.stripe.com/connect/marketplace/tasks/create
- Stripe charge types: https://docs.stripe.com/connect/charges
- Stripe destination charges: https://docs.stripe.com/connect/destination-charges
- Stripe connected-account payouts: https://docs.stripe.com/connect/payouts-connected-accounts
- Stripe manual payout holding limits: https://docs.stripe.com/connect/manual-payouts

---

## 16. Change log and decision record

Append entries; do not rewrite historical entries.

| Date | Actor | Packet/decision | Change | Evidence | Remaining risk |
|---|---|---|---|---|---|
| 2026-07-31 | Codex audit | Initial audit | Created master audit, decisions, ordered roadmap, acceptance criteria, test matrix, and launch gates | Repository `e2df26e`; public site inspection; PRD v2.0 | Live Lovable Cloud/Supabase/provider state remains unverified |
| 2026-07-31 | Codex audit | Private demo walkthrough | Verified signed-out home, search, cabin, host, how-it-works, contact, and login UX; added public-claims, area-count, address-disclosure, and description-rendering findings | Credentialed read-only walkthrough; no account, booking, payment, or form submitted | Authenticated dashboards and live provider/backend state remain unverified |
| 2026-07-31 | Product direction + Codex architecture | D-001..D-004 | Replaced PRD-literal branching with one controlled marketplace target: Stripe Connect destination charges, hosted onboarding, staged T-30 accommodation collection, manual payout schedule, guest-paid 400 SEK fee, no guest personnummer, 27 canonical areas | Product-owner direction to optimize coherence/control; current Stripe marketplace/manual-payout guidance | Stripe platform profile/sandbox, Swedish legal/accounting, and live Supabase state still require validation |

### Decision record template

```text
Decision ID:
Date:
Owner/approvers:
Selected option:
Reason:
Customer promise:
Legal/accounting impact:
Data/schema impact:
Migration/rollback impact:
Superseded code/docs:
```

---

## 17. Definition of done for the overall PRD

Fjällportalen v2 is complete only when:

1. PRD statements match deployed behavior and one coherent business/payment model.
2. Each core feature has production evidence, not only code artifacts.
3. Money movement, booking state, pricing, extras, invoices, and provider records reconcile.
4. Production database security and migrations are reproducible and tested by role.
5. Legal/privacy obligations and operational procedures are implemented.
6. Clean build, CI, integration, concurrency, and browser journeys pass.
7. Monitoring can detect and operators can recover from payment, email, cron, iCal, and invoice failures.
8. The password gate is removed only after the launch checklist passes.
9. The roadmap labels partial/missing/future work honestly.
10. A product owner signs off the release using evidence captured in this document.
