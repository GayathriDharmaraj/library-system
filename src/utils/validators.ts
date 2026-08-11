export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPhone = (value: string): boolean =>
  /^[+]?[0-9]{10,13}$/.test(value.trim().replace(/[\s-]/g, ''));

export const isValidISBN = (value: string): boolean => {
  const clean = value.replace(/[-\s]/g, '');
  return /^(97(8|9))?\d{9}(\d|X)$/.test(clean) && (clean.length === 10 || clean.length === 13);
};

export const isStrongPassword = (value: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(value);

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /\d/.test(v) },
  { label: 'One special character', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];
