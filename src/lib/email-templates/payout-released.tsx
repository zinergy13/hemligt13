import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  guestName?: string
  cabinName?: string
  hostName?: string
  checkIn?: string
  totalKr?: number
  reviewUrl?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  hostName = 'värden',
  checkIn = '',
  totalKr = 0,
  reviewUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Betalningen till {hostName} är nu släppt — tack för att du bokade via {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Vi hoppas du hade en fin vistelse</Heading>
        <Text style={styles.text}>
          Hej{guestName ? ` ${guestName}` : ''},<br />
          Det har nu gått <strong>24 timmar sedan din incheckning</strong> i {cabinName}, och därmed har
          {BRAND_NAME} släppt betalningen till {hostName}. Din bokning är därmed helt slutförd.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Utbetalt till värden</Text>
          <Text style={{ ...styles.h1, fontSize: 22, margin: '0 0 10px' }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkIn}</strong><br />
            Betalning hanterad av {BRAND_NAME}
          </Text>
        </Section>

        <Text style={styles.text}>
          Vill du dela din upplevelse? Ditt omdöme hjälper andra att hitta rätt stuga och stärker värden.
        </Text>

        <Button href={reviewUrl} style={styles.button}>Lämna omdöme</Button>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om något inte stod rätt till under vistelsen — svara på detta mejl inom 48 timmar så tittar vi på det.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Bokningen är slutförd · ${d?.cabinName ?? 'din stuga'} · ${BRAND_NAME}`,
  displayName: 'Utbetalning släppt till gäst',
  previewData: {
    guestName: 'Erik',
    cabinName: 'Renvallen',
    hostName: 'Anna',
    checkIn: '2026-02-14',
    totalKr: 12800,
    reviewUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry