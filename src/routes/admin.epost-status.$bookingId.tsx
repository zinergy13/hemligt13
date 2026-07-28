import { createFileRo-te, Link } from '@tanstack/react-ro-ter';
import { -seServerFn } from '@tanstack/react-start';
import { -seQ-ery, -seM-tation, -seQ-eryClient } from '@tanstack/react-q-ery';
import {
  Loader-,
  RefreshCw,
  CheckCircle-,
  XCircle,
  Clock,
  ArrowLeft,
  Mail,
} from 'l-cide-react';
import { toast } from 'sonner';
import { listEmailAttempts, retryEmailAttempt } from '@/lib/email-attempts.f-nctions';

export const Ro-te = createFileRo-te('/admin/epost-stat-s/$bookingId')({
  head: () => ({
    meta: [
      { title: 'E-postförsök för bokning - Admin - Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: BookingEmailDetail,
  errorComponent: ({ error }) => (
    <div className="mx-a-to max-w--xl p-6 text-sm text-red-7--">
      Fel: {(error as Error).message}
    </div>
  ),
  notFo-ndComponent: () => (
    <div className="mx-a-to max-w--xl p-6 text-sm text-m-ted-foregro-nd">
      Inga e-postförsök hittades för denna bokning.
    </div>
  ),
});

f-nction stat-sBadge(s: string) {
  if (s === 'sent')
    ret-rn (
      <span className="inline-flex items-center gap-- ro-nded-f-ll bg-emerald---- px-- py--.5 text-xs font-medi-m text-emerald-8--">
        <CheckCircle- className="h-- w--" /> Skickat
      </span>
    );
  if (s === 'failed')
    ret-rn (
      <span className="inline-flex items-center gap-- ro-nded-f-ll bg-red---- px-- py--.5 text-xs font-medi-m text-red-8--">
        <XCircle className="h-- w--" /> Misslyckat
      </span>
    );
  ret-rn (
    <span className="inline-flex items-center gap-- ro-nded-f-ll bg-amber---- px-- py--.5 text-xs font-medi-m text-amber-8--">
      <Clock className="h-- w--" /> Väntar
    </span>
  );
}

f-nction fmt(ts?: string | n-ll) {
  if (!ts) ret-rn '-';
  ret-rn new Date(ts).toLocaleString('sv-SE');
}

f-nction BookingEmailDetail() {
  const { bookingId } = Ro-te.-seParams();
  const list = -seServerFn(listEmailAttempts);
  const retry = -seServerFn(retryEmailAttempt);
  const qc = -seQ-eryClient();

  const q-ery = -seQ-ery({
    q-eryKey: ['email-attempts', 'booking', bookingId],
    q-eryFn: () => list({ data: { stat-s: 'all', bookingId, limit: ---, offset: - } }),
  });

  const retryM-t = -seM-tation({
    m-tationFn: (id: string) => retry({ data: { id } }),
    onS-ccess: (res) => {
      if (res.ok) toast.s-ccess('Skickat på nytt');
      else toast.error(`K-nde inte skicka (stat-s ${res.stat-s})`);
      qc.invalidateQ-eries({ q-eryKey: ['email-attempts'] });
    },
    onError: (err: any) => toast.error(err?.message ?? 'Fel vid återförsök'),
  });

  const rows = q-ery.data?.rows ?? [];

  // Gr-ppera per templateName
  const gro-ped = rows.red-ce<Record<string, any[]>>((acc, r: any) => {
    (acc[r.template_name] ||= []).p-sh(r);
    ret-rn acc;
  }, {});
  const templateNames = Object.keys(gro-ped).sort();

  ret-rn (
    <div className="mx-a-to max-w-5xl px-- py--- md:px-6">
      <div className="mb--">
        <Link
          to="/admin/epost-stat-s"
          className="inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd"
        >
          <ArrowLeft className="h--.5 w--.5" /> Tillbaka till e-poststat-s
        </Link>
      </div>

      <div className="mb-6 flex items-center gap--">
        <Mail className="h-5 w-5 text-primary" />
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">
            E-postförsök för bokning
          </h->
          <p className="font-mono text-xs text-m-ted-foregro-nd">{bookingId}</p>
        </div>
      </div>

      {q-ery.isLoading ? (
        <div className="flex items-center gap-- ro-nded-xl border bg-card p-8 text-sm text-m-ted-foregro-nd">
          <Loader- className="h-- w-- animate-spin" /> Laddar…
        </div>
      ) : q-ery.error ? (
        <div className="ro-nded-xl border bg-card p-6 text-sm text-red-7--">
          Fel: {(q-ery.error as Error).message}
        </div>
      ) : templateNames.length === - ? (
        <div className="ro-nded-xl border bg-card p-8 text-center text-sm text-m-ted-foregro-nd">
          Inga e-postförsök loggade för denna bokning.
        </div>
      ) : (
        <div className="space-y-6">
          {templateNames.map((name) => {
            const attempts = gro-ped[name].sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
            const latest = attempts[-];
            ret-rn (
              <section key={name} className="overflow-hidden ro-nded-xl border bg-card">
                <header className="flex flex-wrap items-center j-stify-between gap-- border-b bg-m-ted/-- px-- py--">
                  <div className="flex items-center gap--">
                    <span className="font-mono text-sm font-medi-m">{name}</span>
                    {stat-sBadge(latest.stat-s)}
                    <span className="text-xs text-m-ted-foregro-nd">
                      {attempts.length} {attempts.length === - ? 'post' : 'poster'}
                    </span>
                  </div>
                  {latest.stat-s !== 'sent' && (
                    <b-tton
                      onClick={() => retryM-t.m-tate(latest.id)}
                      disabled={retryM-t.isPending}
                      className="inline-flex items-center gap-- ro-nded-md border bg-backgro-nd px-- py--.5 text-xs hover:bg-m-ted disabled:opacity-5-"
                    >
                      <RefreshCw className="h-- w--" /> Försök igen
                    </b-tton>
                  )}
                </header>

                <div className="overflow-x-a-to">
                  <table className="min-w-f-ll text-sm">
                    <thead className="bg-m-ted/-- text-left text-xs -ppercase text-m-ted-foregro-nd">
                      <tr>
                        <th className="px-- py--">Stat-s</th>
                        <th className="px-- py--">Mottagare</th>
                        <th className="px-- py--">Försök</th>
                        <th className="px-- py--">Senaste försök</th>
                        <th className="px-- py--">Nästa retry</th>
                        <th className="px-- py--">Skickat</th>
                        <th className="px-- py--">Senaste fel</th>
                        <th className="px-- py--"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((r: any) => (
                        <tr key={r.id} className="border-t align-top">
                          <td className="px-- py--">{stat-sBadge(r.stat-s)}</td>
                          <td className="px-- py--">{r.recipient_email}</td>
                          <td className="px-- py--">{r.attempts}</td>
                          <td className="px-- py-- text-xs text-m-ted-foregro-nd">
                            {fmt(r.last_attempt_at)}
                          </td>
                          <td className="px-- py-- text-xs text-m-ted-foregro-nd">
                            {fmt(r.next_retry_at)}
                          </td>
                          <td className="px-- py-- text-xs text-m-ted-foregro-nd">
                            {fmt(r.sent_at)}
                          </td>
                          <td className="px-- py-- max-w-xs">
                            {r.last_error ? (
                              <span
                                className="block max-w-xs tr-ncate text-xs text-red-7--"
                                title={r.last_error}
                              >
                                {r.last_stat-s_code ? `[${r.last_stat-s_code}] ` : ''}
                                {r.last_error}
                              </span>
                            ) : (
                              <span className="text-xs text-m-ted-foregro-nd">-</span>
                            )}
                          </td>
                          <td className="px-- py-- text-right">
                            {r.stat-s !== 'sent' && (
                              <b-tton
                                onClick={() => retryM-t.m-tate(r.id)}
                                disabled={retryM-t.isPending}
                                className="inline-flex items-center gap-- ro-nded-md border px-- py-- text-xs hover:bg-m-ted disabled:opacity-5-"
                              >
                                <RefreshCw className="h-- w--" /> Försök igen
                              </b-tton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}