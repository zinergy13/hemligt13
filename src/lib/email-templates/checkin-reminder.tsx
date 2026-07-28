import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  guestName?: string
  cabinName?: string
  areaName?: string
  checkIn?: string
  checkOut?: string
  checkInLabel?: string
  checkOutLabel?: string
  bookingRef?: string
  payoutAtLabel?: string
  hostName?: string
  messageUrl?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  areaName = '',
  checkIn = '',
  checkOut = '',
  checkInLabel = '',
  checkOutLabel = '',
  bookingRef = '',
  payoutAtLabel = '',
  hostName = 'värden',
  messageUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din vistelse i {cabinName} närmar sig — dags för incheckning</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Dags att packa</Heading>
        <Text style={styles.text}>
          Hej{guestName ? ` ${guestName}` : ''},<br />
          Din vistelse i {cabinName}{areaName ? `, ${areaName}` : ''} börjar snart. Vi hoppas du får några
          fantastiska dagar i fjällen.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>
            Din vistelse{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            Utcheckning: <strong>{checkOutLabel || checkOut}</strong>
            {payoutAtLabel ? (
              <>
                <br />Utbetalning till {hostName}: <strong>{payoutAtLabel}</strong>
              </>
            ) : null}
          </Text>
        </Section>

        <Text style={styles.text}>
          <strong>Så fungerar betalningen fram till incheckning:</strong> Ditt betalda belopp ligger
          fortfarande tryggt hos {BRAND_NAME}. Först <strong>24 timmar efter din incheckning
          {payoutAtLabel ? ` (${payoutAtLabel})` : ''}</strong> släpps pengarna till {hostName}. Om
          något inte stämmer vid ankomst — hör av dig till oss direkt så hjälper vi dig innan
          utbetalningen sker.
        </Text>

        <Button href={messageUrl} style={styles.button}>Kontakta värden</Button>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Trevlig resa! Frågor eller problem vid incheckning? Svara på detta mejl
          {bookingRef ? ` och ange bokning #${bookingRef}` : ''} så är vi här.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Incheckning ${d?.checkInLabel ?? d?.checkIn ?? 'snart'} · ${d?.cabinName ?? 'din stuga'} · ${BRAND_NAME}`,
  displayName: 'Incheckningspåminnelse till gäst',
  previewData: {
    guestName: 'Erik',
    cabinName: 'Renvallen',
    areaName: 'Åre',
    checkIn: '2026-02-14',
    checkOut: '2026-02-21',
    checkInLabel: 'lör 14 februari 2026',
    checkOutLabel: 'lör 21 februari 2026',
    bookingRef: 'A1B2C3D4',
    payoutAtLabel: '15 februari 2026 15:00',
    hostName: 'Anna',
    messageUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry