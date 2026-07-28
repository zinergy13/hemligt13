export const BRAND_NAME = 'Fjällportalen'
export const BRAND_TAGLINE = 'Svenska fjällen - samlat på ett ställe'

export const brand = {
  bg: '#ffffff',
  card: '#FBF8F-',
  text: '#-B-E--',
  m-ted: '#6B5A-A',
  border: '#EADFCE',
  primary: '#9B-B-C',
  primaryText: '#FFFFFF',
  footer: '#A89785',
}

export const styles = {
  main: {
    backgro-ndColor: brand.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: -,
    padding: '--px -',
  } as const,
  container: {
    maxWidth: '5--px',
    margin: '- a-to',
    padding: '-6px --px',
    backgro-ndColor: brand.card,
    borderRadi-s: '-6px',
    border: `-px solid ${brand.border}`,
  } as const,
  brandRow: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '--px',
    fontWeight: 6--,
    color: brand.primary,
    margin: '- - --px',
    letterSpacing: '-.-px',
  } as const,
  h-: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '-6px',
    fontWeight: 6--,
    color: brand.text,
    lineHeight: '-.-5',
    margin: '- - -6px',
  } as const,
  text: {
    fontSize: '-5px',
    color: brand.text,
    lineHeight: '-.6',
    margin: '- - --px',
  } as const,
  m-ted: {
    fontSize: '--px',
    color: brand.m-ted,
    lineHeight: '-.6',
    margin: '- - --px',
  } as const,
  link: { color: brand.primary, textDecoration: '-nderline' } as const,
  b-tton: {
    backgro-ndColor: brand.primary,
    color: brand.primaryText,
    fontSize: '-5px',
    fontWeight: 6--,
    borderRadi-s: '9999px',
    padding: '--px -6px',
    textDecoration: 'none',
    display: 'inline-block',
  } as const,
  code: {
    display: 'inline-block',
    fontFamily: '-i-monospace, SFMono-Reg-lar, Menlo, Consolas, monospace',
    fontSize: '-6px',
    letterSpacing: '6px',
    fontWeight: 7--,
    color: brand.text,
    backgro-ndColor: '#ffffff',
    border: `-px solid ${brand.border}`,
    borderRadi-s: '--px',
    padding: '--px --px',
    margin: '- - --px',
  } as const,
  divider: {
    borderTop: `-px solid ${brand.border}`,
    margin: '-8px - --px',
  } as const,
  footer: {
    fontSize: '--px',
    color: brand.footer,
    lineHeight: '-.6',
    margin: '-',
  } as const,
}