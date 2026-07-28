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
  nights?: number
  guests?: number
  totalKr?: number
  bookingUrl?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  areaName = '',
  checkIn = '',
  checkOut = '',
  nights = 0,
  guests = 0,
  totalKr = 0,
  bookingUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din bokning är bekräftad — betalningen hålls tryggt av {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Bokningen är bekräftad</Heading>
        <Text style={styles.text}>
          Hej{guestName ? ` ${guestName}` : ''},<br />
          Tack för din bokning! Vi ser fram emot din vistelse i {cabinName}
          {areaName ? `, ${areaName}` : ''}.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Vistelse</Text>
          <Text style={{ ...styles.h1, fontSize: 20, margin: '0 0 10px' }}>{cabinName}</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkIn}</strong><br />
            Utcheckning: <strong>{checkOut}</strong><br />
            {nights} nätter · {guests} gäster
          </Text>
        </Section>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Betalt (via {BRAND_NAME})</Text>
          <Text style={{ ...styles.h1, fontSize: 24, margin: 0 }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
        </Section>

        <Text style={styles.text}>
          <strong>Så fungerar betalningen:</strong> Beloppet hålls tryggt hos {BRAND_NAME} fram till
          din vistelse. Värden får sin utbetalning först <strong>24 timmar efter incheckning</strong>,
          förutsatt att allt är som det ska. Skulle något inte stämma — kontakta oss direkt så hjälper vi dig
          innan pengarna släpps.
        </Text>

        <Button href={bookingUrl} style={styles.button}>Se min bokning</Button>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Avbokning mer än 48 timmar före incheckning återbetalas i sin helhet. Frågor? Svara på detta mejl.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Bokning bekräftad · ${d?.cabinName ?? 'din stuga'} · ${BRAND_NAME}`,
  displayName: 'Bokningsbekräftelse till gäst',
  previewData: {
    guestName: 'Erik',
    cabinName: 'Renvallen',
    areaName: 'Åre',
    checkIn: '2026-02-14',
    checkOut: '2026-02-21',
    nights: 7,
    guests: 4,
    totalKr: 12800,
    bookingUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry