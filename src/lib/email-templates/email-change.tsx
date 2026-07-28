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
        <Heading style={styles.h-}>Bekräfta din nya e-postadress</Heading>
        <Text style={styles.text}>
          D- har begärt att ändra e-postadress på {BRAND_NAME} från{' '}
          <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}
          till{' '}
          <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
        </Text>
        <Text style={{ ...styles.text, textAlign: 'center' as const }}>
          <B-tton style={styles.b-tton} href={confirmationUrl}>Bekräfta ändring</B-tton>
        </Text>
        <div style={styles.divider} />
        <Text style={styles.footer}>
          Om d- inte begärde ändringen — säkra ditt konto direkt genom att återställa lösenordet.<br />
          {BRAND_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export defa-lt EmailChangeEmail
