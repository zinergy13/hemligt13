import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  templateName?: string
  recipientEmail?: string
  bookingId?: string
  attempts?: number
  lastError?: string
  lastStatusCode?: number
  attemptId?: string
  lastAttemptAt?: string
}

const Email = ({
  templateName = '(okänd)',
  recipientEmail = '(okänd)',
  bookingId = '',
  attempts = 5,
  lastError = '(ingen feltext)',
  lastStatusCode = 0,
  attemptId = '',
  lastAttemptAt = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
      <Preview>{`E-postutskick misslyckades efter ${attempts} försök`}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME} · Systemvarning</Text>
        <Heading style={styles.h1}>E-postutskick misslyckades</Heading>
        <Text style={styles.text}>
          Ett e-postutskick har markerats som <strong>failed</strong> efter {attempts} försök
          och kommer inte att skickas om automatiskt.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Mall</Text>
          <Text style={{ ...styles.text, margin: '0 0 12px' }}><strong>{templateName}</strong></Text>

          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Mottagare</Text>
          <Text style={{ ...styles.text, margin: '0 0 12px' }}>{recipientEmail}</Text>

          {bookingId ? (
            <>
              <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Booking-ID</Text>
              <Text style={{ ...styles.text, margin: '0 0 12px', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>{bookingId}</Text>
            </>
          ) : null}

          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>HTTP-status</Text>
          <Text style={{ ...styles.text, margin: '0 0 12px' }}>{lastStatusCode || '—'}</Text>

          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Senaste fel</Text>
          <Text style={{ ...styles.text, margin: '0 0 12px', fontFamily: 'ui-monospace, monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {lastError}
          </Text>

          {lastAttemptAt ? (
            <>
              <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Senaste försök</Text>
              <Text style={{ ...styles.text, margin: '0 0 12px' }}>{lastAttemptAt}</Text>
            </>
          ) : null}

          {attemptId ? (
            <>
              <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Attempt-ID</Text>
              <Text style={{ ...styles.text, margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{attemptId}</Text>
            </>
          ) : null}
        </Section>

        <Text style={styles.muted}>
          Öppna Admin → E-poststatus för att undersöka och köra manuellt återförsök.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[Fjällportalen] E-post failed: ${data?.templateName ?? 'okänd mall'} → ${data?.recipientEmail ?? 'okänd mottagare'}`,
  displayName: 'Admin — E-postvarning',
  fromLocal: 'noreply',
  previewData: {
    templateName: 'booking-confirmation',
    recipientEmail: 'guest@example.com',
    bookingId: '11111111-2222-3333-4444-555555555555',
    attempts: 5,
    lastStatusCode: 502,
    lastError: 'Upstream provider returned 502 Bad Gateway',
    lastAttemptAt: '2026-07-28 23:59 UTC',
    attemptId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  },
} satisfies TemplateEntry