export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string): number => {
  const a = new Date(from);
  const b = new Date(to);
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const isFutureDate = (dateStr: string): boolean => {
  return new Date(dateStr).getTime() > new Date(todayISO()).getTime();
};

export const isPastDate = (dateStr: string): boolean => {
  return new Date(dateStr).getTime() < new Date(todayISO()).getTime();
};

export const monthLabel = (offsetFromNow: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetFromNow);
  return d.toLocaleDateString('en-US', { month: 'short' });
};
