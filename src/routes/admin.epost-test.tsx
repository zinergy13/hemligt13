import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMemo, useState } from 'react';
import { Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendTestTemplateEmail } from '@/lib/email-test.functions';
import { useAuth } from '@/hooks/useAuth';

const TEMPLATES = [
  { name: 'booking-confirmation', label: 'Bokningsbekräftelse (gäst)', needsBooking: true },
  { name: 'escrow-activated', label: 'Escrow aktiverad (gäst)', needsBooking: true },
  { name: 'checkin-reminder', label: 'Incheckningspåminnelse (gäst)', needsBooking: true },
  { name: 'payout-released', label: 'Utbetalning släppt (gäst)', needsBooking: true },
  { name: 'host-invoice', label: 'Månadsfaktura (värd)', needsBooking: false },
  { name: 'gift-card', label: 'Presentkort', needsBooking: false },
] as const;

export const Route = createFileRoute('/admin/epost-test')({
  head: () => ({
    meta: [
      { title: 'Testa e-postmallar - Admin - Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EmailTestPage,
});

type Result = { ok: boolean; status: number; body: string } | null;

function EmailTestPage() {
  const { user } = useAuth();
  const send = useServerFn(sendTestTemplateEmail);

  const [templateName, setTemplateName] = useState<(typeof TEMPLATES)[number]['name']>(
    'booking-confirmation',
  );
  const [recipient, setRecipient] = useState(user?.email ?? '');
  const [bookingId, setBookingId] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const meta = useMemo(() => TEMPLATES.find((t) => t.name === templateName)!, [templateName]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient) {
      toast.error('Ange en mottagaradress.');
      return;
    }
    if (meta.needsBooking && !bookingId) {
      toast.error('Denna mall kräver en bookingId.');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await send({
        data: {
          templateName,
          recipientEmail: recipient,
          bookingId: meta.needsBooking ? bookingId : undefined,
        },
      });
      setResult(res);
      if (res.ok) toast.success(`Testmejl skickat till ${recipient}`);
      else toast.error(`Kunde inte skicka (status ${res.status})`);
    } catch (err: any) {
      const msg = err?.message ?? 'Okänt fel';
      setResult({ ok: false, status: 0, body: msg });
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">Testa e-postmallar</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Skickar ett riktigt mejl via samma pipeline som produktion. Använd en bookingId för att
        rendera bokningsspecifika mallar med korrekt Fjällportalen- och 24h-text.
      </p>

      <form onSubmit={onSend} className="space-y-4 rounded-xl border bg-card p-5">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Mall</span>
          <select
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value as any)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Mottagare</span>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="din@epost.se"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">
            Booking ID {meta.needsBooking ? '(krävs)' : '(används inte för denna mall)'}
          </span>
          <input
            type="text"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value.trim())}
            placeholder="uuid från bookings-tabellen"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
            disabled={!meta.needsBooking}
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Skicka testmejl
        </button>
      </form>

      {result && (
        <div
          className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-sm ${
            result.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium">
              {result.ok ? 'Skickat' : `Misslyckades (status ${result.status})`}
            </div>
            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs opacity-80">
              {result.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
