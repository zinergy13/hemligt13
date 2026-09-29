import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
const LOG: Record<Reason, { status: 'bounced' | 'complained' | 'suppressed'; message: string }> = {
  bounce: { status: 'bounced', message: 'Permanent bounce - email address is invalid or rejected' },
  complaint: { status: 'complained', message: 'Spam complaint - recipient marked email as spam' },
  unsubscribe: { status: 'suppressed', message: 'Recipient unsubscribed' },
}

// Notification-only record keeping in the app's existing tables.
async function record(event: { event_id: string; data: { recipient: string } }, reason: Reason) {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) throw new Error('Server configuration error')
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const email = event.data.recipient.toLowerCase()
  const { error: supErr } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (supErr) {
    console.error('suppressed_emails upsert failed', { code: supErr.code, message: supErr.message, event_id: event.event_id })
    throw new Error('suppressed_emails upsert failed')
  }
  const { error: logErr } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: email,
    status: LOG[reason].status,
    error_message: LOG[reason].message,
    metadata: null,
  })
  if (logErr) {
    console.error('email_send_log insert failed', { code: logErr.code, message: logErr.message, event_id: event.event_id })
    throw new Error('email_send_log insert failed')
  }
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            'email.bounced': async (event) => {
              await record(event, 'bounce')
            },
            'email.complaint': async (event) => {
              await record(event, 'complaint')
            },
            'email.unsubscribed': async (event) => {
              await record(event, 'unsubscribe')
            },
          },
        })
        return handler(request)
      },
    },
  },
})
