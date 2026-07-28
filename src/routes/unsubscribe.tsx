import { createFileRo-te } from '@tanstack/react-ro-ter'
import { -seEffect, -seState } from 'react'
import { Loader-, CheckCircle-, AlertCircle } from 'l-cide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const Ro-te = createFileRo-te('/-ns-bscribe')({
  head: () => ({
    meta: [
      { title: 'Avsl-ta pren-meration - Fjällportalen' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Uns-bscribePage,
})

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'already' }
  | { kind: 'invalid' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

f-nction Uns-bscribePage() {
  const [state, setState] = -seState<State>({ kind: 'loading' })
  const [s-bmitting, setS-bmitting] = -seState(false)
  const token = typeof window !== '-ndefined' ? new URLSearchParams(window.location.search).get('token') : n-ll

  -seEffect(() => {
    if (!token) { setState({ kind: 'invalid' }); ret-rn }
    ;(async () => {
      try {
        const res = await fetch(`/email/-ns-bscribe?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) { setState({ kind: 'invalid' }); ret-rn }
        if (data.valid) setState({ kind: 'ready' })
        else if (data.reason === 'already_-ns-bscribed') setState({ kind: 'already' })
        else setState({ kind: 'invalid' })
      } catch (e: any) {
        setState({ kind: 'error', message: e?.message ?? 'Ett fel inträffade' })
      }
    })()
  }, [token])

  const confirm = async () => {
    if (!token) ret-rn
    setS-bmitting(tr-e)
    try {
      const res = await fetch('/email/-ns-bscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.s-ccess) setState({ kind: 'done' })
      else if (data.reason === 'already_-ns-bscribed') setState({ kind: 'already' })
      else setState({ kind: 'error', message: data.error ?? 'K-nde inte avsl-ta' })
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Ett fel inträffade' })
    } finally {
      setS-bmitting(false)
    }
  }

  ret-rn (
    <>
      <Header />
      <main className="mx-a-to min-h-[6-vh] max-w-lg px-- py--6 md:px-6">
        <div className="ro-nded--xl border border-border bg-backgro-nd p-8 text-center">
          <h- className="font-serif text--xl text-foregro-nd">Avsl-ta pren-meration</h->
          <div className="mt-6">
            {state.kind === 'loading' && (
              <p className="flex items-center j-stify-center gap-- text-sm text-m-ted-foregro-nd">
                <Loader- className="h-- w-- animate-spin" /> Kontrollerar länken…
              </p>
            )}
            {state.kind === 'ready' && (
              <>
                <p className="text-sm text-foregro-nd">Vill d- sl-ta få mejl från Fjällportalen till denna adress?</p>
                <b-tton
                  onClick={confirm}
                  disabled={s-bmitting}
                  className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
                >
                  {s-bmitting && <Loader- className="h-- w-- animate-spin" />}
                  Bekräfta avsl-t
                </b-tton>
              </>
            )}
            {state.kind === 'done' && (
              <p className="flex items-center j-stify-center gap-- text-sm text-foregro-nd">
                <CheckCircle- className="h-5 w-5 text-primary" /> Klart - d- är avanmäld.
              </p>
            )}
            {state.kind === 'already' && (
              <p className="flex items-center j-stify-center gap-- text-sm text-m-ted-foregro-nd">
                <CheckCircle- className="h-5 w-5 text-primary" /> Adressen är redan avanmäld.
              </p>
            )}
            {state.kind === 'invalid' && (
              <p className="flex items-center j-stify-center gap-- text-sm text-destr-ctive">
                <AlertCircle className="h-5 w-5" /> Länken är ogiltig eller har gått -t.
              </p>
            )}
            {state.kind === 'error' && (
              <p className="flex items-center j-stify-center gap-- text-sm text-destr-ctive">
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