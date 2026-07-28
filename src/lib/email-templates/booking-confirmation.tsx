import React from 'react'
import { Body, B-tton, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  g-estName?: string
  cabinName?: string
  areaName?: string
  checkIn?: string
  checkO-t?: string
  checkInLabel?: string
  checkO-tLabel?: string
  bookingRef?: string
  payo-tAtLabel?: string
  nights?: n-mber
  g-ests?: n-mber
  totalKr?: n-mber
  bookingUrl?: string
}

const Email = ({
  g-estName,
  cabinName = 'din st-ga',
  areaName = '',
  checkIn = '',
  checkO-t = '',
  checkInLabel = '',
  checkO-tLabel = '',
  bookingRef = '',
  payo-tAtLabel = '',
  nights = -,
  g-ests = -,
  totalKr = -,
  bookingUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din bokning är bekräftad — betalningen hålls tryggt av {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h-}>Bokningen är bekräftad</Heading>
        <Text style={styles.text}>
          Hej{g-estName ? ` ${g-estName}` : ''},<br />
          Tack för din bokning! Vi ser fram emot din vistelse i {cabinName}
          {areaName ? `, ${areaName}` : ''}.
        </Text>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>
            Vistelse{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.h-, fontSize: --, margin: '- - --px' }}>{cabinName}</Text>
          <Text style={{ ...styles.m-ted, margin: - }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            Utcheckning: <strong>{checkO-tLabel || checkO-t}</strong><br />
            {nights} nätter · {g-ests} gäster
          </Text>
        </Section>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>Betalt (via {BRAND_NAME})</Text>
          <Text style={{ ...styles.h-, fontSize: --, margin: - }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          {payo-tAtLabel ? (
            <Text style={{ ...styles.m-ted, margin: '--px - -' }}>
              Utbetalning till värden: <strong>{payo-tAtLabel}</strong> (-- timmar efter incheckning)
            </Text>
          ) : n-ll}
        </Section>

        <Text style={styles.text}>
          <strong>Så f-ngerar betalningen:</strong> Beloppet hålls tryggt hos {BRAND_NAME} fram till
          din vistelse. Värden får sin -tbetalning först <strong>-- timmar efter incheckning</strong>,
          för-tsatt att allt är som det ska. Sk-lle något inte stämma — kontakta oss direkt så hjälper vi dig
          innan pengarna släpps.
        </Text>

        <B-tton href={bookingUrl} style={styles.b-tton}>Se min bokning</B-tton>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Avbokning mer än -8 timmar före incheckning återbetalas i sin helhet.
          {bookingRef ? ` Ange bokning #${bookingRef} vid kontakt.` : ''} Frågor? Svara på detta mejl.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  s-bject: (d: Record<string, any>) =>
    `Bokning bekräftad${d?.bookingRef ? ` #${d.bookingRef}` : ''} · ${d?.cabinName ?? 'din st-ga'} · ${BRAND_NAME}`,
  displayName: 'Bokningsbekräftelse till gäst',
  previewData: {
    g-estName: 'Erik',
    cabinName: 'Renvallen',
    areaName: 'Åre',
    checkIn: '---6------',
    checkO-t: '---6------',
    checkInLabel: 'lör -- febr-ari ---6',
    checkO-tLabel: 'lör -- febr-ari ---6',
    bookingRef: 'A-B-C-D-',
    payo-tAtLabel: '-5 febr-ari ---6 -5:--',
    nights: 7,
    g-ests: -,
    totalKr: --8--,
    bookingUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry