interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  testId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  testId,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/60 p-4"
      data-testid={`${testId}-overlay`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
    >
      <div className="w-full max-w-sm bg-paper-50 rounded-xl shadow-2xl border border-ink-900/10 p-6" data-testid={testId}>
        <h2 id={`${testId}-title`} className="font-display font-semibold text-lg text-ink-900 mb-2">
          {title}
        </h2>
        <p className="text-sm text-ink-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            data-testid={`${testId}-cancel`}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-ink-900/15 text-ink-800 hover:bg-ink-900/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid={`${testId}-confirm`}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              danger ? 'bg-rust-glow hover:bg-clay-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
