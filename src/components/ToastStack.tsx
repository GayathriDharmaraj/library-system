import { useToast } from '../context/ToastContext';

const styles: Record<string, string> = {
  success: 'bg-moss-600 border-moss-600',
  error: 'bg-rust-glow border-rust-glow',
  info: 'bg-brand-600 border-brand-600',
};

export default function ToastStack() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96"
      data-testid="toast-container"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid={`toast-${toast.type}`}
          role="status"
          className={`text-white rounded-lg shadow-lg px-4 py-3 flex items-start justify-between gap-3 border ${styles[toast.type]}`}
        >
          <span className="text-sm font-medium">{toast.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            data-testid="toast-dismiss"
            onClick={() => dismissToast(toast.id)}
            className="text-white/80 hover:text-white leading-none text-lg"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
