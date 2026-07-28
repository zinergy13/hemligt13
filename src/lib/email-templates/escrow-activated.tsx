import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  guestName?: string
  cabinName?: string
  totalKr?: number
  checkIn?: string
}

const Email = ({
  guestName,
  cabinName = 'din stuga',
  totalKr = 0,
  checkIn = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din betalning ligger nu tryggt hos {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Pengarna är säkra hos oss</Heading>
        <Text style={styles.text}>
          Hej{guestName ? ` ${guestName}` : ''},<br />
          Din betalning för {cabinName} är mottagen och ligger nu tryggt hos {BRAND_NAME}
          — värden får ingen del av pengarna förrän 24 timmar efter din incheckning.
        </Text>

        <Section style={{ backgroundColor: '#ffffff', border: `1px solid ${brand.border}`, borderRadius: 10, padding: '16px 20px', margin: '0 0 20px' }}>
          <Text style={{ ...styles.muted, margin: '0 0 6px' }}>Belopp i förvar</Text>
          <Text style={{ ...styles.h1, fontSize: 22, margin: '0 0 10px' }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.muted, margin: 0 }}>
            Incheckning: <strong>{checkIn}</strong><br />
            Utbetalning till värden: 24 timmar efter incheckning
          </Text>
        </Section>

        <Text style={styles.text}>
          Är något inte som förväntat vid ankomst? Kontakta oss direkt så pausar vi utbetalningen
          och hjälper till innan pengarna släpps till värden.
        </Text>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Detta är ditt kvitto på att betalningen tagits emot och förvaras säkert.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Din betalning ligger tryggt hos Fjällportalen',
  displayName: 'Escrow aktiverat',
  previewData: {
    guestName: 'Anna',
    cabinName: 'Björkstugan',
    totalKr: 4200,
    checkIn: '2026-02-14',
  },
} satisfies TemplateEntry