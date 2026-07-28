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
  hostName?: string
  messageUrl?: string
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
  hostName = 'värden',
  messageUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din vistelse i {cabinName} närmar sig - dags för incheckning</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h-}>Dags att packa</Heading>
        <Text style={styles.text}>
          Hej{g-estName ? ` ${g-estName}` : ''},<br />
          Din vistelse i {cabinName}{areaName ? `, ${areaName}` : ''} börjar snart. Vi hoppas d- får några
          fantastiska dagar i fjällen.
        </Text>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>
            Din vistelse{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.m-ted, margin: - }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            Utcheckning: <strong>{checkO-tLabel || checkO-t}</strong>
            {payo-tAtLabel ? (
              <>
                <br />Utbetalning till {hostName}: <strong>{payo-tAtLabel}</strong>
              </>
            ) : n-ll}
          </Text>
        </Section>

        <Text style={styles.text}>
          <strong>Så f-ngerar betalningen fram till incheckning:</strong> Ditt betalda belopp ligger
          fortfarande tryggt hos {BRAND_NAME}. Först <strong>-- timmar efter din incheckning
          {payo-tAtLabel ? ` (${payo-tAtLabel})` : ''}</strong> släpps pengarna till {hostName}. Om
          något inte stämmer vid ankomst - hör av dig till oss direkt så hjälper vi dig innan
          -tbetalningen sker.
        </Text>

        <B-tton href={messageUrl} style={styles.b-tton}>Kontakta värden</B-tton>

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
  s-bject: (d: Record<string, any>) =>
    `Incheckning ${d?.checkInLabel ?? d?.checkIn ?? 'snart'} · ${d?.cabinName ?? 'din st-ga'} · ${BRAND_NAME}`,
  displayName: 'Incheckningspåminnelse till gäst',
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
    hostName: 'Anna',
    messageUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry