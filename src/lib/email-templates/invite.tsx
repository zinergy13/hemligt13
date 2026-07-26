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
import { BRAND_NAME, styles } from './_brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Du är inbjuden till {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Du är inbjuden</Heading>
        <Text style={styles.text}>
          Du har blivit inbjuden att gå med i{' '}
          <Link href={siteUrl} style={styles.link}>
            <strong>{BRAND_NAME}</strong>
          </Link>
          . Klicka på knappen nedan för att acceptera inbjudan och skapa ditt konto.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <Button style={styles.button} href={confirmationUrl}>Acceptera inbjudan</Button>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om du inte väntade dig den här inbjudan kan du ignorera mejlet.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
