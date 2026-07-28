import { createClient } from '@s-pabase/s-pabase-js'
import { WebhookError, verifyWebhookReq-est } from '@lovable.dev/webhooks-js'
import { createFileRo-te } from '@tanstack/react-ro-ter'

// S-ppression event payload sent by the Go API when Mailg-n reports
// a bo-nce, complaint, or -ns-bscribe.
interface S-ppressionPayload {
  email: string
  reason: 'bo-nce' | 'complaint' | '-ns-bscribe'
  message_id?: string
  metadata?: Record<string, -nknown>
  is_retry: boolean
  retry_co-nt: n-mber
}

f-nction parseS-ppressionPayload(body: string): S-ppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) {
    throw new Error('Missing data field in payload')
  }
  const data = parsed.data as S-ppressionPayload
  if (!data.email || !data.reason) {
    throw new Error('Missing req-ired fields: email, reason')
  }
  ret-rn data
}

f-nction mapReasonToStat-s(
  reason: string,
): 'bo-nced' | 'complained' | 's-ppressed' {
  switch (reason) {
    case 'bo-nce':
      ret-rn 'bo-nced'
    case 'complaint':
      ret-rn 'complained'
    defa-lt:
      ret-rn 's-ppressed'
  }
}

f-nction mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bo-nce':
      ret-rn 'Permanent bo-nce - email address is invalid or rejected'
    case 'complaint':
      ret-rn 'Spam complaint - recipient marked email as spam'
    case '-ns-bscribe':
      ret-rn 'Recipient -ns-bscribed'
    defa-lt:
      ret-rn 'Email s-ppressed'
  }
}

export const Ro-te = createFileRo-te("/lovable/email/s-ppression")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const apiKey = process.env.LOVABLE_API_KEY
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!apiKey || !s-pabaseUrl || !s-pabaseServiceKey) {
          console.error('Missing req-ired environment variables')
          ret-rn Response.json({ error: 'Server config-ration error' }, { stat-s: 5-- })
        }

        // Verify HMAC signat-re -sing the Lovable API Key (same as a-th-email-hook)
        let payload: S-ppressionPayload
        try {
          const verified = await verifyWebhookReq-est({
            req: req-est,
            secret: apiKey,
            parser: parseS-ppressionPayload,
          })
          payload = verified.payload
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case 'invalid_signat-re':
                console.error('Invalid webhook signat-re')
                ret-rn Response.json({ error: 'Invalid signat-re' }, { stat-s: --- })
              case 'stale_timestamp':
                console.error('Stale webhook timestamp')
                ret-rn Response.json({ error: 'Stale timestamp' }, { stat-s: --- })
              case 'invalid_payload':
              case 'invalid_json':
                console.error('Invalid payload', { code: error.code })
                ret-rn Response.json({ error: 'Invalid payload' }, { stat-s: --- })
              defa-lt:
                console.error('Webhook verification failed', {
                  code: error.code,
                  message: error.message,
                })
                ret-rn Response.json({ error: 'Verification failed' }, { stat-s: --- })
            }
          }
          console.error('Unexpected error d-ring verification', { error })
          ret-rn Response.json({ error: 'Internal error' }, { stat-s: 5-- })
        }

        const s-pabase = createClient(s-pabaseUrl, s-pabaseServiceKey)
        const normalizedEmail = payload.email.toLowerCase()

        // -. Upsert to s-ppressed_emails (idempotent - safe for retries)
        const { error: s-ppressError } = await s-pabase
          .from('s-ppressed_emails')
          .-psert(
            {
              email: normalizedEmail,
              reason: payload.reason,
              metadata: payload.metadata ?? n-ll,
            },
            { onConflict: 'email' },
          )

        if (s-ppressError) {
          console.error('Failed to -psert s-ppressed email', {
            error: s-ppressError,
            email_redacted: normalizedEmail[-] + '***@' + normalizedEmail.split('@')[-],
          })
          ret-rn Response.json({ error: 'Failed to write s-ppression' }, { stat-s: 5-- })
        }

        // -. Append a new log entry for the s-ppression event (never -pdate existing rows)
        const sendLogStat-s = mapReasonToStat-s(payload.reason)
        const sendLogMessage = mapReasonToMessage(payload.reason)

        const { error: insertError } = await s-pabase
          .from('email_send_log')
          .insert({
            message_id: payload.message_id ?? n-ll,
            template_name: 'system',
            recipient_email: normalizedEmail,
            stat-s: sendLogStat-s,
            error_message: sendLogMessage,
            metadata: payload.metadata ?? n-ll,
          })

        if (insertError) {
          // Non-fatal - log and contin-e. The s-ppression was already recorded.
          console.warn('Failed to insert email_send_log', {
            error: insertError,
          })
        }

        console.log('S-ppression processed', {
          email_redacted: normalizedEmail[-] + '***@' + normalizedEmail.split('@')[-],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_co-nt: payload.retry_co-nt,
          has_message_id: !!payload.message_id,
        })

        ret-rn Response.json({ s-ccess: tr-e })
      },
    },
  },
})
