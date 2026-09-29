// Server-only core for sending templated app email through Lovable's
// managed email API. Keeps the { status, body } shape used by
// send-internal.ts and records outcomes in email_send_log.
import { createClient } from '@supabase/supabase-js'
import { EmailAPIError } from '@lovable.dev/email-js'
import { TEMPLATES } from '@/lib/email-templates/registry'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

export interface SendCoreArgs {
  templateName: string
  recipientEmail?: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

export interface SendCoreResult {
  status: number
  body: Record<string, unknown>
}

function logClient() {
  const url = process.env['SUPABASE_URL'] || import.meta.env.VITE_SUPABASE_URL
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function writeLog(row: {
  template_name: string
  recipient_email: string
  status: 'sent' | 'suppressed' | 'failed'
  error_message?: string
}) {
  const supabase = logClient()
  if (!supabase) return
  const { error } = await supabase
    .from('email_send_log')
    .insert({ message_id: null, ...row })
  if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
}

export async function sendTemplatedEmailCore(args: SendCoreArgs): Promise<SendCoreResult> {
  const { templateName } = args
  if (!templateName) return { status: 400, body: { error: 'templateName is required' } }
  const template = TEMPLATES[templateName]
  if (!template) {
    return { status: 404, body: { error: `Template '${templateName}' not found` } }
  }
  const recipient = template.to || args.recipientEmail || ''
  if (!recipient) return { status: 400, body: { error: 'recipientEmail is required' } }

  try {
    const res = await sendTemplateEmail(templateName, recipient, {
      templateData: args.templateData ?? {},
      idempotencyKey: args.idempotencyKey,
    })
    if (!res.sent) {
      await writeLog({ template_name: templateName, recipient_email: recipient, status: 'suppressed' })
      return { status: 200, body: { success: false, reason: 'email_suppressed' } }
    }
    await writeLog({ template_name: templateName, recipient_email: recipient, status: 'sent' })
    return { status: 200, body: { success: true } }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await writeLog({
      template_name: templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    const status = err instanceof EmailAPIError && err.status ? err.status : 500
    return {
      status,
      body: { error: message, code: err instanceof EmailAPIError ? err.code : undefined },
    }
  }
}
