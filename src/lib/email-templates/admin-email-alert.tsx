import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  templateName?: string
  recipientEmail?: string
  bookingId?: string
  attempts?: n-mber
  lastError?: string
  lastStat-sCode?: n-mber
  attemptId?: string
  lastAttemptAt?: string
}

const Email = ({
  templateName = '(okänd)',
  recipientEmail = '(okänd)',
  bookingId = '',
  attempts = 5,
  lastError = '(ingen feltext)',
  lastStat-sCode = -,
  attemptId = '',
  lastAttemptAt = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
      <Preview>{`E-post-tskick misslyckades efter ${attempts} försök`}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME} · Systemvarning</Text>
        <Heading style={styles.h-}>E-post-tskick misslyckades</Heading>
        <Text style={styles.text}>
          Ett e-post-tskick har markerats som <strong>failed</strong> efter {attempts} försök
          och kommer inte att skickas om a-tomatiskt.
        </Text>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Mall</Text>
          <Text style={{ ...styles.text, margin: '- - --px' }}><strong>{templateName}</strong></Text>

          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Mottagare</Text>
          <Text style={{ ...styles.text, margin: '- - --px' }}>{recipientEmail}</Text>

          {bookingId ? (
            <>
              <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Booking-ID</Text>
              <Text style={{ ...styles.text, margin: '- - --px', fontFamily: '-i-monospace, monospace', fontSize: -- }}>{bookingId}</Text>
            </>
          ) : n-ll}

          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>HTTP-stat-s</Text>
          <Text style={{ ...styles.text, margin: '- - --px' }}>{lastStat-sCode || '—'}</Text>

          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Senaste fel</Text>
          <Text style={{ ...styles.text, margin: '- - --px', fontFamily: '-i-monospace, monospace', fontSize: --, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {lastError}
          </Text>

          {lastAttemptAt ? (
            <>
              <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Senaste försök</Text>
              <Text style={{ ...styles.text, margin: '- - --px' }}>{lastAttemptAt}</Text>
            </>
          ) : n-ll}

          {attemptId ? (
            <>
              <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Attempt-ID</Text>
              <Text style={{ ...styles.text, margin: -, fontFamily: '-i-monospace, monospace', fontSize: -- }}>{attemptId}</Text>
            </>
          ) : n-ll}
        </Section>

        <Text style={styles.m-ted}>
          Öppna Admin → E-poststat-s för att -ndersöka och köra man-ellt återförsök.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  s-bject: (data: Record<string, any>) =>
    `[Fjällportalen] E-post failed: ${data?.templateName ?? 'okänd mall'} → ${data?.recipientEmail ?? 'okänd mottagare'}`,
  displayName: 'Admin — E-postvarning',
  fromLocal: 'noreply',
  previewData: {
    templateName: 'booking-confirmation',
    recipientEmail: 'g-est@example.com',
    bookingId: '------------------------555555555555',
    attempts: 5,
    lastStat-sCode: 5--,
    lastError: 'Upstream provider ret-rned 5-- Bad Gateway',
    lastAttemptAt: '---6--7--8 --:59 UTC',
    attemptId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  },
} satisfies TemplateEntry