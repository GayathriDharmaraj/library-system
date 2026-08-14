import { describe, it, expect } from 'vitest';
import { getBookLimit, BOOK_LIMITS } from './membership';

describe('getBookLimit', () => {
  it('returns 5 for Basic', () => {
    expect(getBookLimit('Basic')).toBe(5);
  });

  it('returns 3 for Student', () => {
    expect(getBookLimit('Student')).toBe(3);
  });

  it('returns null (unlimited) for Premium', () => {
    expect(getBookLimit('Premium')).toBeNull();
  });

  it('BOOK_LIMITS defines exactly the three membership types', () => {
    expect(Object.keys(BOOK_LIMITS).sort()).toEqual(['Basic', 'Premium', 'Student']);
  });
});
