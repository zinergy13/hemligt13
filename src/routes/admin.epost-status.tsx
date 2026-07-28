import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { listEmailAttempts, retryEmailAttempt } from '@/lib/email-attempts.functions';

export const Route = createFileRoute('/admin/epost-status')({
  head: () => ({
    meta: [
      { title: 'E-poststatus — Admin — Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EmailStatusPage,
});

type Status = 'all' | 'pending' | 'failed' | 'sent';

function statusBadge(s: string) {
  if (s === 'sent')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="h-3 w-3" /> Skickat
      </span>
    );
  if (s === 'failed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        <XCircle className="h-3 w-3" /> Misslyckat
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      <Clock className="h-3 w-3" /> Väntar
    </span>
  );
}

function EmailStatusPage() {
  const list = useServerFn(listEmailAttempts);
  const retry = useServerFn(retryEmailAttempt);
  const qc = useQueryClient();

  const [status, setStatus] = useState<Status>('failed');
  const [templateName, setTemplateName] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const query = useQuery({
    queryKey: ['email-attempts', status, templateName, search, offset],
    queryFn: () =>
      list({
        data: {
          status,
          templateName: templateName || undefined,
          search: search || undefined,
          limit,
          offset,
        },
      }),
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) toast.success('Skickat på nytt');
      else toast.error(`Kunde inte skicka (status ${res.status})`);
      qc.invalidateQueries({ queryKey: ['email-attempts'] });
    },
    onError: (err: any) => toast.error(err?.message ?? 'Fel vid återförsök'),
  });

  const rows = query.data?.rows ?? [];
  const summary = query.data?.summary ?? { pending: 0, sent: 0, failed: 0 };
  const total = query.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">E-poststatus</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Alla utskick loggas per bokning och mall. Misslyckade försök retryas automatiskt med
        exponentiell backoff upp till 5 försök — därefter markeras de som misslyckade och kräver
        manuellt återförsök.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Kpi label="Väntar" value={summary.pending} tone="amber" icon={<Clock className="h-4 w-4" />} />
        <Kpi label="Skickade" value={summary.sent} tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} />
        <Kpi label="Misslyckade" value={summary.failed} tone="red" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status);
              setOffset(0);
            }}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Alla</option>
            <option value="pending">Väntar</option>
            <option value="failed">Misslyckade</option>
            <option value="sent">Skickade</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Mall</span>
          <select
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value);
              setOffset(0);
            }}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Alla mallar</option>
            <option>booking-confirmation</option>
            <option>escrow-activated</option>
            <option>checkin-reminder</option>
            <option>payout-released</option>
            <option>host-invoice</option>
            <option>gift-card</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted-foreground">Sök mottagare</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="e-post"
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['email-attempts'] })}
          className="ml-auto inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Uppdatera
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
          </div>
        ) : query.error ? (
          <div className="p-6 text-sm text-red-700">Fel: {(query.error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Inga poster.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Mall</th>
                  <th className="px-3 py-2">Mottagare</th>
                  <th className="px-3 py-2">Bokning</th>
                  <th className="px-3 py-2">Försök</th>
                  <th className="px-3 py-2">Nästa retry</th>
                  <th className="px-3 py-2">Senaste fel</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2">{statusBadge(r.status)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.template_name}</td>
                    <td className="px-3 py-2">{r.recipient_email}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {r.booking_id ? r.booking_id.slice(0, 8) : '—'}
                    </td>
                    <td className="px-3 py-2">{r.attempts}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.next_retry_at ? new Date(r.next_retry_at).toLocaleString('sv-SE') : '—'}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      {r.last_error ? (
                        <span className="block max-w-xs truncate text-xs text-red-700" title={r.last_error}>
                          {r.last_status_code ? `[${r.last_status_code}] ` : ''}
                          {r.last_error}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.status !== 'sent' && (
                        <button
                          onClick={() => retryMut.mutate(r.id)}
                          disabled={retryMut.isPending}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" /> Försök igen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Visar {rows.length === 0 ? 0 : offset + 1}–{offset + rows.length} av {total}
        </span>
        <div className="flex gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            Föregående
          </button>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            Nästa
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'emerald' | 'red';
  icon: React.ReactNode;
}) {
  const toneClasses = {
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    red: 'bg-red-50 text-red-900 border-red-200',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase opacity-80">
        {icon} {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}