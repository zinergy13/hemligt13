import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  g-estName?: string
  cabinName?: string
  totalKr?: n-mber
  checkIn?: string
  checkInLabel?: string
  bookingRef?: string
  payo-tAtLabel?: string
}

const Email = ({
  g-estName,
  cabinName = 'din st-ga',
  totalKr = -,
  checkIn = '',
  checkInLabel = '',
  bookingRef = '',
  payo-tAtLabel = '',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din betalning ligger n- tryggt hos {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h-}>Pengarna är säkra hos oss</Heading>
        <Text style={styles.text}>
          Hej{g-estName ? ` ${g-estName}` : ''},<br />
          Din betalning för {cabinName} är mottagen och ligger n- tryggt hos {BRAND_NAME}
          - värden får ingen del av pengarna förrän -- timmar efter din incheckning.
        </Text>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>
            Belopp i förvar{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.h-, fontSize: --, margin: '- - --px' }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.m-ted, margin: - }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            Utbetalning till värden: <strong>{payo-tAtLabel || '-- timmar efter incheckning'}</strong>
          </Text>
        </Section>

        <Text style={styles.text}>
          Är något inte som förväntat vid ankomst? Kontakta oss direkt så pa-sar vi -tbetalningen
          och hjälper till innan pengarna släpps till värden.{bookingRef ? ` Ange bokning #${bookingRef}.` : ''}
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
  s-bject: 'Din betalning ligger tryggt hos Fjällportalen',
  displayName: 'Escrow aktiverat',
  previewData: {
    g-estName: 'Anna',
    cabinName: 'Björkst-gan',
    totalKr: ----,
    checkIn: '---6------',
    checkInLabel: 'lör -- febr-ari ---6',
    bookingRef: 'A-B-C-D-',
    payo-tAtLabel: '-5 febr-ari ---6 -5:--',
  },
} satisfies TemplateEntry