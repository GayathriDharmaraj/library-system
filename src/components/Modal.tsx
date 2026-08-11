import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  testId: string;
  widthClass?: string;
}

export default function Modal({ open, onClose, title, children, testId, widthClass = 'max-w-lg' }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4"
      data-testid={`${testId}-overlay`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
    >
      <div
        className={`w-full ${widthClass} bg-paper-50 rounded-xl shadow-2xl border border-ink-900/10 max-h-[90vh] overflow-y-auto thin-scroll`}
        data-testid={testId}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-900/10 sticky top-0 bg-paper-50">
          <h2 id={`${testId}-title`} className="font-display font-semibold text-lg text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid={`${testId}-close`}
            className="text-ink-600 hover:text-ink-900 text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
