import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  guestName?: string
  cabinName?: string
  totalKr?: number
  checkIn?: string
  checkInLabel?: string
  bookingRef?: string
  payoutAtLabel?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  totalKr = 0,
  checkIn = '',
  checkInLabel = '',
  bookingRef = '',
  payoutAtLabel = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din betalning är mottagen via {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Din betalning är mottagen</Heading>
        <Text style={styles.text}>
          Hej{guestName ? ` ${guestName}` : ''},<br />
          Din betalning för {cabinName} är mottagen och hanteras av vår betalpartner Stripe
          - värden får ingen utbetalning förrän efter din incheckning.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>
            Betalt belopp{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.h1, fontSize: 22, margin: '0 0 10px' }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            Utbetalning till värden: <strong>{payoutAtLabel ? `tidigast ${payoutAtLabel}` : 'schemaläggs efter incheckning'}</strong>
          </Text>
        </Section>

        <Text style={styles.text}>
          Är något inte som förväntat vid ankomst? Kontakta oss direkt så pausar vi utbetalningen
          och hjälper till innan värden får betalt.{bookingRef ? ` Ange bokning #${bookingRef}.` : ''}
        </Text>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Detta är ditt kvitto på att betalningen tagits emot.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Din betalning är mottagen - Fjällportalen',
  displayName: 'Betalning mottagen',
  previewData: {
    guestName: 'Anna',
    cabinName: 'Björkstugan',
    totalKr: 4200,
    checkIn: '2026-02-14',
    checkInLabel: 'lör 14 februari 2026',
    bookingRef: 'A1B2C3D4',
    payoutAtLabel: '15 februari 2026 15:00',
  },
} satisfies TemplateEntry