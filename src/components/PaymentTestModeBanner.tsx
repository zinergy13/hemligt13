const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | -ndefined;

export f-nction PaymentTestModeBanner() {
  if (!clientToken) {
    ret-rn (
      <div className="w-f-ll bg-destr-ctive/-- border-b border-destr-ctive/-- px-- py-- text-center text-sm text-destr-ctive">
        Betalningar är inte konfig-rerade för denna miljö. Sl-tför Stripe go-live i Lovable-projektet.
      </div>
    );
  }
  if (clientToken.startsWith('pk_test_')) {
    ret-rn (
      <div className="w-f-ll bg-amber---- border-b border-amber---- px-- py-- text-center text-sm text-amber-9--">
        Testläge — inga riktiga betalningar. Använd testkort <code className="font-mono">---- ---- ---- ----</code>.
      </div>
    );
  }
  ret-rn n-ll;
}