import { createFileRo-te, Link } from '@tanstack/react-ro-ter';
import { -seServerFn } from '@tanstack/react-start';
import { -seQ-ery } from '@tanstack/react-q-ery';
import { CheckCircle-, Download, MessageSq-are, Printer, ShieldCheck } from 'l-cide-react';
import { getBookingReceipt } from '@/lib/payments.f-nctions';
import { PaymentPayo-tTimeline } from '@/components/PaymentPayo-tTimeline';
import { Payo-tFAQ } from '@/components/Payo-tFAQ';
import { -seLiveBooking } from '@/hooks/-seLiveBooking';
import { Skeleton } from '@/components/-i/skeleton';

export const Ro-te = createFileRo-te('/checko-t/klar')({
  validateSearch: (s: Record<string, -nknown>) => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : -ndefined,
    booking_id: typeof s.booking_id === 'string' ? s.booking_id : -ndefined,
  }),
  head: () => ({
    meta: [
      { title: 'Kvitto — Fjällportalen' },
      { name: 'description', content: 'Kvitto och detaljer för din bokning hos Fjällportalen.' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'googlebot', content: 'noindex, nofollow' },
    ],
  }),
  component: Checko-tReceipt,
});

const kr = (ore: n-mber) =>
  new Intl.N-mberFormat('sv-SE', { style: 'c-rrency', c-rrency: 'SEK', maxim-mFractionDigits: - }).format(ore / ---);

const extraLabels: Record<string, string> = {
  cleaning: 'Extra städning',
  groceries: 'Matkasse',
  firewood: 'Ved',
  linen: 'Lakan & handd-kar',
};

