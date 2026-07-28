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
  hostName?: string
  messageUrl?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  areaName = '',
  checkIn = '',
  checkOut = '',
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
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Din vistelse</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkIn}</strong><br />
            Utcheckning: <strong>{checkOut}</strong>
          </Text>
        </Section>

        <Text style={styles.text}>
          <strong>Så fungerar betalningen fram till incheckning:</strong> Ditt betalda belopp ligger
          fortfarande tryggt hos {BRAND_NAME}. Först <strong>24 timmar efter din incheckning</strong> släpps
          pengarna till {hostName}. Om något inte stämmer vid ankomst — hör av dig till oss direkt så
          hjälper vi dig innan utbetalningen sker.
        </Text>

        <Button href={messageUrl} style={styles.button}>Kontakta värden</Button>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Trevlig resa! Frågor eller problem vid incheckning? Svara på detta mejl så är vi här.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Incheckning ${d?.checkIn ?? 'snart'} · ${d?.cabinName ?? 'din stuga'} · ${BRAND_NAME}`,
  displayName: 'Incheckningspåminnelse till gäst',
  previewData: {
    guestName: 'Erik',
    cabinName: 'Renvallen',
    areaName: 'Åre',
    checkIn: '2026-02-14',
    checkOut: '2026-02-21',
    hostName: 'Anna',
    messageUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry