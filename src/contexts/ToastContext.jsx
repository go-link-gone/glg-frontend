import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ pushToast: () => {} });

let id = 0;

const TONE = {
  success: {
    icon: 'check_circle',
    accent: 'rgb(var(--c-success))',
    iconClass: 'text-success',
  },
  error: {
    icon: 'error',
    accent: 'rgb(var(--c-error))',
    iconClass: 'text-error',
  },
  info: {
    icon: 'info',
    accent: 'rgb(var(--c-primary))',
    iconClass: 'text-primary',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const t = { id: ++id, type: 'info', ...toast };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, t.duration ?? 4200);
  }, []);

  const remove = (tid) => setToasts((prev) => prev.filter((x) => x.id !== tid));

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2.5">
        {toasts.map((t) => {
          const tone = TONE[t.type] ?? TONE.info;
          return (
            <div
              key={t.id}
              className="toast-enter pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-4 pr-3 shadow-elevated"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: tone.accent }}
              />
              <span className={`material-symbols-outlined mt-0.5 ${tone.iconClass}`} style={{ fontSize: 20 }}>
                {tone.icon}
              </span>
              <div className="flex-1 text-body-sm leading-snug text-on-surface">
                {t.title && <div className="font-semibold">{t.title}</div>}
                {t.message && <div className="mt-0.5 text-on-surface-variant">{t.message}</div>}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => remove(t.id)}
                className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
