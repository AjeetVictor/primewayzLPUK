import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type AppToastType = 'success' | 'error' | 'info' | 'warning';

export type AppToastOptions = {
  type: AppToastType;
  message: string;
};

type ToastItem = AppToastOptions & {
  id: string;
};

type ToastContextValue = {
  showToast: (options: AppToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<AppToastType, number | null> = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: null,
};

const toastStyles: Record<AppToastType, { container: string; icon: string }> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'text-emerald-600',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: 'text-sky-600',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
  },
};

function ToastIcon({ type }: { type: AppToastType }) {
  const className = `h-5 w-5 shrink-0 ${toastStyles[type].icon}`;
  if (type === 'success') return <CheckCircle2 className={className} aria-hidden="true" />;
  if (type === 'error') return <XCircle className={className} aria-hidden="true" />;
  if (type === 'warning') return <AlertTriangle className={className} aria-hidden="true" />;
  return <Info className={className} aria-hidden="true" />;
}

function ToastNotice({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const labelId = useId();

  useEffect(() => {
    const dismissMs = AUTO_DISMISS_MS[toast.type];
    if (dismissMs === null) return;

    const timer = window.setTimeout(() => onDismiss(toast.id), dismissMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-labelledby={labelId}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-zinc-900/10 ${toastStyles[toast.type].container}`}
    >
      <ToastIcon type={toast.type} />
      <p id={labelId} className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-current/60 transition hover:bg-black/5 hover:text-current"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: AppToastOptions) => {
    nextIdRef.current += 1;
    const id = `toast-${nextIdRef.current}`;
    setToasts((current) => [...current, { ...options, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-24 z-[110] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastNotice key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
