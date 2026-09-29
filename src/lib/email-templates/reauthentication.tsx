import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { BRAND_NAME, styles } from './_brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din verifieringskod till {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Bekräfta din identitet</Heading>
        <Text style={styles.text}>Använd koden nedan för att verifiera dig:</Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <span style={styles.code}>{token}</span>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Koden går ut inom kort. Om du inte begärde denna verifiering kan du ignorera mejlet.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
