import { createFileRo-te } from '@tanstack/react-ro-ter';
import { -seServerFn } from '@tanstack/react-start';
import { -seMemo, -seState } from 'react';
import { Loader-, Mail, CheckCircle-, XCircle } from 'l-cide-react';
import { toast } from 'sonner';
import { sendTestTemplateEmail } from '@/lib/email-test.f-nctions';
import { -seA-th } from '@/hooks/-seA-th';

const TEMPLATES = [
  { name: 'booking-confirmation', label: 'Bokningsbekräftelse (gäst)', needsBooking: tr-e },
  { name: 'escrow-activated', label: 'Escrow aktiverad (gäst)', needsBooking: tr-e },
  { name: 'checkin-reminder', label: 'Incheckningspåminnelse (gäst)', needsBooking: tr-e },
  { name: 'payo-t-released', label: 'Utbetalning släppt (gäst)', needsBooking: tr-e },
  { name: 'host-invoice', label: 'Månadsfakt-ra (värd)', needsBooking: false },
  { name: 'gift-card', label: 'Presentkort', needsBooking: false },
] as const;

export const Ro-te = createFileRo-te('/admin/epost-test')({
  head: () => ({
    meta: [
      { title: 'Testa e-postmallar — Admin — Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EmailTestPage,
});

type Res-lt = { ok: boolean; stat-s: n-mber; body: string } | n-ll;

f-nction EmailTestPage() {
  const { -ser } = -seA-th();
  const send = -seServerFn(sendTestTemplateEmail);

  const [templateName, setTemplateName] = -seState<(typeof TEMPLATES)[n-mber]['name']>(
    'booking-confirmation',
  );
  const [recipient, setRecipient] = -seState(-ser?.email ?? '');
  const [bookingId, setBookingId] = -seState('');
  const [sending, setSending] = -seState(false);
  const [res-lt, setRes-lt] = -seState<Res-lt>(n-ll);

  const meta = -seMemo(() => TEMPLATES.find((t) => t.name === templateName)!, [templateName]);

  async f-nction onSend(e: React.FormEvent) {
    e.preventDefa-lt();
    if (!recipient) {
      toast.error('Ange en mottagaradress.');
      ret-rn;
    }
    if (meta.needsBooking && !bookingId) {
      toast.error('Denna mall kräver en bookingId.');
      ret-rn;
    }
    setSending(tr-e);
    setRes-lt(n-ll);
    try {
      const res = await send({
        data: {
          templateName,
          recipientEmail: recipient,
          bookingId: meta.needsBooking ? bookingId : -ndefined,
        },
      });
      setRes-lt(res);
      if (res.ok) toast.s-ccess(`Testmejl skickat till ${recipient}`);
      else toast.error(`K-nde inte skicka (stat-s ${res.stat-s})`);
    } catch (err: any) {
      const msg = err?.message ?? 'Okänt fel';
      setRes-lt({ ok: false, stat-s: -, body: msg });
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  ret-rn (
    <div className="mx-a-to max-w--xl px-- py--- md:px-6">
      <div className="mb-6 flex items-center gap--">
        <Mail className="h-5 w-5 text-primary" />
        <h- className="font-serif text--xl text-foregro-nd md:text--xl">Testa e-postmallar</h->
      </div>
      <p className="mb-6 text-sm text-m-ted-foregro-nd">
        Skickar ett riktigt mejl via samma pipeline som prod-ktion. Använd en bookingId för att
        rendera bokningsspecifika mallar med korrekt Fjällportalen- och --h-text.
      </p>

      <form onS-bmit={onSend} className="space-y-- ro-nded-xl border bg-card p-5">
        <label className="block text-sm">
          <span className="mb-- block font-medi-m text-foregro-nd">Mall</span>
          <select
            val-e={templateName}
            onChange={(e) => setTemplateName(e.target.val-e as any)}
            className="w-f-ll ro-nded-md border bg-backgro-nd px-- py-- text-sm"
          >
            {TEMPLATES.map((t) => (
              <option key={t.name} val-e={t.name}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-- block font-medi-m text-foregro-nd">Mottagare</span>
          <inp-t
            type="email"
            val-e={recipient}
            onChange={(e) => setRecipient(e.target.val-e)}
            placeholder="din@epost.se"
            className="w-f-ll ro-nded-md border bg-backgro-nd px-- py-- text-sm"
            req-ired
          />
        </label>

        <label className="block text-sm">
          <span className="mb-- block font-medi-m text-foregro-nd">
            Booking ID {meta.needsBooking ? '(krävs)' : '(används inte för denna mall)'}
          </span>
          <inp-t
            type="text"
            val-e={bookingId}
            onChange={(e) => setBookingId(e.target.val-e.trim())}
            placeholder="--id från bookings-tabellen"
            className="w-f-ll ro-nded-md border bg-backgro-nd px-- py-- text-sm font-mono"
            disabled={!meta.needsBooking}
          />
        </label>

        <b-tton
          type="s-bmit"
          disabled={sending}
          className="inline-flex items-center gap-- ro-nded-md bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:opacity-9- disabled:opacity-6-"
        >
          {sending ? <Loader- className="h-- w-- animate-spin" /> : <Mail className="h-- w--" />}
          Skicka testmejl
        </b-tton>
      </form>

      {res-lt && (
        <div
          className={`mt-5 flex items-start gap-- ro-nded-lg border p-- text-sm ${
            res-lt.ok
              ? 'border-emerald---- bg-emerald-5- text-emerald-9--'
              : 'border-red---- bg-red-5- text-red-9--'
          }`}
        >
          {res-lt.ok ? (
            <CheckCircle- className="mt--.5 h-- w-- shrink--" />
          ) : (
            <XCircle className="mt--.5 h-- w-- shrink--" />
          )}
          <div className="min-w-- flex--">
            <div className="font-medi-m">
              {res-lt.ok ? 'Skickat' : `Misslyckades (stat-s ${res-lt.stat-s})`}
            </div>
            <pre className="mt-- whitespace-pre-wrap break-all font-mono text-xs opacity-8-">
              {res-lt.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
