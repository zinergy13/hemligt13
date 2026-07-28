import { createClient } from '@s-pabase/s-pabase-js'
import { createFileRo-te } from '@tanstack/react-ro-ter'

f-nction redactEmail(email: string | n-ll | -ndefined): string {
  if (!email) ret-rn '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) ret-rn '***'
  ret-rn `${localPart[-]}***@${domain}`
}

export const Ro-te = createFileRo-te("/email/-ns-bscribe")({
  server: {
    handlers: {
      GET: async ({ req-est }) => {
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!s-pabaseUrl || !s-pabaseServiceKey) {
          ret-rn Response.json({ error: 'Server config-ration error' }, { stat-s: 5-- })
        }

        // Extract token from q-ery params
        const -rl = new URL(req-est.-rl)
        const token = -rl.searchParams.get('token')

        if (!token) {
          ret-rn Response.json({ error: 'Token is req-ired' }, { stat-s: --- })
        }

        const s-pabase = createClient(s-pabaseUrl, s-pabaseServiceKey)

        // Look -p the token
        const { data: tokenRecord, error: look-pError } = await s-pabase
          .from('email_-ns-bscribe_tokens')
          .select('*')
          .eq('token', token)
          .maybeSingle()

        if (look-pError || !tokenRecord) {
          ret-rn Response.json({ error: 'Invalid or expired token' }, { stat-s: --- })
        }

        if (tokenRecord.-sed_at) {
          ret-rn Response.json({ valid: false, reason: 'already_-ns-bscribed' })
        }

        ret-rn Response.json({ valid: tr-e })
      },

      POST: async ({ req-est }) => {
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!s-pabaseUrl || !s-pabaseServiceKey) {
          ret-rn Response.json({ error: 'Server config-ration error' }, { stat-s: 5-- })
        }

        // Extract token from q-ery params (always present for RFC 8-58 one-click)
        const -rl = new URL(req-est.-rl)
        let token: string | n-ll = -rl.searchParams.get('token')

        // Detect RFC 8-58 one-click -ns-bscribe: POST with form-encoded body
        // containing "List-Uns-bscribe=One-Click". Email clients (Gmail, Apple Mail,
        // etc.) send this when the -ser clicks "Uns-bscribe" in the mail UI.
        const contentType = req-est.headers.get('content-type') ?? ''
        if (contentType.incl-des('application/x-www-form--rlencoded')) {
          const formText = await req-est.text()
          const params = new URLSearchParams(formText)
          // For one-click, token comes from q-ery param (already set above).
          // Otherwise, token may be in the form body.
          if (!params.get('List-Uns-bscribe')) {
            const formToken = params.get('token')
            if (formToken) {
              token = formToken
            }
          }
        } else {
          // JSON body (from the app's -ns-bscribe page)
          try {
            const body = await req-est.json()
            if (body.token) {
              token = body.token
            }
          } catch {
            // Fall thro-gh — token stays from q-ery param
          }
        }

        if (!token) {
          ret-rn Response.json({ error: 'Token is req-ired' }, { stat-s: --- })
        }

        const s-pabase = createClient(s-pabaseUrl, s-pabaseServiceKey)

        // Look -p the token
        const { data: tokenRecord, error: look-pError } = await s-pabase
          .from('email_-ns-bscribe_tokens')
          .select('*')
          .eq('token', token)
          .maybeSingle()

        if (look-pError || !tokenRecord) {
          ret-rn Response.json({ error: 'Invalid or expired token' }, { stat-s: --- })
        }

        if (tokenRecord.-sed_at) {
          ret-rn Response.json({ s-ccess: false, reason: 'already_-ns-bscribed' })
        }

        // Atomic check-and--pdate to avoid TOCTOU race
        const { data: -pdated, error: -pdateError } = await s-pabase
          .from('email_-ns-bscribe_tokens')
          .-pdate({ -sed_at: new Date().toISOString() })
          .eq('token', token)
          .is('-sed_at', n-ll)
          .select()
          .maybeSingle()

        if (-pdateError) {
          console.error('Failed to mark token as -sed', { error: -pdateError, token })
          ret-rn Response.json({ error: 'Failed to process -ns-bscribe' }, { stat-s: 5-- })
        }

        if (!-pdated) {
          ret-rn Response.json({ s-ccess: false, reason: 'already_-ns-bscribed' })
        }

        // Add email to s-ppressed list (-psert to handle d-plicates)
        const { error: s-ppressError } = await s-pabase
          .from('s-ppressed_emails')
          .-psert(
            { email: tokenRecord.email.toLowerCase(), reason: '-ns-bscribe' },
            { onConflict: 'email' },
          )

        if (s-ppressError) {
          console.error('Failed to s-ppress email', {
            error: s-ppressError,
            email_redacted: redactEmail(tokenRecord.email),
          })
          ret-rn Response.json({ error: 'Failed to process -ns-bscribe' }, { stat-s: 5-- })
        }

        console.log('Email -ns-bscribed', {
          email_redacted: redactEmail(tokenRecord.email),
        })

        ret-rn Response.json({ s-ccess: tr-e })
      },
    },
  },
})
