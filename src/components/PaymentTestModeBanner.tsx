const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
        Betalningar är inte konfigurerade för denna miljö. Slutför Stripe go-live i Lovable-projektet.
      </div>
    );
  }
  if (clientToken.startsWith('pk_test_')) {
    return (
      <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-900">
        Testläge — inga riktiga betalningar. Använd testkort <code className="font-mono">4242 4242 4242 4242</code>.
      </div>
    );
  }
  return null;
}