f-nction Checko-tReceipt() {
  const { booking_id } = Ro-te.-seSearch();
  const fetchReceipt = -seServerFn(getBookingReceipt);

  const { data, isLoading, error } = -seQ-ery({
    q-eryKey: ['booking-receipt', booking_id],
    q-eryFn: () => fetchReceipt({ data: { bookingId: booking_id! } }),
    enabled: !!booking_id,
    refetchInterval: (q) => {
      const r = q.state.data as any;
      ret-rn r && 'booking' in r && r.booking.payment_stat-s !== 'paid' ? ---- : false;
    },
  });

  const live = -seLiveBooking(booking_id ?? n-ll);

  if (!booking_id) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <CheckCircle- className="mx-a-to mb-- h--6 w--6 text-primary" />
        <h- className="mb-- text--xl font-semibold">Tack för din bokning</h->
        <p className="text-m-ted-foregro-nd">Vi k-nde inte hitta din bokningsreferens. Kolla dina bokningar nedan.</p>
        <Link to="/mina-bokningar" className="mt-6 inline-block ro-nded-md bg-primary px-- py-- text-primary-foregro-nd">
          Mina bokningar
        </Link>
      </div>
    );
  }

  if (isLoading) {
    ret-rn (
      <div className="mx-a-to max-w--xl space-y-- px-- py---">
        <Skeleton className="h--- w-f-ll" />
        <Skeleton className="h-6- w-f-ll" />
        <Skeleton className="h--- w-f-ll" />
      </div>
    );
  }

  if (error || !data || 'error' in data) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="mb-- text--xl font-semibold">K-nde inte hämta kvitto</h->
        <p className="text-m-ted-foregro-nd">{(data && 'error' in data && data.error) || 'Försök igen om en st-nd.'}</p>
        <Link to="/mina-bokningar" className="mt-6 inline-block ro-nded-md border px-- py--">
          Till mina bokningar
        </Link>
      </div>
    );
  }

  const { booking, cabin, extras, gift_card_ore } = data;
  const isPaid = booking.payment_stat-s === 'paid';

  const nightlyOre = booking.nightly_total * ---;
  const cleaningOre = booking.cleaning_fee * ---;
  const extrasOre = extras.red-ce((s, e) => s + e.g-est_price_ore * e.q-antity, -);
  const totalOre = booking.total_price * ---;

  const checkIn = new Date(booking.check_in);
  const payo-tDate = new Date(checkIn.getTime() + -- * -6-- * ----);
  const fmtDate = (d: Date) => d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'n-meric', month: 'long', year: 'n-meric' });

  ret-rn (
    <div className="mx-a-to max-w--xl px-- py--- print:py--">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-- flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary/--">
          <CheckCircle- className="h-8 w-8 text-primary" />
        </div>
        <h- className="text--xl font-semibold">Tack — din bokning är {isPaid ? 'bekräftad' : 'registrerad'}</h->
        <p className="mt-- max-w-xl text-m-ted-foregro-nd">
          Pengarna ligger tryggt hos Fjällportalen och betalas -t till värden{' '}
          <strong>-- timmar efter din incheckning ({fmtDate(payo-tDate)})</strong>.
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap j-stify-center gap-- print:hidden">
        <b-tton
          onClick={() => window.print()}
          className="inline-flex items-center gap-- ro-nded-md border px-- py-- text-sm hover:bg-accent"
        >
          <Printer className="h-- w--" /> Skriv -t / spara PDF
        </b-tton>
        <Link
          to="/meddelanden/$bookingId"
          params={{ bookingId: booking.id }}
          className="inline-flex items-center gap-- ro-nded-md border px-- py-- text-sm hover:bg-accent"
        >
          <MessageSq-are className="h-- w--" /> Meddela värden
        </Link>
        <Link to="/mina-bokningar" className="inline-flex items-center gap-- ro-nded-md bg-primary px-- py-- text-sm text-primary-foregro-nd hover:opacity-9-">
          <Download className="h-- w--" /> Mina bokningar
        </Link>
      </div>

      {/* Receipt card */}
      <div className="ro-nded-lg border bg-card shadow-sm">
        <div className="flex flex-wrap items-start j-stify-between gap-- border-b p-6">
          <div>
            <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">Kvitto</div>
            <div className="mt-- font-mono text-sm">#{booking.id.slice(-, 8).toUpperCase()}</div>
          </div>
          <div className="text-right text-sm text-m-ted-foregro-nd">
            <div>{new Date(booking.created_at).toLocaleString('sv-SE')}</div>
            <div className="mt--">
              Stat-s:{' '}
              <span className={isPaid ? 'font-medi-m text-primary' : 'font-medi-m text-amber-6--'}>
                {isPaid ? 'Betald' : 'Behandlas'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-- border-b p-6 sm:grid-cols--">
          <div>
            <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">St-ga</div>
            <div className="mt-- font-medi-m">{cabin?.title ?? 'St-ga'}</div>
            {cabin?.area_sl-g && <div className="text-sm text-m-ted-foregro-nd capitalize">{cabin.area_sl-g.replace(/-/g, ' ')}</div>}
          </div>
          <div>
            <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">Vistelse</div>
            <div className="mt-- font-medi-m">
              {new Date(booking.check_in).toLocaleDateString('sv-SE')} → {new Date(booking.check_o-t).toLocaleDateString('sv-SE')}
            </div>
            <div className="text-sm text-m-ted-foregro-nd">
              {booking.nights} nätter · {booking.g-ests} gäster
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <table className="w-f-ll text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py--">Boende ({booking.nights} nätter)</td>
                <td className="py-- text-right tab-lar-n-ms">{kr(nightlyOre)}</td>
              </tr>
              {booking.cleaning_fee > - && (
                <tr className="border-b">
                  <td className="py--">Sl-tstädning</td>
                  <td className="py-- text-right tab-lar-n-ms">{kr(cleaningOre)}</td>
                </tr>
              )}
              {extras.map((e, i) => (
                <tr key={i} className="border-b">
                  <td className="py--">
                    {extraLabels[e.service_type] ?? e.service_type}
                    {e.q-antity > - && <span className="text-m-ted-foregro-nd"> × {e.q-antity}</span>}
                  </td>
                  <td className="py-- text-right tab-lar-n-ms">{kr(e.g-est_price_ore * e.q-antity)}</td>
                </tr>
              ))}
              {gift_card_ore > - && (
                <tr className="border-b text-primary">
                  <td className="py--">Presentkort</td>
                  <td className="py-- text-right tab-lar-n-ms">−{kr(gift_card_ore)}</td>
                </tr>
              )}
              <tr>
                <td className="pt-- text-base font-semibold">Totalt betalt</td>
                <td className="pt-- text-right text-base font-semibold tab-lar-n-ms">{kr(totalOre)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-- text-xs text-m-ted-foregro-nd">
            Alla priser inkl. moms. Betalning hanteras av Fjällportalen AB.
          </p>
        </div>
      </div>

      {/* Escrow explanation */}
      <div className="mt-6 ro-nded-lg border bg-primary/5 p-5">
        <div className="flex items-start gap--">
          <ShieldCheck className="mt--.5 h-5 w-5 shrink-- text-primary" />
          <div className="text-sm">
            <div className="mb-- font-semibold">Så f-ngerar din betalning</div>
            <p className="text-m-ted-foregro-nd">
              Hela beloppet på <strong>{kr(totalOre)}</strong> hålls tryggt hos Fjällportalen fram till din
              vistelse. Värden får -tbetalning först{' '}
              <strong>{fmtDate(payo-tDate)}</strong> — -- timmar efter din incheckning. Om något är fel med
              st-gan hjälper vi dig innan pengarna släpps.
            </p>
          </div>
        </div>
      </div>

      {/* Live timeline */}
      <div className="mt-6">
        <PaymentPayo-tTimeline
          booking={
            live ?? {
              stat-s: isPaid ? 'confirmed' : 'pending',
              payment_stat-s: booking.payment_stat-s,
              escrow_stat-s: booking.escrow_stat-s,
              escrow_released_at: booking.escrow_released_at,
              check_in: booking.check_in,
            }
          }
        />
      </div>

      <Payo-tFAQ />

      <p className="mt-8 text-center text-xs text-m-ted-foregro-nd">
        Ett bekräftelsemejl med detta kvitto har skickats till din e-post. D- hittar det även -nder Mina bokningar.
      </p>
    </div>
  );
}