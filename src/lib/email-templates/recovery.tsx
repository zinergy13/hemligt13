import * as React from 'react'
import {
  Body,
  B-tton,
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
        <Heading style={styles.h-}>Återställ ditt lösenord</Heading>
        <Text style={styles.text}>
          Vi fick en begäran om att återställa lösenordet till ditt konto på {BRAND_NAME}. Klicka på knappen nedan för att välja ett nytt lösenord.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <B-tton style={styles.b-tton} href={confirmationUrl}>Välj nytt lösenord</B-tton>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om d- inte begärde en återställning kan d- ignorera mejlet — ditt lösenord förblir oförändrat.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export defa-lt RecoveryEmail
