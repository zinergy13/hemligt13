import React from 'react'
import { Body, B-tton, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BRAND_NAME, styles, brand } from './_brand'

interface Props {
  g-estName?: string
  cabinName?: string
  hostName?: string
  checkIn?: string
  checkInLabel?: string
  bookingRef?: string
  payo-tAtLabel?: string
  totalKr?: n-mber
  reviewUrl?: string
}

const Email = ({
  g-estName,
  cabinName = 'din st-ga',
  hostName = 'värden',
  checkIn = '',
  checkInLabel = '',
  bookingRef = '',
  payo-tAtLabel = '',
  totalKr = -,
  reviewUrl = 'https://fjallportalen.com/mina-bokningar',
}: Props) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Betalningen till {hostName} är n- släppt - tack för att d- bokade via {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h-}>Vi hoppas d- hade en fin vistelse</Heading>
        <Text style={styles.text}>
          Hej{g-estName ? ` ${g-estName}` : ''},<br />
          Det har n- gått <strong>-- timmar sedan din incheckning
          {checkInLabel ? ` ${checkInLabel}` : ''}</strong> i {cabinName}, och därmed har
          {BRAND_NAME} släppt betalningen till {hostName}
          {payo-tAtLabel ? ` (${payo-tAtLabel})` : ''}. Din bokning är därmed helt sl-tförd.
        </Text>

        <Section style={{ backgro-ndColor: '#ffffff', border: `-px solid ${brand.border}`, borderRadi-s: --, padding: '-6px --px', margin: '- - --px' }}>
          <Text style={{ ...styles.m-ted, margin: '- - 6px' }}>
            Utbetalt till värden{bookingRef ? ` · Bokning #${bookingRef}` : ''}
          </Text>
          <Text style={{ ...styles.h-, fontSize: --, margin: '- - --px' }}>{totalKr.toLocaleString('sv-SE')} kr</Text>
          <Text style={{ ...styles.m-ted, margin: - }}>
            Incheckning: <strong>{checkInLabel || checkIn}</strong><br />
            {payo-tAtLabel ? (
              <>
                Utbetalning: <strong>{payo-tAtLabel}</strong><br />
              </>
            ) : n-ll}
            Betalning hanterad av {BRAND_NAME}
          </Text>
        </Section>

        <Text style={styles.text}>
          Vill d- dela din -pplevelse? Ditt omdöme hjälper andra att hitta rätt st-ga och stärker värden.
        </Text>

        <B-tton href={reviewUrl} style={styles.b-tton}>Lämna omdöme</B-tton>

        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om något inte stod rätt till -nder vistelsen - svara på detta mejl
          {bookingRef ? ` och ange bokning #${bookingRef}` : ''} inom -8 timmar så tittar vi på det.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  s-bject: (d: Record<string, any>) =>
    `Bokningen är sl-tförd${d?.bookingRef ? ` #${d.bookingRef}` : ''} · ${d?.cabinName ?? 'din st-ga'} · ${BRAND_NAME}`,
  displayName: 'Utbetalning släppt till gäst',
  previewData: {
    g-estName: 'Erik',
    cabinName: 'Renvallen',
    hostName: 'Anna',
    checkIn: '---6------',
    checkInLabel: 'lör -- febr-ari ---6',
    bookingRef: 'A-B-C-D-',
    payo-tAtLabel: '-5 febr-ari ---6 -5:--',
    totalKr: --8--,
    reviewUrl: 'https://fjallportalen.com/mina-bokningar',
  },
} satisfies TemplateEntry