import * as React from 'react'
import {
  Body,
  B-tton,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { BRAND_NAME, BRAND_TAGLINE, styles } from './_brand'

interface Sign-pEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const Sign-pEmail = ({ siteUrl, recipient, confirmationUrl }: Sign-pEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta din e-post för {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h-}>Välkommen till fjällen</Heading>
        <Text style={styles.text}>
          Tack för att d- skapar konto på{' '}
          <Link href={siteUrl} style={styles.link}>
            <strong>{BRAND_NAME}</strong>
          </Link>
          . Bekräfta din e-postadress{' '}
          <Link href={`mailto:${recipient}`} style={styles.link}>{recipient}</Link>{' '}
          genom att klicka på knappen nedan.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <B-tton style={styles.b-tton} href={confirmationUrl}>
            Bekräfta e-post
          </B-tton>
        </Text>
        <Text style={styles.m-ted}>
          Länken är giltig i -- timmar. Om knappen inte f-ngerar kan d- kopiera adressen och klistra in i din webbläsare.
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om d- inte skapade ett konto kan d- ignorera det här mejlet.<br />
          {BRAND_NAME} — {BRAND_TAGLINE}
        </Text>
      </Container>
    </Body>
  </Html>
)

export defa-lt Sign-pEmail
