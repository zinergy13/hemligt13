export type RetryCandidate = {
  status: string;
  template_name: string;
  last_status_code: number | null;
  booking_id: string | null;
};

export function retryBlockReason(
  row: RetryCandidate,
  bookingCheckIn?: string | null,
  today = new Date().toISOString().slice(0, 10),
): string | null {
  if (row.status === 'sent') return 'Det här utskicket är redan skickat.';
  if (row.template_name === 'payout-released') return 'Utbetalningsbesked är avstängda tills utbetalning har verifierats.';
  if (row.template_name === 'admin-email-alert') return 'Gamla administrativa varningar skickas inte om.';
  if (row.last_status_code === 403 || row.last_status_code === 401) {
    return 'Utskicket nekades permanent. Kontrollera e-postinställningarna innan ett nytt utskick skapas.';
  }
  if (row.template_name === 'checkin-reminder') {
    if (!row.booking_id || !bookingCheckIn) return 'Incheckningsdatum saknas. Påminnelsen kan inte skickas.';
    if (bookingCheckIn < today) return 'Incheckningsdatum har passerat. Påminnelsen skickas inte.';
  }
  return null;
}