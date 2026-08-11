import { daysBetween, todayISO } from './dateUtils';

export const FINE_PER_DAY = 10;

export const overdueDays = (dueDate: string, returnDate: string | null): number => {
  const compareDate = returnDate ?? todayISO();
  const diff = daysBetween(dueDate, compareDate);
  return diff > 0 ? diff : 0;
};

export const calculateFine = (dueDate: string, returnDate: string | null): number => {
  return overdueDays(dueDate, returnDate) * FINE_PER_DAY;
};

export const overdueSeverity = (days: number): 'none' | 'low' | 'medium' | 'high' => {
  if (days <= 0) return 'none';
  if (days <= 3) return 'low';
  if (days <= 7) return 'medium';
  return 'high';
};
