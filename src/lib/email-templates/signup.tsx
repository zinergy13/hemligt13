import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { BRAND_NAME, BRAND_TAGLINE, styles } from './_brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta din e-post för {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Välkommen till fjällen</Heading>
        <Text style={styles.text}>
          Tack för att du skapar konto på{' '}
          <Link href={siteUrl} style={styles.link}>
            <strong>{BRAND_NAME}</strong>
          </Link>
          . Bekräfta din e-postadress{' '}
          <Link href={`mailto:${recipient}`} style={styles.link}>{recipient}</Link>{' '}
          genom att klicka på knappen nedan.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <Button style={styles.button} href={confirmationUrl}>
            Bekräfta e-post
          </Button>
        </Text>
        <Text style={styles.muted}>
          Länken är giltig i 24 timmar. Om knappen inte fungerar kan du kopiera adressen och klistra in i din webbläsare.
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om du inte skapade ett konto kan du ignorera det här mejlet.<br />
          {BRAND_NAME} - {BRAND_TAGLINE}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
