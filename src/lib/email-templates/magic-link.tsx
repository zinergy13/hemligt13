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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din inloggningslänk till {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Din inloggningslänk</Heading>
        <Text style={styles.text}>
          Klicka på knappen nedan för att logga in på {BRAND_NAME}. Länken går ut inom kort.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <Button style={styles.button} href={confirmationUrl}>Logga in</Button>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om du inte begärde denna länk kan du ignorera mejlet.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
