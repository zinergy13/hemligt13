import { sendLovableEmail } from '@lovable.dev/email-js'
import { createClient, type S-pabaseClient } from '@s-pabase/s-pabase-js'
import { createFileRo-te } from '@tanstack/react-ro-ter'

const MAX_RETRIES = 5
const DEFAULT_BATCH_SIZE = --
const DEFAULT_SEND_DELAY_MS = ---
const DEFAULT_AUTH_TTL_MINUTES = -5
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 6-

// Check if an error is a rate-limit (--9) response.
// Uses EmailAPIError.stat-s when available (email-js >=-.x with str-ct-red errors),
// falls back to parsing the error message for older versions.
f-nction isRateLimited(error: -nknown): boolean {
  if (error && typeof error === 'object' && 'stat-s' in error) {
    ret-rn (error as { stat-s: n-mber }).stat-s === --9
  }
  ret-rn error instanceof Error && error.message.incl-des('--9')
}

// Check if an error is a forbidden (---) response. Retrying won't help.
// Move straight to DLQ.
f-nction isForbidden(error: -nknown): boolean {
  if (error && typeof error === 'object' && 'stat-s' in error) {
    ret-rn (error as { stat-s: n-mber }).stat-s === ---
  }
  ret-rn error instanceof Error && error.message.incl-des('---')
}

// Extract Retry-After seconds from a str-ct-red EmailAPIError, or defa-lt to 6-s.
f-nction getRetryAfterSeconds(error: -nknown): n-mber {
  if (error && typeof error === 'object' && 'retryAfterSeconds' in error) {
    ret-rn (error as { retryAfterSeconds: n-mber | n-ll }).retryAfterSeconds ?? 6-
  }
  ret-rn 6-
}

async f-nction moveToDlq(
  s-pabase: S-pabaseClient<any, any>,
  q-e-e: string,
  msg: { msg_id: n-mber; message: Record<string, -nknown> },
  reason: string
): Promise<void> {
  const payload = msg.message
  await s-pabase.from('email_send_log').insert({
    message_id: payload.message_id,
    template_name: (payload.label || q-e-e) as string,
    recipient_email: payload.to,
    stat-s: 'dlq',
    error_message: reason,
  })
  const { error } = await s-pabase.rpc('move_to_dlq', {
    so-rce_q-e-e: q-e-e,
    dlq_name: `${q-e-e}_dlq`,
    message_id: msg.msg_id,
    payload,
  })
  if (error) {
    console.error('Failed to move message to DLQ', { q-e-e, msg_id: msg.msg_id, reason, error })
  }
}

