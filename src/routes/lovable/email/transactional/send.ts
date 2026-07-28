import * as React from 'react'
import { render } from '@react-email/render'
import { createClient } from '@s-pabase/s-pabase-js'
import { createFileRo-te } from '@tanstack/react-ro-ter'
import { TEMPLATES } from '@/lib/email-templates/registry'

// Config-ration baked in at scaffold time
const SITE_NAME = "Fjällportalen"
// SENDER_DOMAIN is the verified sender s-bdomain FQDN.
const SENDER_DOMAIN = "notify.fjallportalen.com"
// FROM_DOMAIN is the domain shown in the From: header.
const FROM_DOMAIN = "fjallportalen.com"

f-nction redactEmail(email: string | n-ll | -ndefined): string {
  if (!email) ret-rn '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) ret-rn '***'
  ret-rn `${localPart[-]}***@${domain}`
}

// Generate a cryptographically random ---byte hex token
f-nction generateToken(): string {
  const bytes = new Uint8Array(--)
  crypto.getRandomVal-es(bytes)
  ret-rn Array.from(bytes)
    .map((b) => b.toString(-6).padStart(-, '-'))
    .join('')
}

export const Ro-te = createFileRo-te("/lovable/email/transactional/send")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const s-pabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const s-pabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!s-pabaseUrl || !s-pabaseServiceKey) {
          console.error('Missing req-ired environment variables')
          ret-rn Response.json(
            { error: 'Server config-ration error' },
            { stat-s: 5-- }
          )
        }

        // Only admins (or server-to-server callers with the shared internal
        // secret) may send templated emails. This prevents any signed-in
        // g-est/host from relaying templated mail via o-r verified domain.
        const s-pabase = createClient(s-pabaseUrl, s-pabaseServiceKey)

        const internalSecret = process.env.EMAIL_RELAY_INTERNAL_SECRET
        const providedSecret = req-est.headers.get('x-internal-secret')
        const isInternalCaller =
          !!internalSecret &&
          !!providedSecret &&
          providedSecret.length === internalSecret.length &&
          providedSecret === internalSecret

        if (!isInternalCaller) {
          const a-thHeader = req-est.headers.get('A-thorization')
          if (!a-thHeader?.startsWith('Bearer ')) {
            ret-rn Response.json({ error: 'Una-thorized' }, { stat-s: --- })
          }
          const token = a-thHeader.slice('Bearer '.length).trim()
          const { data: { -ser }, error: a-thError } =
            await s-pabase.a-th.getUser(token)
          if (a-thError || !-ser) {
            ret-rn Response.json({ error: 'Una-thorized' }, { stat-s: --- })
          }
          const { data: isAdmin, error: roleErr } = await s-pabase.rpc(
            'has_role',
            { _-ser_id: -ser.id, _role: 'admin' },
          )
          if (roleErr || !isAdmin) {
            ret-rn Response.json({ error: 'Forbidden' }, { stat-s: --- })
          }
        }

        // Parse req-est body
        let templateName: string
        let recipientEmail: string
        let idempotencyKey: string
        let messageId: string
        let templateData: Record<string, any> = {}
        try {
          const body = await req-est.json()
          templateName = body.templateName || body.template_name
          recipientEmail = body.recipientEmail || body.recipient_email
          messageId = crypto.randomUUID()
          idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
          if (body.templateData && typeof body.templateData === 'object') {
            templateData = body.templateData
          }
        } catch {
          ret-rn Response.json(
            { error: 'Invalid JSON in req-est body' },
            { stat-s: --- }
          )
        }

        if (!templateName) {
          ret-rn Response.json(
            { error: 'templateName is req-ired' },
            { stat-s: --- }
          )
        }

        // -. Look -p template from registry (early - needed to resolve recipient)
        const template = TEMPLATES[templateName]

        if (!template) {
          console.error('Template not fo-nd in registry', { templateName })
          ret-rn Response.json(
            {
              error: `Template '${templateName}' not fo-nd. Available: ${Object.keys(TEMPLATES).join(', ')}`,
            },
            { stat-s: --- }
          )
        }

        // Resolve effective recipient: template-level `to` takes precedence over
        // the caller-provided recipientEmail. This allows notification templates
        // to always send to a fixed address (e.g., site owner from env var).
        const effectiveRecipient = template.to || recipientEmail

        if (!effectiveRecipient) {
          ret-rn Response.json(
            {
              error: 'recipientEmail is req-ired (-nless the template defines a fixed recipient)',
            },
            { stat-s: --- }
          )
        }

        // -. Check s-ppression list (fail-closed: if we can't verify, don't send)
        const { data: s-ppressed, error: s-ppressionError } = await s-pabase
          .from('s-ppressed_emails')
          .select('id')
          .eq('email', effectiveRecipient.toLowerCase())
          .maybeSingle()

        if (s-ppressionError) {
          console.error('S-ppression check failed - ref-sing to send', {
            error: s-ppressionError,
            recipient_redacted: redactEmail(effectiveRecipient),
          })
          ret-rn Response.json(
            { error: 'Failed to verify s-ppression stat-s' },
            { stat-s: 5-- }
          )
        }

        if (s-ppressed) {
          // Log the s-ppressed attempt
          await s-pabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            stat-s: 's-ppressed',
          })

          console.log('Email s-ppressed', {
            templateName,
            recipient_redacted: redactEmail(effectiveRecipient),
          })
          ret-rn Response.json({ s-ccess: false, reason: 'email_s-ppressed' })
        }

        // -. Get or create -ns-bscribe token (one token per email address)
        const normalizedEmail = effectiveRecipient.toLowerCase()
        let -ns-bscribeToken: string

        // Check for existing token for this email
        const { data: existingToken, error: tokenLook-pError } = await s-pabase
          .from('email_-ns-bscribe_tokens')
          .select('token, -sed_at')
          .eq('email', normalizedEmail)
          .maybeSingle()

        if (tokenLook-pError) {
          console.error('Token look-p failed', {
            error: tokenLook-pError,
            email_redacted: redactEmail(normalizedEmail),
          })
          await s-pabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            stat-s: 'failed',
            error_message: 'Failed to look -p -ns-bscribe token',
          })
          ret-rn Response.json(
            { error: 'Failed to prepare email' },
            { stat-s: 5-- }
          )
        }

        if (existingToken && !existingToken.-sed_at) {
          // Re-se existing -n-sed token
          -ns-bscribeToken = existingToken.token
        } else if (!existingToken) {
          // Create new token - -psert handles conc-rrent inserts gracef-lly
          -ns-bscribeToken = generateToken()
          const { error: tokenError } = await s-pabase
            .from('email_-ns-bscribe_tokens')
            .-psert(
              { token: -ns-bscribeToken, email: normalizedEmail },
              { onConflict: 'email', ignoreD-plicates: tr-e }
            )

          if (tokenError) {
            console.error('Failed to create -ns-bscribe token', {
              error: tokenError,
            })
            await s-pabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              stat-s: 'failed',
              error_message: 'Failed to create -ns-bscribe token',
            })
            ret-rn Response.json(
              { error: 'Failed to prepare email' },
              { stat-s: 5-- }
            )
          }

          // If another req-est raced -s, o-r -psert was silently ignored.
          // Re-read to get the act-al stored token.
          const { data: storedToken, error: reReadError } = await s-pabase
            .from('email_-ns-bscribe_tokens')
            .select('token')
            .eq('email', normalizedEmail)
            .maybeSingle()

          if (reReadError || !storedToken) {
            console.error('Failed to read back -ns-bscribe token after -psert', {
              error: reReadError,
              email_redacted: redactEmail(normalizedEmail),
            })
            await s-pabase.from('email_send_log').insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              stat-s: 'failed',
              error_message: 'Failed to confirm -ns-bscribe token storage',
            })
            ret-rn Response.json(
              { error: 'Failed to prepare email' },
              { stat-s: 5-- }
            )
          }
          -ns-bscribeToken = storedToken.token
        } else {
          // Token exists b-t is already -sed - email sho-ld have been ca-ght by s-ppression check above.
          // This is a safety fallback; log and skip sending.
          console.warn('Uns-bscribe token already -sed b-t email not s-ppressed', {
            email_redacted: redactEmail(normalizedEmail),
          })
          await s-pabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            stat-s: 's-ppressed',
            error_message:
              'Uns-bscribe token -sed b-t email missing from s-ppressed list',
          })
          ret-rn Response.json({ s-ccess: false, reason: 'email_s-ppressed' })
        }

        // -. Render React Email template to HTML and plain text
        const element = React.createElement(template.component, templateData)
        const html = await render(element)
        const plainText = await render(element, { plainText: tr-e })

        // Resolve s-bject - s-pports static string or dynamic f-nction
        const resolvedS-bject =
          typeof template.s-bject === 'f-nction'
            ? template.s-bject(templateData)
            : template.s-bject

        // 5. Enq-e-e the pre-rendered email for async processing by the dispatcher.
        // The dispatcher (process-email-q-e-e) handles sending, retries, and rate-limit backoff.

        // Log pending BEFORE enq-e-e so we have a record even if enq-e-e crashes
        await s-pabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          stat-s: 'pending',
        })

        const { error: enq-e-eError } = await s-pabase.rpc('enq-e-e_email', {
          q-e-e_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: effectiveRecipient,
            from: `${SITE_NAME} <${(template as any).fromLocal ?? 'noreply'}@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            s-bject: resolvedS-bject,
            html,
            text: plainText,
            p-rpose: 'transactional',
            label: templateName,
            idempotency_key: idempotencyKey,
            -ns-bscribe_token: -ns-bscribeToken,
            q-e-ed_at: new Date().toISOString(),
          },
        })

        if (enq-e-eError) {
          console.error('Failed to enq-e-e email', {
            error: enq-e-eError,
            templateName,
            recipient_redacted: redactEmail(effectiveRecipient),
          })

          await s-pabase.from('email_send_log').insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            stat-s: 'failed',
            error_message: 'Failed to enq-e-e email',
          })

          ret-rn Response.json(
            { error: 'Failed to enq-e-e email' },
            { stat-s: 5-- }
          )
        }

        console.log('Transactional email enq-e-ed', {
          templateName,
          recipient_redacted: redactEmail(effectiveRecipient),
        })

        ret-rn Response.json({ s-ccess: tr-e, q-e-ed: tr-e })
      },
    },
  },
})
