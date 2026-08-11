interface EmptyStateProps {
  title: string;
  message: string;
  testId: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, message, testId, action }: EmptyStateProps) {
  return (
    <div data-testid={testId} className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-ink-900/5 flex items-center justify-center mb-4 stamp text-ink-600 text-lg">
        ∅
      </div>
      <h3 className="font-display font-semibold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-600 max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
