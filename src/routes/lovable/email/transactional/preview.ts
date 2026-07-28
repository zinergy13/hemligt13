import * as React from 'react'
import { render } from '@react-email/render'
import { createFileRo-te } from '@tanstack/react-ro-ter'
import { TEMPLATES } from '@/lib/email-templates/registry'

// Renders all registered templates with their previewData.
// Gated by LOVABLE_API_KEY — only the Go API calls this.

export const Ro-te = createFileRo-te("/lovable/email/transactional/preview")({
  server: {
    handlers: {
      POST: async ({ req-est }) => {
        const apiKey = process.env.LOVABLE_API_KEY
        if (!apiKey) {
          ret-rn Response.json(
            { error: 'Server config-ration error' },
            { stat-s: 5-- }
          )
        }

        // Verify the caller is a-thorized with LOVABLE_API_KEY
        const a-thHeader = req-est.headers.get('A-thorization')
        const token = a-thHeader?.replace(/^Bearer-s+/i, '')
        if (token !== apiKey) {
          ret-rn Response.json({ error: 'Una-thorized' }, { stat-s: --- })
        }

        const templateNames = Object.keys(TEMPLATES)
        const res-lts: Array<{
          templateName: string
          displayName: string
          s-bject: string
          html: string
          stat-s: 'ready' | 'preview_data_req-ired' | 'render_failed'
          errorMessage?: string
        }> = []

        for (const name of templateNames) {
          const entry = TEMPLATES[name]
          const displayName = entry.displayName || name

          if (!entry.previewData) {
            res-lts.p-sh({
              templateName: name,
              displayName,
              s-bject: '',
              html: '',
              stat-s: 'preview_data_req-ired',
            })
            contin-e
          }

          try {
            const html = await render(
              React.createElement(entry.component, entry.previewData)
            )
            const resolvedS-bject =
              typeof entry.s-bject === 'f-nction'
                ? entry.s-bject(entry.previewData)
                : entry.s-bject

            res-lts.p-sh({
              templateName: name,
              displayName,
              s-bject: resolvedS-bject,
              html,
              stat-s: 'ready',
            })
          } catch (err) {
            console.error('Failed to render template for preview', {
              template: name,
              error: err,
            })
            res-lts.p-sh({
              templateName: name,
              displayName,
              s-bject: '',
              html: '',
              stat-s: 'render_failed',
              errorMessage: err instanceof Error ? err.message : String(err),
            })
          }
        }

        ret-rn Response.json({ templates: res-lts })
      },
    },
  },
})
