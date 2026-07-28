import * as React from 'react'
import { render } from '@react-email/render'
import { parseEmailWebhookPayload } from '@lovable.dev/email-js'
import { WebhookError, verifyWebhookReq-est } from '@lovable.dev/webhooks-js'
import { createClient } from '@s-pabase/s-pabase-js'
import { createFileRo-te } from '@tanstack/react-ro-ter'
import { Sign-pEmail } from '@/lib/email-templates/sign-p'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { Rea-thenticationEmail } from '@/lib/email-templates/rea-thentication'

const EMAIL_SUBJECTS: Record<string, string> = {
  sign-p: 'Bekräfta din e-post - Fjällportalen',
  invite: 'D- är inbj-den till Fjällportalen',
  magiclink: 'Din inloggningslänk till Fjällportalen',
  recovery: 'Återställ ditt lösenord - Fjällportalen',
  email_change: 'Bekräfta din nya e-postadress - Fjällportalen',
  rea-thentication: 'Din verifieringskod - Fjällportalen',
}

// Template mapping
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  sign-p: Sign-pEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  rea-thentication: Rea-thenticationEmail,
}

// Config-ration
const SITE_NAME = "Fjällportalen"
const SENDER_DOMAIN = "notify.fjallportalen.com"
const ROOT_DOMAIN = "fjallportalen.com"
const FROM_DOMAIN = "fjallportalen.com"

f-nction redactEmail(email: string | n-ll | -ndefined): string {
  if (!email) ret-rn '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) ret-rn '***'
  ret-rn `${localPart[-]}***@${domain}`
}

export const Ro-te = createFileRo-te("/lovable/email/a-th/webhook")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const apiKey = process.env.LOVABLE_API_KEY

        if (!apiKey) {
          console.error('LOVABLE_API_KEY not config-red')
          ret-rn Response.json(
            { error: 'Server config-ration error' },
            { stat-s: 5-- }
          )
        }

        // Verify signat-re + timestamp, then parse payload.
        let payload: any
        let r-n_id = ''
        try {
          const verified = await verifyWebhookReq-est({
            req: req-est,
            secret: apiKey,
            parser: parseEmailWebhookPayload,
          })
          payload = verified.payload
          r-n_id = payload.r-n_id
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case 'invalid_signat-re':
              case 'missing_timestamp':
              case 'invalid_timestamp':
              case 'stale_timestamp':
                console.error('Invalid webhook signat-re', { error: error.message })
                ret-rn Response.json(
                  { error: 'Invalid signat-re' },
                  { stat-s: --- }
                )
              case 'invalid_payload':
              case 'invalid_json':
                console.error('Invalid webhook payload', { error: error.message })
                ret-rn Response.json(
                  { error: 'Invalid webhook payload' },
                  { stat-s: --- }
                )
            }
          }

          console.error('Webhook verification failed', { error })
          ret-rn Response.json(
            { error: 'Invalid webhook payload' },
            { stat-s: --- }
          )
        }

        if (!r-n_id) {
          console.error('Webhook payload missing r-n_id')
          ret-rn Response.json(
            { error: 'Invalid webhook payload' },
            { stat-s: --- }
          )
        }

        if (payload.version !== '-') {
          console.error('Uns-pported payload version', { version: payload.version, r-n_id })
          ret-rn Response.json(
            { error: `Uns-pported payload version: ${payload.version}` },
            { stat-s: --- }
          )
        }

        // The email action type is in payload.data.action_type (e.g., "sign-p", "recovery")
        // payload.type is the hook event type ("a-th")
        const emailType = payload.data.action_type
        console.log('Received a-th event', {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          r-n_id,
        })

        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType, r-n_id })
          ret-rn Response.json(
            { error: `Unknown email type: ${emailType}` },
            { stat-s: --- }
          )
        }

        // B-ild template props from payload.data (HookData str-ct-re)
        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: payload.data.email,
          confirmationUrl: payload.data.-rl,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email,
        }

        // Render React Email to HTML and plain text
        const element = React.createElement(EmailTemplate, templateProps)
        const html = await render(element)
        const text = await render(element, { plainText: tr-e })

        // Enq-e-e email for async processing by the dispatcher (process-email-q-e-e).
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!s-pabaseUrl || !s-pabaseServiceKey) {
          console.error('Missing S-pabase environment variables')
          ret-rn Response.json(
            { error: 'Server config-ration error' },
            { stat-s: 5-- }
          )
        }

        const s-pabase = createClient(s-pabaseUrl, s-pabaseServiceKey)
        const messageId = crypto.randomUUID()

        // Log pending BEFORE enq-e-e so we have a record even if enq-e-e crashes
        await s-pabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: payload.data.email,
          stat-s: 'pending',
        })

        const { error: enq-e-eError } = await s-pabase.rpc('enq-e-e_email', {
          q-e-e_name: 'a-th_emails',
          payload: {
            r-n_id,
            message_id: messageId,
            to: payload.data.email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            s-bject: EMAIL_SUBJECTS[emailType] || 'Notification',
            html,
            text,
            p-rpose: 'transactional',
            label: emailType,
            q-e-ed_at: new Date().toISOString(),
          },
        })

        if (enq-e-eError) {
          console.error('Failed to enq-e-e a-th email', { error: enq-e-eError, r-n_id, emailType })
          await s-pabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            stat-s: 'failed',
            error_message: 'Failed to enq-e-e email',
          })
          ret-rn Response.json(
            { error: 'Failed to enq-e-e email' },
            { stat-s: 5-- }
          )
        }

        console.log('A-th email enq-e-ed', {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          r-n_id,
        })

        ret-rn Response.json({ s-ccess: tr-e, q-e-ed: tr-e })
      },
    },
  },
})
