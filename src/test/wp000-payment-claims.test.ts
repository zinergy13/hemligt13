import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WP-000 safety freeze guards.
 * 1. No guest-facing copy may claim escrow / segregated funds / a guaranteed
 *    24-hour payout.
 * 2. The payment environment must stay server-owned and sandbox-only.
 */

const ROOTS = ['src/components', 'src/routes', 'src/lib'];
const ALLOWLIST = [
  // Internal identifiers / DB columns, not customer claims.
  'src/components/PaymentPayoutTimeline.tsx',
  'src/components/EscrowFAQ.tsx',
  'src/components/EscrowFAQ.test.tsx',
  'src/lib/email-templates/registry.ts',
  'src/lib/email-templates/escrow-activated.tsx',
  'src/lib/payments.functions.ts',
  'src/lib/email-test.functions.ts',
  'src/routes/checkout.klar.tsx',
  'src/routes/admin.epost-test.tsx',
  'src/routes/admin.epost-status.tsx',
  'src/routes/api.public.payments.webhook.ts',
  'src/routes/api.public.hooks.booking-notifications.ts',
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = ROOTS.flatMap(walk).filter((f) => /\.(ts|tsx)$/.test(f));

describe('WP-000: no unsafe payment claims in customer-facing copy', () => {
  const forbidden: Array<[string, RegExp]> = [
    ['guaranteed 24h payout', /24 timmar efter (din )?incheckning/i],
    ['24h payout shorthand', /utbetalning 24h/i],
    ['segregated account claim', /(separat konto|klientmedel)/i],
    ['platform holds the money', /(håller pengarna|pengarna hålls|pengarna ligger tryggt|belopp i förvar)/i],
    ['funds released claim', /pengarna släpps/i],
  ];

  for (const [label, pattern] of forbidden) {
    it(`does not contain: ${label}`, () => {
      const hits = files.filter((f) => pattern.test(readFileSync(f, 'utf8')));
      expect(hits).toEqual([]);
    });
  }

  it('does not use the word "escrow" outside allowlisted internal identifiers', () => {
    const hits = files.filter(
      (f) => !ALLOWLIST.includes(f.replace(/\\/g, '/')) && /escrow/i.test(readFileSync(f, 'utf8')),
    );
    expect(hits).toEqual([]);
  });
});

describe('WP-000: payment environment is server-owned and frozen', () => {
  it('server functions do not accept an environment from the client', () => {
    const src = readFileSync('src/lib/payments.functions.ts', 'utf8');
    expect(src).not.toMatch(/environment:\s*StripeEnv/);
    expect(src).toMatch(/resolvePaymentEnv\(\)/);
  });

  it('the webhook route ignores the env query parameter', () => {
    const src = readFileSync('src/routes/api.public.payments.webhook.ts', 'utf8');
    expect(src).not.toMatch(/searchParams\.get\('env'\)/);
  });

  it('resolvePaymentEnv rejects anything but sandbox', async () => {
    const mod = await import('@/lib/stripe.server');
    const prev = process.env['PAYMENTS_ENV'];
    process.env['PAYMENTS_ENV'] = 'live';
    expect(() => mod.resolvePaymentEnv()).toThrow();
    delete process.env['PAYMENTS_ENV'];
    expect(mod.resolvePaymentEnv()).toBe('sandbox');
    if (prev !== undefined) process.env['PAYMENTS_ENV'] = prev;
  });

  it('a live publishable key does not enable checkout', () => {
    const src = readFileSync('src/lib/stripe.ts', 'utf8');
    expect(src).not.toMatch(/pk_live_/);
  });

  it('payout-released notifications are disabled', async () => {
    const src = readFileSync('src/routes/api.public.hooks.booking-notifications.ts', 'utf8');
    expect(src).toMatch(/PAYOUT_NOTIFICATIONS_ENABLED = false/);
  });
});