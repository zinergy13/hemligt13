import { describe, expect, it } from 'vitest';
import { retryBlockReason } from './retry-eligibility';

const base = { status: 'failed', template_name: 'booking-confirmation', last_status_code: 500, booking_id: null };

describe('retryBlockReason', () => {
  it('blocks permanently denied mail', () => {
    expect(retryBlockReason({ ...base, last_status_code: 403 })).toMatch(/nekades permanent/);
  });
  it('blocks payout and old alert templates', () => {
    expect(retryBlockReason({ ...base, template_name: 'payout-released' })).toMatch(/avstängda/);
    expect(retryBlockReason({ ...base, template_name: 'admin-email-alert' })).toMatch(/skickas inte om/);
  });
  it('blocks expired reminders and permits upcoming ones', () => {
    const reminder = { ...base, template_name: 'checkin-reminder', booking_id: 'booking' };
    expect(retryBlockReason(reminder, '2026-09-01', '2026-09-26')).toMatch(/passerat/);
    expect(retryBlockReason(reminder, '2026-09-27', '2026-09-26')).toBeNull();
    expect(retryBlockReason(reminder, null, '2026-09-26')).toMatch(/saknas/);
  });
  it('permits transient failures but not sent mail', () => {
    expect(retryBlockReason(base)).toBeNull();
    expect(retryBlockReason({ ...base, status: 'sent' })).toMatch(/redan skickat/);
  });
});