import { describe, it, expect } from 'vitest';
import { todayISO, addDays, daysBetween, formatDate, isFutureDate, isPastDate, monthLabel } from './dateUtils';

describe('todayISO', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the current date', () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(todayISO()).toBe(expected);
  });
});

describe('addDays', () => {
  it('adds positive days to a date', () => {
    expect(addDays('2026-01-01', 10)).toBe('2026-01-11');
  });

  it('subtracts days when given a negative value', () => {
    expect(addDays('2026-01-15', -5)).toBe('2026-01-10');
  });

  it('rolls over into the next month', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('rolls over into the next year', () => {
    expect(addDays('2025-12-30', 5)).toBe('2026-01-04');
  });

  it('handles zero days as a no-op', () => {
    expect(addDays('2026-03-15', 0)).toBe('2026-03-15');
  });

  it('handles leap year day correctly', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('daysBetween', () => {
  it('returns a positive number when "to" is after "from"', () => {
    expect(daysBetween('2026-01-01', '2026-01-11')).toBe(10);
  });

  it('returns a negative number when "to" is before "from"', () => {
    expect(daysBetween('2026-01-11', '2026-01-01')).toBe(-10);
  });

  it('returns 0 for the same date', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('spans month boundaries correctly', () => {
    expect(daysBetween('2026-01-25', '2026-02-05')).toBe(11);
  });
});

describe('formatDate', () => {
  it('returns an em dash for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats a date string into en-IN locale format', () => {
    expect(formatDate('2026-03-05')).toBe('05 Mar 2026');
  });
});

describe('isFutureDate', () => {
  it('returns true for a date after today', () => {
    expect(isFutureDate(addDays(todayISO(), 5))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isFutureDate(todayISO())).toBe(false);
  });

  it('returns false for a date before today', () => {
    expect(isFutureDate(addDays(todayISO(), -5))).toBe(false);
  });
});

describe('isPastDate', () => {
  it('returns true for a date before today', () => {
    expect(isPastDate(addDays(todayISO(), -5))).toBe(true);
  });

  it('returns false for today', () => {
    expect(isPastDate(todayISO())).toBe(false);
  });

  it('returns false for a date after today', () => {
    expect(isPastDate(addDays(todayISO(), 5))).toBe(false);
  });
});

describe('monthLabel', () => {
  it('returns the current month short label for offset 0', () => {
    const expected = new Date().toLocaleDateString('en-US', { month: 'short' });
    expect(monthLabel(0)).toBe(expected);
  });

  it('returns a valid 3-letter month abbreviation for any offset', () => {
    expect(monthLabel(3)).toMatch(/^[A-Z][a-z]{2}$/);
  });
});
