import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { BRAND_NAME, styles } from './_brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Återställ ditt lösenord på {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Återställ ditt lösenord</Heading>
        <Text style={styles.text}>
          Vi fick en begäran om att återställa lösenordet till ditt konto på {BRAND_NAME}. Klicka på knappen nedan för att välja ett nytt lösenord.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <Button style={styles.button} href={confirmationUrl}>Välj nytt lösenord</Button>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om du inte begärde en återställning kan du ignorera mejlet — ditt lösenord förblir oförändrat.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
