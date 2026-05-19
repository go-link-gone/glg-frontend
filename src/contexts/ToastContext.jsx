import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ pushToast: () => {} });

let id = 0;

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
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const styles =
            t.type === 'error'
              ? 'bg-error-container border-error/30 text-on-error-container'
              : t.type === 'success'
              ? 'bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-surface-container-lowest border-outline-variant text-on-surface';
          const icon =
            t.type === 'error' ? 'error' : t.type === 'success' ? 'check_circle' : 'info';
          return (
            <div
              key={t.id}
              className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-elevated ${styles}`}
            >
              <span className="material-symbols-outlined mt-0.5">{icon}</span>
              <div className="flex-1 text-body-sm leading-snug">
                {t.title && <div className="font-semibold">{t.title}</div>}
                {t.message && <div className="opacity-90">{t.message}</div>}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => remove(t.id)}
                className="text-current opacity-60 hover:opacity-100"
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
