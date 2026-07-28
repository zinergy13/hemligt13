import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { listEmailAttempts, retryEmailAttempt } from '@/lib/email-attempts.functions';

export const Route = createFileRoute('/admin/epost-status/$bookingId')({
  head: () => ({
    meta: [
      { title: 'E-postförsök för bokning — Admin — Fjällportalen' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: BookingEmailDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl p-6 text-sm text-red-700">
      Fel: {(error as Error).message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">
      Inga e-postförsök hittades för denna bokning.
    </div>
  ),
});

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

function fmt(ts?: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('sv-SE');
}

function BookingEmailDetail() {
  const { bookingId } = Route.useParams();
  const list = useServerFn(listEmailAttempts);
  const retry = useServerFn(retryEmailAttempt);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['email-attempts', 'booking', bookingId],
    queryFn: () => list({ data: { status: 'all', bookingId, limit: 200, offset: 0 } }),
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

  // Gruppera per templateName
  const grouped = rows.reduce<Record<string, any[]>>((acc, r: any) => {
    (acc[r.template_name] ||= []).push(r);
    return acc;
  }, {});
  const templateNames = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-4">
        <Link
          to="/admin/epost-status"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Tillbaka till e-poststatus
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-serif text-2xl text-foreground md:text-3xl">
            E-postförsök för bokning
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{bookingId}</p>
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar…
        </div>
      ) : query.error ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-red-700">
          Fel: {(query.error as Error).message}
        </div>
      ) : templateNames.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Inga e-postförsök loggade för denna bokning.
        </div>
      ) : (
        <div className="space-y-6">
          {templateNames.map((name) => {
            const attempts = grouped[name].sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
            const latest = attempts[0];
            return (
              <section key={name} className="overflow-hidden rounded-xl border bg-card">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{name}</span>
                    {statusBadge(latest.status)}
                    <span className="text-xs text-muted-foreground">
                      {attempts.length} {attempts.length === 1 ? 'post' : 'poster'}
                    </span>
                  </div>
                  {latest.status !== 'sent' && (
                    <button
                      onClick={() => retryMut.mutate(latest.id)}
                      disabled={retryMut.isPending}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" /> Försök igen
                    </button>
                  )}
                </header>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/20 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Mottagare</th>
                        <th className="px-3 py-2">Försök</th>
                        <th className="px-3 py-2">Senaste försök</th>
                        <th className="px-3 py-2">Nästa retry</th>
                        <th className="px-3 py-2">Skickat</th>
                        <th className="px-3 py-2">Senaste fel</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((r: any) => (
                        <tr key={r.id} className="border-t align-top">
                          <td className="px-3 py-2">{statusBadge(r.status)}</td>
                          <td className="px-3 py-2">{r.recipient_email}</td>
                          <td className="px-3 py-2">{r.attempts}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {fmt(r.last_attempt_at)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {fmt(r.next_retry_at)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {fmt(r.sent_at)}
                          </td>
                          <td className="px-3 py-2 max-w-xs">
                            {r.last_error ? (
                              <span
                                className="block max-w-xs truncate text-xs text-red-700"
                                title={r.last_error}
                              >
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}