export const BRAND_NAME = 'Fjällportalen'
export const BRAND_TAGLINE = 'Svenska fjällen — samlat på ett ställe'

export const brand = {
  bg: '#ffffff',
  card: '#FBF8F1',
  text: '#2B1E14',
  muted: '#6B5A4A',
  border: '#EADFCE',
  primary: '#9B3B2C',
  primaryText: '#FFFFFF',
  footer: '#A89785',
}

export const styles = {
  main: {
    backgroundColor: brand.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: '32px 0',
  } as const,
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '36px 32px',
    backgroundColor: brand.card,
    borderRadius: '16px',
    border: `1px solid ${brand.border}`,
  } as const,
  brandRow: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '20px',
    fontWeight: 600,
    color: brand.primary,
    margin: '0 0 24px',
    letterSpacing: '0.2px',
  } as const,
  h1: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '26px',
    fontWeight: 600,
    color: brand.text,
    lineHeight: '1.25',
    margin: '0 0 16px',
  } as const,
  text: {
    fontSize: '15px',
    color: brand.text,
    lineHeight: '1.6',
    margin: '0 0 20px',
  } as const,
  muted: {
    fontSize: '13px',
    color: brand.muted,
    lineHeight: '1.6',
    margin: '0 0 20px',
  } as const,
  link: { color: brand.primary, textDecoration: 'underline' } as const,
  button: {
    backgroundColor: brand.primary,
    color: brand.primaryText,
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '9999px',
    padding: '13px 26px',
    textDecoration: 'none',
    display: 'inline-block',
  } as const,
  code: {
    display: 'inline-block',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '26px',
    letterSpacing: '6px',
    fontWeight: 700,
    color: brand.text,
    backgroundColor: '#ffffff',
    border: `1px solid ${brand.border}`,
    borderRadius: '10px',
    padding: '14px 22px',
    margin: '0 0 24px',
  } as const,
  divider: {
    borderTop: `1px solid ${brand.border}`,
    margin: '28px 0 20px',
  } as const,
  footer: {
    fontSize: '12px',
    color: brand.footer,
    lineHeight: '1.6',
    margin: '0',
  } as const,
}