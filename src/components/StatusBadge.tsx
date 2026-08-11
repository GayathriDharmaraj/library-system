interface StatusBadgeProps {
  status: string;
  testId?: string;
}

const colorMap: Record<string, string> = {
  Available: 'bg-moss-500/15 text-moss-600 border-moss-500/30',
  Unavailable: 'bg-rust-glow/15 text-rust-glow border-rust-glow/30',
  Active: 'bg-moss-500/15 text-moss-600 border-moss-500/30',
  Inactive: 'bg-ink-600/10 text-ink-600 border-ink-600/20',
  Issued: 'bg-brand-500/15 text-brand-700 border-brand-500/30',
  Returned: 'bg-moss-500/15 text-moss-600 border-moss-500/30',
  Overdue: 'bg-rust-glow/15 text-rust-glow border-rust-glow/30',
};

export default function StatusBadge({ status, testId }: StatusBadgeProps) {
  const cls = colorMap[status] ?? 'bg-ink-600/10 text-ink-600 border-ink-600/20';
  return (
    <span
      data-testid={testId ?? `status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
}
