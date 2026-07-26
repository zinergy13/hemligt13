import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles } from './_brand'

interface Props {
  hostName?: string
  invoiceNumber?: string
  periodLabel?: string
  amountKr?: number
  dueDate?: string
  ocrReference?: string
  downloadUrl?: string
}

const Email = ({
  hostName,
  invoiceNumber = 'F-000000-0000',
  periodLabel = 'senaste månaden',
  amountKr = 0,
  dueDate = '',
  ocrReference = '',
  downloadUrl = '#',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din månadsfaktura från {BRAND_NAME} är klar</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Månadsfaktura {invoiceNumber}</Heading>
        <Text style={styles.text}>
          Hej{hostName ? ` ${hostName}` : ''},<br />
          Din faktura för {periodLabel} är nu tillgänglig.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid #EADFCE`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Att betala (inkl. moms)</Text>
          <Text style={{ ...styles.h1, fontSize: 24, margin: '0 0 12px' }}>{amountKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Förfaller: <strong>{dueDate}</strong><br />
            OCR-referens: <strong>{ocrReference}</strong>
          </Text>
        </Section>

        <Button href={downloadUrl} style={styles.button}>Ladda ner PDF</Button>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Frågor om fakturan? Svara på detta mejl så hjälper vi dig.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Månadsfaktura ${d?.invoiceNumber ?? ''} från ${BRAND_NAME}`,
  displayName: 'Månadsfaktura till värd',
  fromLocal: 'fakturor',
  previewData: {
    hostName: 'Anna',
    invoiceNumber: 'F-202601-0001',
    periodLabel: 'december 2025',
    amountKr: 2400,
    dueDate: '2026-01-15',
    ocrReference: '2601000001',
    downloadUrl: 'https://fjallportalen.com/api/invoice/example/pdf',
  },
} satisfies TemplateEntry