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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Bekräfta byte av e-postadress på {BRAND_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Text style={styles.brandRow}>{BRAND_NAME}</Text>
        <Heading style={styles.h1}>Bekräfta din nya e-postadress</Heading>
        <Text style={styles.text}>
          Du har begärt att ändra e-postadress på {BRAND_NAME} från{' '}
          <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}
          till{' '}
          <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <Button style={styles.button} href={confirmationUrl}>Bekräfta ändring</Button>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om du inte begärde ändringen — säkra ditt konto direkt genom att återställa lösenordet.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
