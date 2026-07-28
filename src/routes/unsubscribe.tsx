import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const Route = createFileRoute('/unsubscribe')({
  head: () => ({
    meta: [
      { title: 'Avsluta prenumeration — Fjällportalen' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: UnsubscribePage,
})

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [submitting, setSubmitting] = useState(false)
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null

  useEffect(() => {
    if (!token) { setState({ kind: 'invalid' }); return }
    ;(async () => {
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) { setState({ kind: 'invalid' }); return }
        if (data.valid) setState({ kind: 'ready' })
        else if (data.reason === 'already_unsubscribed') setState({ kind: 'already' })
        else setState({ kind: 'invalid' })
      } catch (e: any) {
        setState({ kind: 'error', message: e?.message ?? 'Ett fel inträffade' })
      }
    })()
  }, [token])

  const confirm = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) setState({ kind: 'done' })
      else if (data.reason === 'already_unsubscribed') setState({ kind: 'already' })
      else setState({ kind: 'error', message: data.error ?? 'Kunde inte avsluta' })
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Ett fel inträffade' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-16 md:px-6">
        <div className="rounded-3xl border border-border bg-background p-8 text-center">
          <h1 className="font-serif text-2xl text-foreground">Avsluta prenumeration</h1>
          <div className="mt-6">
            {state.kind === 'loading' && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Kontrollerar länken…
              </p>
            )}
            {state.kind === 'ready' && (
              <>
                <p className="text-sm text-foreground">Vill du sluta få mejl från Fjällportalen till denna adress?</p>
                <button
                  onClick={confirm}
                  disabled={submitting}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Bekräfta avslut
                </button>
              </>
            )}
            {state.kind === 'done' && (
              <p className="flex items-center justify-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Klart — du är avanmäld.
              </p>
            )}
            {state.kind === 'already' && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Adressen är redan avanmäld.
              </p>
            )}
            {state.kind === 'invalid' && (
              <p className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-5 w-5" /> Länken är ogiltig eller har gått ut.
              </p>
            )}
            {state.kind === 'error' && (
              <p className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-5 w-5" /> {state.message}
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}