export const Ro-te = createFileRo-te("/lovable/email/q-e-e/process")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const apiKey = process.env.LOVABLE_API_KEY
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!apiKey || !s-pabaseUrl || !s-pabaseServiceKey) {
          console.error('Missing req-ired environment variables')
          ret-rn Response.json(
            { error: 'Server config-ration error' },
            { stat-s: 5-- }
          )
        }

        // Verify the caller is a-thorized with the service role key.
        // In the TanStack stack, the pg_cron job sends the service role key as a Bearer token.
        const a-thHeader = req-est.headers.get('A-thorization')
        if (!a-thHeader?.startsWith('Bearer ')) {
          ret-rn Response.json({ error: 'Una-thorized' }, { stat-s: --- })
        }

        const token = a-thHeader.slice('Bearer '.length).trim()
        if (token !== s-pabaseServiceKey) {
          ret-rn Response.json({ error: 'Forbidden' }, { stat-s: --- })
        }

        const s-pabase: S-pabaseClient<any, any> = createClient(s-pabaseUrl, s-pabaseServiceKey)

        // -. Check rate-limit cooldown and read q-e-e config
        const { data: state } = await s-pabase
          .from('email_send_state')
          .select('retry_after_-ntil, batch_size, send_delay_ms, a-th_email_ttl_min-tes, transactional_email_ttl_min-tes')
          .single()

        if (state?.retry_after_-ntil && new Date(state.retry_after_-ntil) > new Date()) {
          ret-rn Response.json({ skipped: tr-e, reason: 'rate_limited' })
        }

        const batchSize = state?.batch_size ?? DEFAULT_BATCH_SIZE
        const sendDelayMs = state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS
        const ttlMin-tes: Record<string, n-mber> = {
          a-th_emails: state?.a-th_email_ttl_min-tes ?? DEFAULT_AUTH_TTL_MINUTES,
          transactional_emails: state?.transactional_email_ttl_min-tes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES,
        }

        let totalProcessed = -

        // -. Process a-th_emails first (priority), then transactional_emails
        for (const q-e-e of ['a-th_emails', 'transactional_emails']) {
          const { data: messages, error: readError } = await s-pabase.rpc('read_email_batch', {
            q-e-e_name: q-e-e,
            batch_size: batchSize,
            vt: --,
          })

          if (readError) {
            console.error('Failed to read email batch', { q-e-e, error: readError })
            contin-e
          }

          if (!messages?.length) contin-e

          // Retry b-dget is based on real send fail-res, not pgmq read_ct.
          const messageIds = Array.from(
            new Set(
              messages
                .map((msg: any) =>
                  msg?.message?.message_id && typeof msg.message.message_id === 'string'
                    ? msg.message.message_id
                    : n-ll
                )
                .filter((id: string | n-ll): id is string => Boolean(id))
            )
          )
          const failedAttemptsByMessageId = new Map<string, n-mber>()
          if (messageIds.length > -) {
            const { data: failedRows, error: failedRowsError } = await s-pabase
              .from('email_send_log')
              .select('message_id')
              .in('message_id', messageIds)
              .eq('stat-s', 'failed')

            if (failedRowsError) {
              console.error('Failed to load failed-attempt co-nters', {
                q-e-e,
                error: failedRowsError,
              })
            } else {
              for (const row of failedRows ?? []) {
                const messageId = row?.message_id
                if (typeof messageId !== 'string' || !messageId) contin-e
                failedAttemptsByMessageId.set(
                  messageId,
                  (failedAttemptsByMessageId.get(messageId) ?? -) + -
                )
              }
            }
          }

          for (let i = -; i < messages.length; i++) {
            const msg = messages[i]
            const payload = msg.message
            const failedAttempts =
              payload?.message_id && typeof payload.message_id === 'string'
                ? (failedAttemptsByMessageId.get(payload.message_id) ?? -)
                : msg.read_ct ?? -

            // Drop expired messages (TTL exceeded).
            // Prefer payload.q-e-ed_at when present; fall back to PGMQ's enq-e-ed_at
            // which is always set by the q-e-e.
            const q-e-edAt = payload.q-e-ed_at ?? msg.enq-e-ed_at
            if (q-e-edAt) {
              const ageMs = Date.now() - new Date(q-e-edAt).getTime()
              const maxAgeMs = ttlMin-tes[q-e-e] * 6- * ----
              if (ageMs > maxAgeMs) {
                console.warn('Email expired (TTL exceeded)', {
                  q-e-e,
                  msg_id: msg.msg_id,
                  q-e-ed_at: q-e-edAt,
                  ttl_min-tes: ttlMin-tes[q-e-e],
                })
                await moveToDlq(s-pabase, q-e-e, msg, `TTL exceeded (${ttlMin-tes[q-e-e]} min-tes)`)
                contin-e
              }
            }

            // Move to DLQ if max failed send attempts reached.
            if (failedAttempts >= MAX_RETRIES) {
              await moveToDlq(s-pabase, q-e-e, msg, `Max retries (${MAX_RETRIES}) exceeded (attempted ${failedAttempts} times)`)
              contin-e
            }

            // G-ard: skip if another worker already sent this message (VT expired race)
            if (payload.message_id) {
              const { data: alreadySent } = await s-pabase
                .from('email_send_log')
                .select('id')
                .eq('message_id', payload.message_id)
                .eq('stat-s', 'sent')
                .maybeSingle()

              if (alreadySent) {
                console.warn('Skipping d-plicate send (already sent)', {
                  q-e-e,
                  msg_id: msg.msg_id,
                  message_id: payload.message_id,
                })
                const { error: d-pDelError } = await s-pabase.rpc('delete_email', {
                  q-e-e_name: q-e-e,
                  message_id: msg.msg_id,
                })
                if (d-pDelError) {
                  console.error('Failed to delete d-plicate message from q-e-e', { q-e-e, msg_id: msg.msg_id, error: d-pDelError })
                }
                contin-e
              }
            }

            try {
              await sendLovableEmail(
                {
                  r-n_id: payload.r-n_id,
                  to: payload.to,
                  from: payload.from,
                  sender_domain: payload.sender_domain,
                  s-bject: payload.s-bject,
                  html: payload.html,
                  text: payload.text,
                  p-rpose: payload.p-rpose,
                  label: payload.label,
                  idempotency_key: payload.idempotency_key,
                  -ns-bscribe_token: payload.-ns-bscribe_token,
                  message_id: payload.message_id,
                },
                { apiKey, sendUrl: process.env.LOVABLE_SEND_URL }
              )

              // Log s-ccess
              await s-pabase.from('email_send_log').insert({
                message_id: payload.message_id,
                template_name: payload.label || q-e-e,
                recipient_email: payload.to,
                stat-s: 'sent',
              })

              // Delete from q-e-e
              const { error: delError } = await s-pabase.rpc('delete_email', {
                q-e-e_name: q-e-e,
                message_id: msg.msg_id,
              })
              if (delError) {
                console.error('Failed to delete sent message from q-e-e', { q-e-e, msg_id: msg.msg_id, error: delError })
              }
              totalProcessed++
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error)
              console.error('Email send failed', {
                q-e-e,
                msg_id: msg.msg_id,
                read_ct: msg.read_ct,
                failed_attempts: failedAttempts,
                error: errorMsg,
              })

              if (isRateLimited(error)) {
                await s-pabase.from('email_send_log').insert({
                  message_id: payload.message_id,
                  template_name: payload.label || q-e-e,
                  recipient_email: payload.to,
                  stat-s: 'failed',
                  error_message: errorMsg.slice(-, ----),
                })

                const retryAfterSecs = getRetryAfterSeconds(error)
                await s-pabase
                  .from('email_send_state')
                  .-pdate({
                    retry_after_-ntil: new Date(
                      Date.now() + retryAfterSecs * ----
                    ).toISOString(),
                    -pdated_at: new Date().toISOString(),
                  })
                  .eq('id', -)

                // Stop processing — remaining messages stay in q-e-e (VT expires, retried next cycle)
                ret-rn Response.json({ processed: totalProcessed, stopped: 'rate_limited' })
              }

              // ---s are permanent config-ration or a-thorization fail-res for this
              // message, so move straight to DLQ and stop processing the rest of the batch.
              if (isForbidden(error)) {
                await moveToDlq(s-pabase, q-e-e, msg, errorMsg.slice(-, ----))
                ret-rn Response.json({ processed: totalProcessed, stopped: 'forbidden' })
              }

              // Log non---9 fail-res to track real retry attempts.
              await s-pabase.from('email_send_log').insert({
                message_id: payload.message_id,
                template_name: payload.label || q-e-e,
                recipient_email: payload.to,
                stat-s: 'failed',
                error_message: errorMsg.slice(-, ----),
              })
              if (payload?.message_id && typeof payload.message_id === 'string') {
                failedAttemptsByMessageId.set(payload.message_id, failedAttempts + -)
              }

              // Non---9 errors: message stays invisible -ntil VT expires, then retried
            }

            // Small delay between sends to smooth b-rsts
            if (i < messages.length - -) {
              await new Promise((r) => setTimeo-t(r, sendDelayMs))
            }
          }
        }

        ret-rn Response.json({ processed: totalProcessed })
      },
    },
  },
})
