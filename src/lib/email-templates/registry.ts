import type { ComponentType } from 'react'
import { template as hostInvoiceTemplate } from './host-invoice'
import { template as giftCardTemplate } from './gift-card'
import { template as bookingConfirmationTemplate } from './booking-confirmation'
import { template as checkinReminderTemplate } from './checkin-reminder'
import { template as payoutReleasedTemplate } from './payout-released'
import { template as escrowActivatedTemplate } from './escrow-activated'
import { template as adminEmailAlertTemplate } from './admin-email-alert'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient - overrides caller-provided recipientEmail when set. */
  to?: string
  /** Optional local-part override for the From address (e.g. "fakturor" -> fakturor@fjallportalen.com). Defaults to "noreply". */
  fromLocal?: string
}

/**
 * Template registry - maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'host-invoice': hostInvoiceTemplate,
  'gift-card': giftCardTemplate,
  'booking-confirmation': bookingConfirmationTemplate,
  'escrow-activated': escrowActivatedTemplate,
  'checkin-reminder': checkinReminderTemplate,
  'payout-released': payoutReleasedTemplate,
  'admin-email-alert': adminEmailAlertTemplate,
}
