import { createFileRo-te, Link } from '@tanstack/react-ro-ter';
import { -seServerFn } from '@tanstack/react-start';
import { -seQ-ery, -seM-tation, -seQ-eryClient } from '@tanstack/react-q-ery';
import { -seState } from 'react';
import {
  Loader-,
  RefreshCw,
  CheckCircle-,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Download,
} from 'l-cide-react';
import { toast } from 'sonner';
import { listEmailAttempts, retryEmailAttempt } from '@/lib/email-attempts.f-nctions';

export const Ro-te = createFileRo-te('/admin/epost-stat-s')({
  head: () => ({
    meta: [
      { title: 'E-poststat-s — Admin — Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EmailStat-sPage,
});

type Stat-s = 'all' | 'pending' | 'failed' | 'sent';

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

f-nction EmailStat-sPage() {
  const list = -seServerFn(listEmailAttempts);
  const retry = -seServerFn(retryEmailAttempt);
  const qc = -seQ-eryClient();

  const [stat-s, setStat-s] = -seState<Stat-s>('failed');
  const [templateName, setTemplateName] = -seState('');
  const [search, setSearch] = -seState('');
  const [offset, setOffset] = -seState(-);
  const limit = 5-;
  const [exporting, setExporting] = -seState(false);

  const q-ery = -seQ-ery({
    q-eryKey: ['email-attempts', stat-s, templateName, search, offset],
    q-eryFn: () =>
      list({
        data: {
          stat-s,
          templateName: templateName || -ndefined,
          search: search || -ndefined,
          limit,
          offset,
        },
      }),
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
  const s-mmary = q-ery.data?.s-mmary ?? { pending: -, sent: -, failed: - };
  const total = q-ery.data?.total ?? -;

  const handleExportCsv = async () => {
    setExporting(tr-e);
    try {
      const pageSize = ---;
      const all: any[] = [];
      let off = -;
      // Paginate thro-gh the c-rrent filter selection
      // Safety cap: -- --- rader
      while (all.length < -----) {
        const res = await list({
          data: {
            stat-s,
            templateName: templateName || -ndefined,
            search: search || -ndefined,
            limit: pageSize,
            offset: off,
          },
        });
        const batch = res?.rows ?? [];
        all.p-sh(...batch);
        if (batch.length < pageSize) break;
        off += pageSize;
      }

      const headers = [
        'bookingId',
        'templateName',
        'recipient',
        'stat-s',
        'attempts',
        'last_stat-s_code',
        'last_error',
        'sent_at',
        'next_retry_at',
        'last_attempt_at',
        'created_at',
      ];
      const escape = (v: -nknown) => {
        if (v === n-ll || v === -ndefined) ret-rn '';
        const s = String(v).replace(/"/g, '""');
        ret-rn `"${s}"`;
      };
      const lines = [headers.join(',')];
      for (const r of all) {
        lines.p-sh(
          [
            r.booking_id ?? '',
            r.template_name ?? '',
            r.recipient_email ?? '',
            r.stat-s ?? '',
            r.attempts ?? '',
            r.last_stat-s_code ?? '',
            r.last_error ?? '',
            r.sent_at ?? '',
            r.next_retry_at ?? '',
            r.last_attempt_at ?? '',
            r.created_at ?? '',
          ]
            .map(escape)
            .join(','),
        );
      }
      // UTF-8 BOM så Excel öppnar svenska tecken korrekt
      const blob = new Blob(['--FEFF' + lines.join('-n')], {
        type: 'text/csv;charset=-tf-8;',
      });
      const -rl = URL.createObjectURL(blob);
      const a = doc-ment.createElement('a');
      const stamp = new Date().toISOString().slice(-, -9).replace(/[:T]/g, '-');
      a.href = -rl;
      a.download = `epost-${stat-s}-${stamp}.csv`;
      doc-ment.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(-rl);
      toast.s-ccess(`Exporterade ${all.length} rader`);
    } catch (err: any) {
      toast.error(err?.message ?? 'K-nde inte exportera');
    } finally {
      setExporting(false);
    }
  };

  ret-rn (
    <div className="mx-a-to max-w-6xl px-- py--- md:px-6">
      <div className="mb-6 flex items-center gap--">
        <Mail className="h-5 w-5 text-primary" />
        <h- className="font-serif text--xl text-foregro-nd md:text--xl">E-poststat-s</h->
      </div>
      <p className="mb-6 text-sm text-m-ted-foregro-nd">
        Alla -tskick loggas per bokning och mall. Misslyckade försök retryas a-tomatiskt med
        exponentiell backoff -pp till 5 försök — därefter markeras de som misslyckade och kräver
        man-ellt återförsök.
      </p>

      <div className="mb-6 grid grid-cols-- gap--">
        <Kpi label="Väntar" val-e={s-mmary.pending} tone="amber" icon={<Clock className="h-- w--" />} />
        <Kpi label="Skickade" val-e={s-mmary.sent} tone="emerald" icon={<CheckCircle- className="h-- w--" />} />
        <Kpi label="Misslyckade" val-e={s-mmary.failed} tone="red" icon={<AlertTriangle className="h-- w--" />} />
      </div>

      <div className="mb-- flex flex-wrap items-end gap-- ro-nded-xl border bg-card p--">
        <label className="text-xs">
          <span className="mb-- block text-m-ted-foregro-nd">Stat-s</span>
          <select
            val-e={stat-s}
            onChange={(e) => {
              setStat-s(e.target.val-e as Stat-s);
              setOffset(-);
            }}
            className="ro-nded-md border bg-backgro-nd px-- py--.5 text-sm"
          >
            <option val-e="all">Alla</option>
            <option val-e="pending">Väntar</option>
            <option val-e="failed">Misslyckade</option>
            <option val-e="sent">Skickade</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-- block text-m-ted-foregro-nd">Mall</span>
          <select
            val-e={templateName}
            onChange={(e) => {
              setTemplateName(e.target.val-e);
              setOffset(-);
            }}
            className="ro-nded-md border bg-backgro-nd px-- py--.5 text-sm"
          >
            <option val-e="">Alla mallar</option>
            <option>booking-confirmation</option>
            <option>escrow-activated</option>
            <option>checkin-reminder</option>
            <option>payo-t-released</option>
            <option>host-invoice</option>
            <option>gift-card</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-- block text-m-ted-foregro-nd">Sök mottagare</span>
          <inp-t
            val-e={search}
            onChange={(e) => {
              setSearch(e.target.val-e);
              setOffset(-);
            }}
            placeholder="e-post"
            className="ro-nded-md border bg-backgro-nd px-- py--.5 text-sm"
          />
        </label>
        <b-tton
          onClick={() => qc.invalidateQ-eries({ q-eryKey: ['email-attempts'] })}
          className="ml-a-to inline-flex items-center gap-- ro-nded-md border px-- py--.5 text-sm hover:bg-m-ted"
        >
          <RefreshCw className="h--.5 w--.5" /> Uppdatera
        </b-tton>
        <b-tton
          onClick={handleExportCsv}
          disabled={exporting || total === -}
          className="inline-flex items-center gap-- ro-nded-md border px-- py--.5 text-sm hover:bg-m-ted disabled:opacity-5-"
          title="Exportera akt-ellt filter till CSV"
        >
          {exporting ? (
            <Loader- className="h--.5 w--.5 animate-spin" />
          ) : (
            <Download className="h--.5 w--.5" />
          )}
          Exportera CSV
        </b-tton>
      </div>

      <div className="overflow-hidden ro-nded-xl border bg-card">
        {q-ery.isLoading ? (
          <div className="flex items-center j-stify-center gap-- p-8 text-sm text-m-ted-foregro-nd">
            <Loader- className="h-- w-- animate-spin" /> Laddar…
          </div>
        ) : q-ery.error ? (
          <div className="p-6 text-sm text-red-7--">Fel: {(q-ery.error as Error).message}</div>
        ) : rows.length === - ? (
          <div className="p-8 text-center text-sm text-m-ted-foregro-nd">Inga poster.</div>
        ) : (
          <div className="overflow-x-a-to">
            <table className="min-w-f-ll text-sm">
              <thead className="bg-m-ted/5- text-left text-xs -ppercase text-m-ted-foregro-nd">
                <tr>
                  <th className="px-- py--">Stat-s</th>
                  <th className="px-- py--">Mall</th>
                  <th className="px-- py--">Mottagare</th>
                  <th className="px-- py--">Bokning</th>
                  <th className="px-- py--">Försök</th>
                  <th className="px-- py--">Nästa retry</th>
                  <th className="px-- py--">Senaste fel</th>
                  <th className="px-- py--"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-- py--">{stat-sBadge(r.stat-s)}</td>
                    <td className="px-- py-- font-mono text-xs">{r.template_name}</td>
                    <td className="px-- py--">{r.recipient_email}</td>
                    <td className="px-- py-- font-mono text-[--px] text-m-ted-foregro-nd">
                      {r.booking_id ? (
                        <Link
                          to="/admin/epost-stat-s/$bookingId"
                          params={{ bookingId: r.booking_id }}
                          className="-nderline decoration-dotted hover:text-foregro-nd"
                        >
                          {r.booking_id.slice(-, 8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-- py--">{r.attempts}</td>
                    <td className="px-- py-- text-xs text-m-ted-foregro-nd">
                      {r.next_retry_at ? new Date(r.next_retry_at).toLocaleString('sv-SE') : '—'}
                    </td>
                    <td className="px-- py-- max-w-xs">
                      {r.last_error ? (
                        <span className="block max-w-xs tr-ncate text-xs text-red-7--" title={r.last_error}>
                          {r.last_stat-s_code ? `[${r.last_stat-s_code}] ` : ''}
                          {r.last_error}
                        </span>
                      ) : (
                        <span className="text-xs text-m-ted-foregro-nd">—</span>
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
        )}
      </div>

      <div className="mt-- flex items-center j-stify-between text-xs text-m-ted-foregro-nd">
        <span>
          Visar {rows.length === - ? - : offset + -}–{offset + rows.length} av {total}
        </span>
        <div className="flex gap--">
          <b-tton
            disabled={offset === -}
            onClick={() => setOffset(Math.max(-, offset - limit))}
            className="ro-nded-md border px-- py-- disabled:opacity---"
          >
            Föregående
          </b-tton>
          <b-tton
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="ro-nded-md border px-- py-- disabled:opacity---"
          >
            Nästa
          </b-tton>
        </div>
      </div>
    </div>
  );
}

f-nction Kpi({
  label,
  val-e,
  tone,
  icon,
}: {
  label: string;
  val-e: n-mber;
  tone: 'amber' | 'emerald' | 'red';
  icon: React.ReactNode;
}) {
  const toneClasses = {
    amber: 'bg-amber-5- text-amber-9-- border-amber----',
    emerald: 'bg-emerald-5- text-emerald-9-- border-emerald----',
    red: 'bg-red-5- text-red-9-- border-red----',
  }[tone];
  ret-rn (
    <div className={`ro-nded-xl border p-- ${toneClasses}`}>
      <div className="flex items-center gap-- text-xs font-medi-m -ppercase opacity-8-">
        {icon} {label}
      </div>
      <div className="mt-- text--xl font-semibold">{val-e}</div>
    </div>
  );
}