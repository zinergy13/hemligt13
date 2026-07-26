import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  recipientName?: string
  senderName?: string
  code?: string
  amountKr?: number
  expiresAt?: string
  message?: string
}

const Email = ({
  recipientName,
  senderName,
  code = 'XXXX-XXXX-XXXX',
  amountKr = 0,
  expiresAt = '',
  message = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Du har fått ett presentkort från {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Ett presentkort till dig{recipientName ? `, ${recipientName}` : ''} 🎁</Heading>
        <Text style={styles.text}>
          {senderName ? `${senderName} har skickat` : 'Du har fått'} ett presentkort som du kan använda vid bokning av stuga på {BRAND_NAME}.
        </Text>

        {message ? (
          <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '14px 18px', margin: '0 0 20px' }}>
            <Text style={{ ...styles.muted, margin: '0 0 4px' }}>Hälsning</Text>
            <Text style={{ ...styles.text, margin: 0, fontStyle: 'italic' }}>"{message}"</Text>
          </Section>
        ) : null}

        <Section style={{ textAlign: 'center', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 8px' }}>Värde</Text>
          <Text style={{ ...styles.h1, fontSize: 30, margin: '0 0 16px' }}>{amountKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Din kod</Text>
          <div style={styles.code as any}>{code}</div>
        </Section>

        <Text style={styles.muted}>
          {expiresAt ? <>Giltigt till: <strong>{expiresAt}</strong><br /></> : null}
          Använd koden i kassan när du bokar en stuga på fjallportalen.com.
        </Text>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Frågor? Svara på detta mejl så hjälper vi dig.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Du har fått ett presentkort${d?.amountKr ? ` på ${Number(d.amountKr).toLocaleString('sv-SE')} kr` : ''} från ${BRAND_NAME}`,
  displayName: 'Presentkort till mottagare',
  previewData: {
    recipientName: 'Elin',
    senderName: 'Anna',
    code: 'A1B2-C3D4-E5F6',
    amountKr: 1500,
    expiresAt: '2027-01-15',
    message: 'Grattis på födelsedagen! Njut av fjällen.',
  },
} satisfies TemplateEntry