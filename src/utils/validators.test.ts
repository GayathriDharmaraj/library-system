import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, isValidISBN, isStrongPassword, passwordRules } from './validators';

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('admin@library.com')).toBe(true);
  });

  it('accepts an email with surrounding whitespace', () => {
    expect(isValidEmail('  admin@library.com  ')).toBe(true);
  });

  it('rejects an email missing the @ symbol', () => {
    expect(isValidEmail('admin.library.com')).toBe(false);
  });

  it('rejects an email missing a domain extension', () => {
    expect(isValidEmail('admin@library')).toBe(false);
  });

  it('rejects an email with spaces inside it', () => {
    expect(isValidEmail('ad min@library.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts a 10-digit number', () => {
    expect(isValidPhone('9876543210')).toBe(true);
  });

  it('accepts a number with a leading +', () => {
    expect(isValidPhone('+919876543210')).toBe(true);
  });

  it('accepts a number with spaces or dashes', () => {
    expect(isValidPhone('987-654-3210')).toBe(true);
    expect(isValidPhone('98765 43210')).toBe(true);
  });

  it('rejects a number shorter than 10 digits', () => {
    expect(isValidPhone('12345')).toBe(false);
  });

  it('rejects a number longer than 13 digits', () => {
    expect(isValidPhone('12345678901234')).toBe(false);
  });

  it('rejects a number containing letters', () => {
    expect(isValidPhone('98765abc10')).toBe(false);
  });
});

describe('isValidISBN', () => {
  it('accepts a valid 10-digit ISBN', () => {
    expect(isValidISBN('0743273567')).toBe(true);
  });

  it('accepts a valid 13-digit ISBN starting with 978', () => {
    expect(isValidISBN('9780743273565')).toBe(true);
  });

  it('accepts a valid 13-digit ISBN starting with 979', () => {
    expect(isValidISBN('9791234567896')).toBe(true);
  });

  it('accepts hyphenated ISBNs', () => {
    expect(isValidISBN('978-0-7432-7356-5')).toBe(true);
  });

  it('accepts a 10-digit ISBN ending in X', () => {
    expect(isValidISBN('080442957X')).toBe(true);
  });

  it('rejects an ISBN with the wrong length', () => {
    expect(isValidISBN('12345')).toBe(false);
  });

  it('rejects a 13-digit ISBN not prefixed with 978/979', () => {
    expect(isValidISBN('1234567890123')).toBe(false);
  });

  it('rejects non-numeric characters other than a trailing X', () => {
    expect(isValidISBN('97807432735A5')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('accepts a password meeting all requirements', () => {
    expect(isStrongPassword('Admin@123')).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(isStrongPassword('Ab@1')).toBe(false);
  });

  it('rejects a password missing an uppercase letter', () => {
    expect(isStrongPassword('admin@123')).toBe(false);
  });

  it('rejects a password missing a lowercase letter', () => {
    expect(isStrongPassword('ADMIN@123')).toBe(false);
  });

  it('rejects a password missing a number', () => {
    expect(isStrongPassword('Admin@abc')).toBe(false);
  });

  it('rejects a password missing a special character', () => {
    expect(isStrongPassword('Admin1234')).toBe(false);
  });
});

describe('passwordRules', () => {
  it('defines exactly 5 rules', () => {
    expect(passwordRules).toHaveLength(5);
  });

  it('all rules pass for a fully compliant password', () => {
    passwordRules.forEach((rule) => {
      expect(rule.test('Admin@123')).toBe(true);
    });
  });

  it('all rules fail for an empty string', () => {
    passwordRules.forEach((rule) => {
      expect(rule.test('')).toBe(false);
    });
  });

  it('only the length rule fails for a short but otherwise compliant password', () => {
    const shortPw = 'Ab1@';
    const results = passwordRules.map((rule) => ({ label: rule.label, pass: rule.test(shortPw) }));
    const lengthResult = results.find((r) => r.label === 'At least 8 characters');
    expect(lengthResult?.pass).toBe(false);
    expect(results.filter((r) => r.label !== 'At least 8 characters').every((r) => r.pass)).toBe(true);
  });
});
