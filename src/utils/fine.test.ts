import { describe, it, expect } from 'vitest';
import { overdueDays, calculateFine, overdueSeverity, FINE_PER_DAY } from './fine';
import { addDays, todayISO } from './dateUtils';

describe('overdueDays', () => {
  it('returns 0 when returned on the due date', () => {
    expect(overdueDays('2026-01-10', '2026-01-10')).toBe(0);
  });

  it('returns 0 when returned before the due date', () => {
    expect(overdueDays('2026-01-10', '2026-01-05')).toBe(0);
  });

  it('returns the number of days late when returned after the due date', () => {
    expect(overdueDays('2026-01-10', '2026-01-15')).toBe(5);
  });

  it('uses today as the comparison date when returnDate is null', () => {
    const dueDate = addDays(todayISO(), -7);
    expect(overdueDays(dueDate, null)).toBe(7);
  });

  it('returns 0 for a null returnDate when the due date is in the future', () => {
    const dueDate = addDays(todayISO(), 7);
    expect(overdueDays(dueDate, null)).toBe(0);
  });
});

describe('calculateFine', () => {
  it('is 0 when there is no overdue period', () => {
    expect(calculateFine('2026-01-10', '2026-01-10')).toBe(0);
  });

  it('multiplies overdue days by FINE_PER_DAY', () => {
    expect(calculateFine('2026-01-10', '2026-01-13')).toBe(3 * FINE_PER_DAY);
  });

  it('computes fine against today when returnDate is null', () => {
    const dueDate = addDays(todayISO(), -4);
    expect(calculateFine(dueDate, null)).toBe(4 * FINE_PER_DAY);
  });
});

describe('overdueSeverity', () => {
  it('returns "none" for 0 days', () => {
    expect(overdueSeverity(0)).toBe('none');
  });

  it('returns "none" for negative days', () => {
    expect(overdueSeverity(-2)).toBe('none');
  });

  it('returns "low" for 1-3 days', () => {
    expect(overdueSeverity(1)).toBe('low');
    expect(overdueSeverity(3)).toBe('low');
  });

  it('returns "medium" for 4-7 days', () => {
    expect(overdueSeverity(4)).toBe('medium');
    expect(overdueSeverity(7)).toBe('medium');
  });

  it('returns "high" for more than 7 days', () => {
    expect(overdueSeverity(8)).toBe('high');
    expect(overdueSeverity(100)).toBe('high');
  });
});
