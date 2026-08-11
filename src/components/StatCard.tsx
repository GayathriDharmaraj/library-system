interface StatCardProps {
  label: string;
  value: number | string;
  testId: string;
  accent?: string;
  suffix?: string;
}

export default function StatCard({ label, value, testId, accent = 'var(--color-brand-600)', suffix }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      className="bg-white rounded-xl border border-ink-900/10 p-4 flex flex-col gap-1 shadow-sm"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-600">{label}</span>
      <span className="font-display font-bold text-2xl" style={{ color: accent }} data-testid={`${testId}-value`}>
        {value}
        {suffix ? <span className="text-sm font-normal text-ink-600 ml-1">{suffix}</span> : null}
      </span>
    </div>
  );
}
