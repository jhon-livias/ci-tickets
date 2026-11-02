import { businessDaysBetween, canReopenTicket, nextTicketCode, weekBounds } from './ticket-labels';

describe('ticket labels', () => {
  it('builds a sequential area code for the month', () => {
    expect(nextTicketCode('TI', ['TI260100001'], new Date('2026-01-15T10:00:00'))).toBe('TI260100002');
    expect(nextTicketCode('TI', [], new Date('2026-01-15T10:00:00'))).toBe('TI260100001');
  });

  it('allows reopen only within five business days', () => {
    expect(canReopenTicket('2026-10-23T12:00:00', 'RESOLVED', new Date('2026-10-24T09:00:00'))).toBe(true);
    expect(canReopenTicket('2026-10-01T12:00:00', 'RESOLVED', new Date('2026-10-20T09:00:00'))).toBe(false);
    expect(canReopenTicket('2026-10-23T12:00:00', 'CREATED', new Date('2026-10-24T09:00:00'))).toBe(false);
  });

  it('counts business days excluding weekends', () => {
    expect(businessDaysBetween('2026-10-23T12:00:00', new Date('2026-10-26T09:00:00'))).toBe(1);
  });

  it('returns monday to sunday for a midweek date', () => {
    expect(weekBounds(new Date('2026-10-21T12:00:00'))).toEqual({ from: '2026-10-19', to: '2026-10-25' });
  });
});
